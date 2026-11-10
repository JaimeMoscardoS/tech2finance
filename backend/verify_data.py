"""Verify the local frozen dataset without accepting external inputs."""
import json

from backend.domain.provenance import load_verified_dataset


if __name__ == '__main__':
    _, metadata = load_verified_dataset()
    print(json.dumps(metadata, sort_keys=True))
