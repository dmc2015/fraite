"""Agent tools.

Phase 1 ships one real tool: `lookup_carrier`. The LLM decides whether to call
it based on the MC number extracted from the email.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_CARRIERS_PATH = Path(__file__).parent.parent / "data" / "carriers.json"


LOOKUP_CARRIER_SCHEMA: dict[str, Any] = {
    "name": "lookup_carrier",
    "description": (
        "Look up a motor carrier by MC (Motor Carrier) number against the internal "
        "carrier directory. Returns name, status (active/inactive), DOT number, "
        "headquarters city/state, and typical equipment types. Call this when you "
        "find an MC number in the email and want to verify the carrier is active."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "mc_number": {
                "type": "string",
                "description": (
                    "The MC number as a bare string of digits, e.g. '823456'. "
                    "Strip any 'MC' prefix, hyphens, or whitespace."
                ),
            },
        },
        "required": ["mc_number"],
    },
}


def _load_carriers() -> dict[str, dict[str, Any]]:
    with _CARRIERS_PATH.open() as f:
        return json.load(f)


def lookup_carrier(mc_number: str) -> dict[str, Any]:
    carriers = _load_carriers()
    key = str(mc_number).strip().lstrip("MCmc").strip("- ")
    carrier = carriers.get(key)
    if carrier is None:
        return {"found": False, "mc_number": key}
    return {"found": True, **carrier}


TOOL_SCHEMAS: list[dict[str, Any]] = [LOOKUP_CARRIER_SCHEMA]

TOOL_DISPATCH = {
    "lookup_carrier": lambda args: lookup_carrier(**args),
}


def dispatch(name: str, args: dict[str, Any]) -> dict[str, Any]:
    if name not in TOOL_DISPATCH:
        return {"error": f"unknown tool: {name}"}
    return TOOL_DISPATCH[name](args)
