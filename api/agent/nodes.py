"""LangGraph nodes.

Design:
- Deterministic nodes: parse_eml, emit_record, flag_for_review.
- LLM nodes: classify, extract (with tool use), verify.
- Each node appends one or more TraceStep records so the frontend can render
  the full agent trajectory.
"""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from email import message_from_string
from typing import Any, TypedDict

import anthropic

from .schemas import (
    Classification,
    EmailInput,
    ParsedEmail,
    TraceStep,
    VerifierResult,
)
from .tools import TOOL_SCHEMAS, dispatch

MODEL = "claude-sonnet-4-6"
MAX_TOOL_CALLS = 4
CONFIDENCE_THRESHOLD = 0.7


class AgentState(TypedDict, total=False):
    email_input: dict[str, Any]
    parsed: dict[str, Any]
    classification: dict[str, Any]
    extracted: dict[str, Any]
    carrier: dict[str, Any] | None
    verifier: dict[str, Any]
    trace: list[dict[str, Any]]
    final_action: str


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def _trace(
    node: str,
    started_at: float,
    summary: str,
    inputs: dict[str, Any] | None = None,
    outputs: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return TraceStep(
        node=node,
        timestamp=_now_iso(),
        duration_ms=int((time.perf_counter() - started_at) * 1000),
        summary=summary,
        inputs=inputs or {},
        outputs=outputs or {},
    ).model_dump()


def parse_eml_node(state: AgentState) -> AgentState:
    """Parse the incoming email into a ParsedEmail. Deterministic."""
    t0 = time.perf_counter()
    data = EmailInput.model_validate(state["email_input"])

    if data.raw:
        msg = message_from_string(data.raw)
        from_addr = msg.get("From", "")
        to_addr = msg.get("To", "")
        subject = msg.get("Subject", "")
        date = msg.get("Date", "")
        if msg.is_multipart():
            body = "\n".join(
                part.get_payload(decode=True).decode("utf-8", errors="replace")
                for part in msg.walk()
                if part.get_content_type() == "text/plain"
            )
        else:
            payload = msg.get_payload(decode=True)
            body = payload.decode("utf-8", errors="replace") if isinstance(payload, bytes) else str(payload or "")
    else:
        from_addr = data.from_addr or ""
        to_addr = data.to_addr or ""
        subject = data.subject or ""
        date = data.date or ""
        body = data.body or ""

    parsed = ParsedEmail(
        from_addr=from_addr,
        to_addr=to_addr,
        subject=subject,
        date=date,
        body=body,
    )

    trace = list(state.get("trace", []))
    trace.append(
        _trace(
            "parse_eml",
            t0,
            f"Parsed email from {from_addr!r}, subject {subject!r}, {len(body.splitlines())} body lines",
            outputs={"from": from_addr, "subject": subject, "body_lines": len(body.splitlines())},
        )
    )
    return {"parsed": parsed.model_dump(), "trace": trace}


def classify_node(state: AgentState) -> AgentState:
    """Ask the LLM to classify the email type. Strict JSON output."""
    t0 = time.perf_counter()
    parsed = state["parsed"]

    prompt = (
        "You classify freight carrier emails. Based on the email below, decide which "
        "ONE of these types best fits:\n"
        "- load_confirmation: a dispatcher confirms load tender with pickup/delivery/rate\n"
        "- rate_update: carrier quoting or revising a rate\n"
        "- eta_update: driver/dispatch updating arrival time\n"
        "- exception: delay, damage, missed pickup, or other issue\n"
        "- invoice: billing / payment request\n"
        "- unknown: none of the above\n\n"
        f"Subject: {parsed['subject']}\n"
        f"From: {parsed['from_addr']}\n\n"
        f"Body:\n{parsed['body']}\n\n"
        'Return JSON only: {"email_type": "...", "confidence": 0.0-1.0, "reasoning": "one short sentence"}'
    )

    resp = _client().messages.create(
        model=MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(b.text for b in resp.content if b.type == "text")
    try:
        parsed_json = json.loads(text[text.index("{") : text.rindex("}") + 1])
        classification = Classification.model_validate(parsed_json)
    except (ValueError, json.JSONDecodeError, Exception):
        classification = Classification(
            email_type="unknown", confidence=0.0, reasoning="parse_error"
        )

    trace = list(state.get("trace", []))
    trace.append(
        _trace(
            "classify",
            t0,
            f"Classified as {classification.email_type} (confidence {classification.confidence:.2f})",
            outputs=classification.model_dump(),
        )
    )
    return {"classification": classification.model_dump(), "trace": trace}


def extract_node(state: AgentState) -> AgentState:
    """Extract structured fields. LLM may call the lookup_carrier tool.

    Bounded tool loop — max MAX_TOOL_CALLS invocations.
    """
    t0 = time.perf_counter()
    parsed = state["parsed"]
    classification = state["classification"]
    email_type = classification["email_type"]

    schema_hint = _schema_hint_for(email_type)
    prompt = (
        f"You are extracting structured fields from a freight {email_type} email.\n"
        "You have one tool available: `lookup_carrier(mc_number)` to verify the carrier.\n"
        "Use the tool when the email contains an MC number so we can confirm the carrier "
        "is active and get canonical details.\n\n"
        f"Expected output fields: {schema_hint}\n\n"
        f"Subject: {parsed['subject']}\n"
        f"From: {parsed['from_addr']}\n\n"
        f"Body:\n{parsed['body']}\n\n"
        "After any tool calls, respond with a final JSON object containing the extracted "
        'fields. Use the exact field names above. Return `null` for any field you cannot find.'
    )

    client = _client()
    messages: list[dict[str, Any]] = [{"role": "user", "content": prompt}]
    tool_calls_made: list[dict[str, Any]] = []
    tool_results_log: list[dict[str, Any]] = []
    carrier_info: dict[str, Any] | None = None

    for _ in range(MAX_TOOL_CALLS):
        resp = client.messages.create(
            model=MODEL,
            max_tokens=800,
            tools=TOOL_SCHEMAS,
            messages=messages,
        )
        if resp.stop_reason == "end_turn":
            messages.append({"role": "assistant", "content": resp.content})
            break

        tool_uses = [b for b in resp.content if b.type == "tool_use"]
        if not tool_uses:
            messages.append({"role": "assistant", "content": resp.content})
            break

        messages.append({"role": "assistant", "content": resp.content})
        tool_result_blocks: list[dict[str, Any]] = []
        for tu in tool_uses:
            result = dispatch(tu.name, tu.input)
            tool_calls_made.append({"name": tu.name, "input": tu.input})
            tool_results_log.append({"name": tu.name, "result": result})
            if tu.name == "lookup_carrier" and result.get("found"):
                carrier_info = {
                    "name": result.get("name", ""),
                    "mc_number": result.get("mc_number", ""),
                    "dot_number": result.get("dot_number"),
                    "status": result.get("status", "unknown"),
                    "hq_city": result.get("hq_city"),
                    "hq_state": result.get("hq_state"),
                    "equipment_types": result.get("equipment_types", []),
                }
            tool_result_blocks.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tu.id,
                    "content": json.dumps(result),
                }
            )
        messages.append({"role": "user", "content": tool_result_blocks})

    last_text = ""
    for msg in reversed(messages):
        if msg["role"] == "assistant":
            content = msg["content"]
            if isinstance(content, list):
                last_text = "".join(b.text for b in content if getattr(b, "type", None) == "text")
            break

    extracted: dict[str, Any] = {}
    if last_text:
        try:
            extracted = json.loads(last_text[last_text.index("{") : last_text.rindex("}") + 1])
        except (ValueError, json.JSONDecodeError):
            extracted = {"_parse_error": True, "_raw": last_text[:500]}

    trace = list(state.get("trace", []))
    trace.append(
        _trace(
            "extract",
            t0,
            f"Extracted {len([v for v in extracted.values() if v])} fields; "
            f"{len(tool_calls_made)} tool call(s)",
            inputs={"email_type": email_type, "tool_calls": tool_calls_made},
            outputs={"fields": extracted, "tool_results": tool_results_log},
        )
    )
    return {"extracted": extracted, "carrier": carrier_info, "trace": trace}


