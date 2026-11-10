"""Bounded, local-only bridge to the existing TypeScript tutor."""

import json
import subprocess
import threading
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

ROOT = Path(__file__).resolve().parent.parent
BRIDGE = ROOT / "tutor-ia" / "server-bridge.ts"
MAX_OUTPUT = 65536
TIMEOUT_SECONDS = 5
_slots = threading.BoundedSemaphore(4)


class Source(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    label: str = Field(max_length=500)
    url: str = Field(max_length=2048)
    checkedAt: str | None = Field(default=None, max_length=100)


class Reply(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    text: str = Field(min_length=1, max_length=3000)
    language: Literal["es", "en"]
    mode: Literal["local", "api"]
    provider: str = Field(max_length=100)
    intent: str = Field(max_length=100)
    sources: list[Source] = Field(max_length=20)


class TutorUnavailable(Exception):
    pass


def reply(payload: dict) -> dict:
    if not _slots.acquire(blocking=False):
        raise TutorUnavailable()
    process = None
    try:
        data = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        if len(data) > MAX_OUTPUT:
            raise TutorUnavailable()
        process = subprocess.Popen(
            ["node", "--experimental-strip-types", str(BRIDGE)],
            cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL, shell=False,
        )
        output = bytearray()

        def read_output():
            output.extend(process.stdout.read(MAX_OUTPUT + 1))
            if len(output) > MAX_OUTPUT:
                process.kill()

        def write_input():
            try:
                process.stdin.write(data)
                process.stdin.close()
            except (BrokenPipeError, OSError, ValueError):
                pass

        reader = threading.Thread(target=read_output, daemon=True)
        writer = threading.Thread(target=write_input, daemon=True)
        reader.start()
        writer.start()
        try:
            process.wait(timeout=TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise TutorUnavailable() from None
        reader.join(timeout=1)
        writer.join(timeout=1)
        if reader.is_alive() or writer.is_alive() or process.returncode != 0 or len(output) > MAX_OUTPUT:
            raise TutorUnavailable()
        result = Reply.model_validate_json(bytes(output))
        if result.language != payload["context"]["language"]:
            raise TutorUnavailable()
        result.mode = "api"
        result.provider = "server_rules"
        return result.model_dump(mode="json", exclude_none=True)
    except (OSError, ValueError, KeyError, ValidationError):
        raise TutorUnavailable() from None
    finally:
        if process is not None and process.poll() is None:
            process.kill()
            process.wait()
        if process is not None:
            for pipe in (process.stdin, process.stdout, process.stderr):
                if pipe is not None and not pipe.closed:
                    pipe.close()
        _slots.release()
