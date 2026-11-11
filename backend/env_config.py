"""Load local server configuration without overriding the process environment."""

import os
from pathlib import Path

from dotenv import load_dotenv


def load_project_env(path: Path | None = None, *, ignore_skip: bool = False) -> None:
    if not ignore_skip and os.environ.get('T2F_SKIP_ENV_FILE') == '1':
        return
    env_path = path if path is not None else Path(__file__).resolve().parent.parent / '.env'
    load_dotenv(env_path, override=False, interpolate=False, encoding='utf-8-sig')
