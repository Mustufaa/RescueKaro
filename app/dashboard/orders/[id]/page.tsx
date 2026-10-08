import Link from "next/link";
import { ArrowLeft, MapPin, Package, ReceiptText, Truck } from "lucide-react";
import { StatusTimeline } from "@/components/dashboard/StatusTimeline";
import { GeneratedQRPanel } from "@/components/product/GeneratedQRPanel";
import { mockOrders } from "@/data/mock-orders";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = mockOrders.find((x) => x.id === id) || mockOrders[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors touch-target"
      >
        <ArrowLeft size={15} />
        <span>Back to All Orders</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow">Order Inspection</span>
          <h1 className="display mt-2 break-all text-2xl sm:text-4xl lg:text-5xl text-white">
            {o.id}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">Placed on {o.date}</p>
        </div>
        <span className="rounded-full border border-safety/30 bg-safety/10 px-3.5 py-1.5 text-xs font-black uppercase text-safety self-start sm:self-auto">
          {o.status}
        </span>
      </div>

      {/* Production Timeline */}
      <section className="glass-panel p-5 sm:p-8">
        <h2 className="text-base sm:text-lg font-black text-white">Delivery Journey</h2>
        <div className="mt-6">
          <StatusTimeline active={o.status === "Delivered" ? 5 : o.status === "Shipped" ? 3 : 2} />
        </div>
      </section>

      {/* QR Panel & Order Specs */}
      <div className="grid gap-5 md:grid-cols-2">
        <GeneratedQRPanel />

        {[
          [Package, "Product Package", `${o.product} • ${o.quantity} kit • ${o.useCase}`],
          [ReceiptText, "Payment Summary", `${o.payment} • Base Rs ${o.amount} + Courier`],
          [
            Truck,
            "Courier Logistics",
            o.tracking ? `Tracking Number: ${o.tracking}` : "Tracking link assigns upon parcel pickup",
          ],
          [
            MapPin,
            "Delivery Destination",
            "Verified Destination • Lucknow, Uttar Pradesh, India",
          ],
        ].map(([I, t, d]) => {
          const Icon = I as typeof Package;
          return (
            <section className="glass-panel p-5 sm:p-6" key={String(t)}>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10 text-safety">
                <Icon size={18} />
              </div>
              <h2 className="mt-4 text-base font-black text-white">{String(t)}</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">{String(d)}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
