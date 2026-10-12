"use client";

import { useState } from "react";
import { analyzeEmail } from "@/lib/api";
import { MOCK_AGENT_OUTPUT } from "@/lib/mock";
import type { AgentOutput } from "@/lib/types";
import { CarrierCard } from "@/components/CarrierCard";
import { ClassificationBadge } from "@/components/ClassificationBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { EmailInput } from "@/components/EmailInput";
import { ExtractedFields } from "@/components/ExtractedFields";
import { TraceSteps } from "@/components/TraceSteps";
import { VerifierPanel } from "@/components/VerifierPanel";

export default function Home() {
  const [result, setResult] = useState<AgentOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(raw: string) {
    setLoading(true);
    setError(null);
    try {
      const output = await analyzeEmail({ raw });
      setResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function loadMock() {
    setError(null);
    setResult(MOCK_AGENT_OUTPUT);
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-16 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Freight Email Agent
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Agentic classification + structured extraction from freight carrier emails.
            Built with LangGraph, Claude, FastAPI, Next.js.
          </p>
          <button
            type="button"
            onClick={loadMock}
            className="mt-3 text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Load mock result (preview without a live backend)
          </button>
        </header>

        <div className="space-y-4">
          <EmailInput onSubmit={handleSubmit} loading={loading} />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
              {error}
            </div>
          )}

          {result && (
            <>
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">Classification</h2>
                    <div className="mt-2">
                      <ClassificationBadge type={result.classification.email_type} />
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {result.classification.reasoning}
                    </p>
                  </div>
                  <div className="w-32 shrink-0">
                    <ConfidenceBar value={result.classification.confidence} />
                  </div>
                </div>
              </section>

              <ExtractedFields fields={result.extracted} />
              {result.carrier && <CarrierCard carrier={result.carrier} />}
              <VerifierPanel
                verifier={result.verifier}
                finalAction={result.final_action}
              />
              <TraceSteps trace={result.trace} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
