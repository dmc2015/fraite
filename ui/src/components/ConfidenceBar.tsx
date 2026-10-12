export function ConfidenceBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const barColor =
    value >= 0.8
      ? "bg-emerald-500"
      : value >= 0.6
      ? "bg-amber-500"
      : "bg-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{label ?? "Confidence"}</span>
        <span className="tabular-nums font-medium">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
