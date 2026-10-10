import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Clock3,
  Printer,
  QrCode,
  RefreshCcw,
  Truck,
} from "lucide-react";
import { mockOrders } from "@/data/mock-orders";

const metrics = [
  [Clock3, "Awaiting processing", "08"],
  [QrCode, "QRs to verify", "04"],
  [Printer, "Ready to print", "12"],
  [Truck, "Ready to ship", "07"],
  [RefreshCcw, "Replacements", "03"],
] as const;

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <span className="text-xs font-black uppercase tracking-[.16em] text-[#1264d8]">
        Today operations
      </span>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        Keep every order moving.
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map(([I, t, v]) => (
          <article
            className="rounded-xl border border-[#dce2ea] bg-white p-4 shadow-sm sm:p-5"
            key={t}
          >
            <I className="text-[#1264d8]" size={20} />
            <b className="mt-4 block text-2xl font-black sm:text-3xl">{v}</b>
            <span className="mt-1 block text-xs font-bold text-[#607086]">
              {t}
            </span>
          </article>
        ))}
      </div>

      <section className="mt-7 overflow-hidden rounded-xl border border-[#dce2ea] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#dce2ea] p-4 sm:p-5">
          <h2 className="text-base font-black sm:text-lg">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="flex min-h-[44px] items-center text-xs font-black text-[#1264d8] hover:underline touch-manipulation"
          >
            View all orders →
          </Link>
        </div>

        <div className="divide-y divide-[#dce2ea]">
          {mockOrders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex min-h-[44px] flex-col justify-between gap-2 p-4 transition-colors hover:bg-slate-50/50 touch-manipulation sm:flex-row sm:items-center sm:px-5 sm:py-4 md:grid md:grid-cols-[1fr_1.5fr_1fr_1fr_auto]"
            >
              <div className="flex items-center justify-between sm:block">
                <b className="font-mono text-sm text-slate-100">{o.id}</b>
                <span className="rounded bg-blue-900/40 px-2 py-0.5 text-[10px] font-black uppercase text-[#1264d8] sm:hidden">
                  {o.status}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-200">
                {o.product}
              </span>
              <span className="text-xs text-[#607086]">{o.useCase}</span>
              <span className="hidden text-xs font-black uppercase text-[#1264d8] sm:inline-block">
                {o.status}
              </span>
              <ArrowRight size={16} className="hidden text-slate-400 md:block" />
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-5 flex items-center gap-2 text-xs text-[#607086]">
        <CheckCircle size={15} className="shrink-0 text-emerald-400" />
        <span>
          Counts are mock operational data and will be supplied by the admin API.
        </span>
      </div>
    </div>
  );
}
