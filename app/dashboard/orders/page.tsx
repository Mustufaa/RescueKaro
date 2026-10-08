import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { mockOrders } from "@/data/mock-orders";

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <span className="eyebrow">Order History</span>
        <h1 className="display mt-2 text-2xl sm:text-4xl lg:text-5xl text-white">
          Your RescueKaro Orders
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Track production, printing, and express courier shipments.
        </p>
      </div>

      {/* Mobile Order Cards (< md) */}
      <div className="space-y-3.5 md:hidden">
        {mockOrders.map((o) => (
          <div
            className="glass-panel p-4 space-y-3 border border-white/10"
            key={o.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <b className="font-mono text-sm text-white">{o.id}</b>
                <span className="block text-xs text-slate-400">{o.date}</span>
              </div>
              <span className="rounded-full border border-safety/30 bg-safety/10 px-2.5 py-1 text-[10px] font-black uppercase text-safety">
                {o.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2">
              <div>
                <span className="text-slate-400 block text-[11px]">Product</span>
                <span className="font-semibold text-white">{o.product}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Use Case</span>
                <span className="font-semibold text-white">{o.useCase}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Amount: <b className="text-white">Rs {o.amount}</b></span>
              <Link
                href={`/dashboard/orders/${o.id}`}
                className="button button-secondary !min-h-[44px] text-xs font-bold px-4"
              >
                <span>Details</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Responsive Table (md+) */}
      <div className="glass-panel hidden md:block overflow-hidden border border-white/10">
        <div className="table-wrapper">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#081526] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                {["Order ID", "Order Date", "Product", "Gear Placement", "Total Amount", "Status", ""].map(
                  (x) => (
                    <th className="px-5 py-4" key={x}>
                      {x}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockOrders.map((o) => (
                <tr className="transition-colors hover:bg-white/[0.02]" key={o.id}>
                  <td className="px-5 py-4 font-mono font-bold text-white">{o.id}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{o.date}</td>
                  <td className="px-5 py-4 font-semibold text-white">{o.product}</td>
                  <td className="px-5 py-4 text-slate-300 text-xs">{o.useCase}</td>
                  <td className="px-5 py-4 font-bold text-white">Rs {o.amount}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-safety/30 bg-safety/10 px-3 py-1 text-[10px] font-black uppercase text-safety">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      aria-label={`View order ${o.id}`}
                      href={`/dashboard/orders/${o.id}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/5 touch-target"
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2.5 text-xs text-slate-400 pt-2">
        <PackageOpen size={16} className="shrink-0 mt-0.5 text-safety" />
        <span>Tracking numbers and courier links update automatically as soon as packages are dispatched.</span>
      </div>
    </div>
  );
}
