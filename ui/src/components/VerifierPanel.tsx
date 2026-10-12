import type { FinalAction, VerifierResult } from "@/lib/types";
import { ConfidenceBar } from "./ConfidenceBar";

export function VerifierPanel({
  verifier,
  finalAction,
}: {
  verifier: VerifierResult;
  finalAction: FinalAction;
}) {
  const actionLabel =
    finalAction === "emit"
      ? "Emitted to downstream sink"
      : "Flagged for human review";
  const actionStyle =
    finalAction === "emit"
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
      : "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200";
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">Verification</h2>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionStyle}`}
        >
          {actionLabel}
        </span>
      </div>
      <div className="mt-3">
        <ConfidenceBar value={verifier.confidence} label="Verifier confidence" />
      </div>
      {verifier.issues.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Issues
          </div>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
            {verifier.issues.map((issue, i) => (
              <li key={i} className="text-amber-700 dark:text-amber-300">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
