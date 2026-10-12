"use client";

import { useState } from "react";
import type { TraceStep } from "@/lib/types";

const NODE_COLORS: Record<string, string> = {
  parse_eml: "bg-zinc-400",
  classify: "bg-sky-500",
  extract: "bg-indigo-500",
  verify: "bg-amber-500",
  emit_record: "bg-emerald-500",
  flag_for_review: "bg-rose-500",
};

function Step({ step }: { step: TraceStep }) {
  const [open, setOpen] = useState(false);
  const color = NODE_COLORS[step.node] ?? "bg-zinc-400";
  const hasDetails =
    Object.keys(step.inputs).length > 0 || Object.keys(step.outputs).length > 0;

  return (
    <li className="relative pl-6">
      <span
        className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-zinc-900 ${color}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold">{step.node}</span>
            <span className="text-xs tabular-nums text-zinc-500">
              {step.duration_ms}ms
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
            {step.summary}
          </p>
        </div>
        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            {open ? "hide" : "details"}
          </button>
        )}
      </div>
      {open && hasDetails && (
        <div className="mt-2 space-y-2 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
          {Object.keys(step.inputs).length > 0 && (
            <div>
              <div className="font-mono font-semibold text-zinc-500">inputs</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(step.inputs, null, 2)}
              </pre>
            </div>
          )}
          {Object.keys(step.outputs).length > 0 && (
            <div>
              <div className="font-mono font-semibold text-zinc-500">outputs</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(step.outputs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function TraceSteps({ trace }: { trace: TraceStep[] }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">Agent trace</h2>
      <ol className="mt-4 space-y-4 border-l-2 border-zinc-100 pl-2 dark:border-zinc-800">
        {trace.map((step, i) => (
          <Step key={`${step.node}-${i}`} step={step} />
        ))}
      </ol>
    </section>
  );
}
