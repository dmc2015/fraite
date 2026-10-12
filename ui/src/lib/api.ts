import type { AgentOutput, EmailInput } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeEmail(input: EmailInput): Promise<AgentOutput> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`agent request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<AgentOutput>;
}
