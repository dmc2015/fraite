import type { EmailType } from "@/lib/types";

const LABELS: Record<EmailType, string> = {
  load_confirmation: "Load Confirmation",
  rate_update: "Rate Update",
  eta_update: "ETA Update",
  exception: "Exception",
  invoice: "Invoice",
  unknown: "Unknown",
};

const STYLES: Record<EmailType, string> = {
  load_confirmation: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  rate_update: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  eta_update: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200",
  exception: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  invoice: "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200",
  unknown: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200",
};

export function ClassificationBadge({ type }: { type: EmailType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