def verify_node(state: AgentState) -> AgentState:
    """LLM self-check: are the extracted fields consistent with the email body?"""
    t0 = time.perf_counter()
    parsed = state["parsed"]
    extracted = state["extracted"]
    carrier = state.get("carrier")

    prompt = (
        "You are a verifier for a freight-email extraction agent. "
        "Given the original email and the fields the extractor pulled out, "
        "decide whether the extraction is trustworthy.\n\n"
        f"Original email body:\n{parsed['body']}\n\n"
        f"Extracted fields:\n{json.dumps(extracted, indent=2)}\n\n"
        f"Carrier lookup result (may be null):\n{json.dumps(carrier, indent=2)}\n\n"
        "Check for: missing critical fields, fields that contradict the email body, "
        "carrier mismatch (if lookup returned data). "
        'Return JSON only: {"confidence": 0.0-1.0, "issues": ["short issue", ...], "verified": true/false}. '
        "Set verified=true only when confidence >= 0.7 and issues is empty or trivial."
    )

    resp = _client().messages.create(
        model=MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(b.text for b in resp.content if b.type == "text")
    try:
        parsed_json = json.loads(text[text.index("{") : text.rindex("}") + 1])
        verifier = VerifierResult.model_validate(parsed_json)
    except (ValueError, json.JSONDecodeError, Exception):
        verifier = VerifierResult(confidence=0.0, issues=["verifier_parse_error"], verified=False)

    trace = list(state.get("trace", []))
    trace.append(
        _trace(
            "verify",
            t0,
            f"Verifier: verified={verifier.verified}, confidence={verifier.confidence:.2f}, "
            f"{len(verifier.issues)} issue(s)",
            outputs=verifier.model_dump(),
        )
    )
    return {"verifier": verifier.model_dump(), "trace": trace}


def emit_record_node(state: AgentState) -> AgentState:
    t0 = time.perf_counter()
    trace = list(state.get("trace", []))
    trace.append(_trace("emit_record", t0, "Record passed verification — emitted to downstream sink"))
    return {"final_action": "emit", "trace": trace}


def flag_for_review_node(state: AgentState) -> AgentState:
    t0 = time.perf_counter()
    trace = list(state.get("trace", []))
    verifier = state.get("verifier", {})
    issues = verifier.get("issues", []) if isinstance(verifier, dict) else []
    trace.append(
        _trace(
            "flag_for_review",
            t0,
            f"Flagged for human review — {len(issues)} issue(s)",
            outputs={"issues": issues},
        )
    )
    return {"final_action": "flag_for_review", "trace": trace}


def _schema_hint_for(email_type: str) -> str:
    if email_type == "load_confirmation":
        return (
            "load_id, carrier_name, mc_number, origin, destination, pickup_date, "
            "delivery_date, rate_usd (number), weight_lbs (integer), equipment_type, "
            "special_instructions"
        )
    return "any salient fields relevant to the email_type, as a flat JSON object"


def route_after_verify(state: AgentState) -> str:
    verifier = state.get("verifier", {})
    if isinstance(verifier, dict) and verifier.get("verified") and verifier.get("confidence", 0.0) >= CONFIDENCE_THRESHOLD:
        return "emit_record"
    return "flag_for_review"
