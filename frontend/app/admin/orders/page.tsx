import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { mockOrders } from "@/data/mock-orders";

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-[.16em] text-[#1264d8]">
            Fulfilment queue
          </span>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Orders</h1>
        </div>
        <label className="relative w-full sm:w-72">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#607086]"
            size={18}
          />
          <input
            className="h-11 min-h-[44px] w-full rounded-xl border border-[#dce2ea] bg-white pl-10 pr-4 text-base sm:text-sm text-slate-100 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-safety"
            placeholder="Search order or customer"
          />
        </label>
      </div>

      {/* Mobile Card Layout (< 640px) */}
      <div className="mt-6 space-y-3 sm:hidden">
        {mockOrders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="block rounded-xl border border-[#dce2ea] bg-white p-4 shadow-sm transition hover:border-safety/40 touch-manipulation"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-slate-100">
                {o.id}
              </span>
              <span className="rounded bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#1264d8]">
                {o.status}
              </span>
            </div>
            <div className="mt-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-muted">Product:</span>
                <span className="font-medium">{o.product}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-muted">Use case:</span>
                <span>{o.useCase}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-muted">Payment:</span>
                <span className="text-emerald-400 font-bold">{o.payment}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-muted">QR Status:</span>
                <span>{o.qrStatus}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs text-muted">
              <span>{o.date}</span>
              <span className="flex items-center gap-1 font-bold text-safety">
                Inspect Order <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop & Tablet Table (>= 640px) */}
      <div className="mt-7 hidden overflow-x-auto rounded-xl border border-[#dce2ea] bg-white table-wrapper sm:block">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-[#f2f5f9] text-[10px] uppercase tracking-wider text-[#607086]">
            <tr>
              {["Order", "Date", "Product", "Use case", "Payment", "QR", "Status", ""].map((x) => (
                <th className="px-5 py-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((o) => (
              <tr className="border-t border-[#dce2ea]" key={o.id}>
                <td className="px-5 py-5 font-black">{o.id}</td>
                <td className="px-5">{o.date}</td>
                <td className="px-5">{o.product}</td>
                <td className="px-5">{o.useCase}</td>
                <td className="px-5">{o.payment}</td>
                <td className="px-5">{o.qrStatus}</td>
                <td className="px-5 font-black text-[#1264d8]">{o.status}</td>
                <td className="px-5">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    aria-label={`View order ${o.id}`}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white touch-manipulation"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
