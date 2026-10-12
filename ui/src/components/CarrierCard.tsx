import type { CarrierInfo } from "@/lib/types";

const STATUS_STYLES: Record<CarrierInfo["status"], string> = {
  active: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  inactive: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200",
  unknown: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200",
};

export function CarrierCard({ carrier }: { carrier: CarrierInfo }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Carrier (from lookup_carrier tool)</h2>
          <p className="mt-1 text-base font-medium">{carrier.name}</p>
          <p className="text-xs text-zinc-500">
            MC {carrier.mc_number}
            {carrier.dot_number ? ` · DOT ${carrier.dot_number}` : ""}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[carrier.status]}`}
        >
          {carrier.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">HQ</div>
          <div>
            {carrier.hq_city && carrier.hq_state
              ? `${carrier.hq_city}, ${carrier.hq_state}`
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Equipment</div>
          <div className="text-xs">
            {carrier.equipment_types.length > 0
              ? carrier.equipment_types.join(", ")
              : "—"}
          </div>
        </div>
      </div>
    </section>
  );
}
