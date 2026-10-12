// Mirrors api/agent/schemas.py — the API contract.
// Keep in lockstep with the Pydantic models.

export type EmailType =
  | "load_confirmation"
  | "rate_update"
  | "eta_update"
  | "exception"
  | "invoice"
  | "unknown";

export type FinalAction = "emit" | "flag_for_review";

export interface EmailInput {
  raw?: string | null;
  from_addr?: string | null;
  to_addr?: string | null;
  subject?: string | null;
  date?: string | null;
  body?: string | null;
}

export interface ParsedEmail {
  from_addr: string;
  to_addr: string;
  subject: string;
  date: string;
  body: string;
}

export interface Classification {
  email_type: EmailType;
  confidence: number;
  reasoning: string;
}

export interface CarrierInfo {
  name: string;
  mc_number: string;
  dot_number: string | null;
  status: "active" | "inactive" | "unknown";
  hq_city: string | null;
  hq_state: string | null;
  equipment_types: string[];
}

export interface VerifierResult {
  confidence: number;
  issues: string[];
  verified: boolean;
}

export interface TraceStep {
  node: string;
  timestamp: string;
  duration_ms: number;
  summary: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

export interface AgentOutput {
  parsed: ParsedEmail;
  classification: Classification;
  extracted: Record<string, unknown>;
  carrier: CarrierInfo | null;
  verifier: VerifierResult;
  trace: TraceStep[];
  final_action: FinalAction;
  received_at: string;
}
