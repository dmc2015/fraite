"use client";

import { useState } from "react";
import { SAMPLE_EML } from "@/lib/sample";

export function EmailInput({
  onSubmit,
  loading,
}: {
  onSubmit: (raw: string) => void;
  loading: boolean;
}) {
  const [raw, setRaw] = useState("");

  const canSubmit = raw.trim().length > 0 && !loading;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Email input</h2>
        <button
          type="button"
          onClick={() => setRaw(SAMPLE_EML)}
          className="text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
        >
          Load sample
        </button>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste a .eml email here, or tap Load sample"
        rows={8}
        className="mt-3 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit(raw)}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {loading ? "Running agent…" : "Analyze"}
        </button>
      </div>
    </section>
  );
}
