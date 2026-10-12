"""Pydantic schemas — shared contract between the agent and the API.

Design notes:
- `EmailInput` and `AgentOutput` are the request/response bounds; everything else is
  internal shape surfaced in the trace.
- `extracted` is intentionally a flexible dict for phase 1. When we add more email
  types (rate_update, eta_update, exception, invoice), we convert this to a
  Pydantic discriminated union keyed on `email_type`.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

EmailType = Literal[
    "load_confirmation",
    "rate_update",
    "eta_update",
    "exception",
    "invoice",
    "unknown",
]

FinalAction = Literal["emit", "flag_for_review"]


class EmailInput(BaseModel):
    """Request body for POST /api/analyze."""
    raw: str | None = Field(
        default=None,
        description="Full .eml text. If provided, parsed server-side.",
    )
    from_addr: str | None = None
    to_addr: str | None = None
    subject: str | None = None
    date: str | None = None
    body: str | None = None


class ParsedEmail(BaseModel):
    from_addr: str
    to_addr: str
    subject: str
    date: str
    body: str


class Classification(BaseModel):
    email_type: EmailType
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


class CarrierInfo(BaseModel):
    """Shape returned by the lookup_carrier tool."""
    name: str
    mc_number: str
    dot_number: str | None = None
    status: Literal["active", "inactive", "unknown"] = "unknown"
    hq_city: str | None = None
    hq_state: str | None = None
    equipment_types: list[str] = Field(default_factory=list)


class LoadConfirmationFields(BaseModel):
    """Structured output for load_confirmation emails."""
    load_id: str | None = None
    carrier_name: str | None = None
    mc_number: str | None = None
    origin: str | None = None
    destination: str | None = None
    pickup_date: str | None = None
    delivery_date: str | None = None
    rate_usd: float | None = None
    weight_lbs: int | None = None
    equipment_type: str | None = None
    special_instructions: str | None = None


class VerifierResult(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    issues: list[str] = Field(default_factory=list)
    verified: bool


class TraceStep(BaseModel):
    node: str
    timestamp: str
    duration_ms: int
    summary: str
    inputs: dict[str, Any] = Field(default_factory=dict)
    outputs: dict[str, Any] = Field(default_factory=dict)


class AgentOutput(BaseModel):
    """Response body for POST /api/analyze."""
    parsed: ParsedEmail
    classification: Classification
    extracted: dict[str, Any] = Field(
        default_factory=dict,
        description="Shape depends on classification.email_type; keyed by field name.",
    )
    carrier: CarrierInfo | None = None
    verifier: VerifierResult
    trace: list[TraceStep]
    final_action: FinalAction
    received_at: datetime = Field(default_factory=datetime.utcnow)
