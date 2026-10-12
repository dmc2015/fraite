function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function humanLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ExtractedFields({ fields }: { fields: Record<string, unknown> }) {
  const entries = Object.entries(fields).filter(([k]) => !k.startsWith("_"));
  if (entries.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Extracted fields</h2>
        <p className="mt-2 text-sm text-zinc-500">No fields extracted.</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">Extracted fields</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800"
          >
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {humanLabel(key)}
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-100">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
