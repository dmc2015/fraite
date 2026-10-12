import type { AgentOutput } from "./types";

// Fallback response for UI dev when the backend isn't ready.
// Shape matches what POST /api/analyze will return once credits are live.
export const MOCK_AGENT_OUTPUT: AgentOutput = {
  parsed: {
    from_addr: "dispatch@midwestexpressfreight.com",
    to_addr: "ops@shipperco.com",
    subject: "Load Confirmation - L-78213 - Chicago IL to Dallas TX - Pickup 10/14",
    date: "Mon, 13 Oct 2026 09:17:23 -0500",
    body: "(truncated for mock)",
  },
  classification: {
    email_type: "load_confirmation",
    confidence: 0.95,
    reasoning: "Explicit load tender with pickup/delivery, rate, equipment, and MC number.",
  },
  extracted: {
    load_id: "L-78213",
    carrier_name: "Midwest Express Freight LLC",
    mc_number: "823456",
    origin: "Chicago, IL",
    destination: "Dallas, TX",
    pickup_date: "2026-10-14 08:00 CT",
    delivery_date: "2026-10-15 18:00 CT",
    rate_usd: 2850.0,
    weight_lbs: 42500,
    equipment_type: "53' Dry Van",
    special_instructions: "Driver must have TWIC card; call dispatch 1 hour prior to pickup; lumper fee paid by shipper.",
  },
  carrier: {
    name: "Midwest Express Freight LLC",
    mc_number: "823456",
    dot_number: "2341890",
    status: "active",
    hq_city: "Chicago",
    hq_state: "IL",
    equipment_types: ["53' Dry Van", "48' Dry Van", "Reefer"],
  },
  verifier: {
    confidence: 0.92,
    issues: [],
    verified: true,
  },
  trace: [
    {
      node: "parse_eml",
      timestamp: "2026-10-12T20:00:00.000Z",
      duration_ms: 3,
      summary: "Parsed email from 'dispatch@midwestexpressfreight.com', 35 body lines",
      inputs: {},
      outputs: { from: "dispatch@midwestexpressfreight.com", body_lines: 35 },
    },
    {
      node: "classify",
      timestamp: "2026-10-12T20:00:01.900Z",
      duration_ms: 1900,
      summary: "Classified as load_confirmation (confidence 0.95)",
      inputs: {},
      outputs: { email_type: "load_confirmation", confidence: 0.95 },
    },
    {
      node: "extract",
      timestamp: "2026-10-12T20:00:04.300Z",
      duration_ms: 2400,
      summary: "Extracted 11 fields; 1 tool call(s)",
      inputs: { email_type: "load_confirmation", tool_calls: [{ name: "lookup_carrier", input: { mc_number: "823456" } }] },
      outputs: { fields: { load_id: "L-78213" } },
    },
    {
      node: "verify",
      timestamp: "2026-10-12T20:00:05.900Z",
      duration_ms: 1600,
      summary: "Verifier: verified=true, confidence=0.92, 0 issue(s)",
      inputs: {},
      outputs: { verified: true, confidence: 0.92 },
    },
    {
      node: "emit_record",
      timestamp: "2026-10-12T20:00:05.901Z",
      duration_ms: 1,
      summary: "Record passed verification — emitted to downstream sink",
      inputs: {},
      outputs: {},
    },
  ],
  final_action: "emit",
  received_at: "2026-10-12T20:00:00.000Z",
};
