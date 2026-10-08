import Link from "next/link";
import { ArrowRight, HeartPulse, Package, RefreshCw, ShieldCheck, Siren } from "lucide-react";
import { StatusTimeline } from "@/components/dashboard/StatusTimeline";
import { QRMark } from "@/components/product/QRMark";
import { mockEmergencyProfile } from "@/data/mock-user";

export default function Page() {
  const primary = mockEmergencyProfile.contacts.find((c) => c.primary);

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="eyebrow">Customer Hub</span>
          <h1 className="display mt-2 text-2xl sm:text-4xl lg:text-5xl text-white">
            Your safer-journey hub.
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Manage your physical QR codes, track shipments, and update emergency numbers.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/dashboard/rescuekaro"
            className="button button-primary w-full sm:w-auto !min-h-[44px] text-xs font-bold"
          >
            View Active QR
          </Link>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        {/* Active QR Card */}
        <section className="glass-panel relative overflow-hidden p-5 sm:p-8">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-safety">
                  Active Physical QR
                </span>
              </div>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">
                Helmet Starter Kit
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  Static Matrix Generated
                </span>
                <span className="rounded-lg border border-safety/30 bg-safety/10 px-2.5 py-1 text-xs font-bold text-safety">
                  In Production Printing
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/dashboard/rescuekaro"
                  className="inline-flex min-h-[44px] items-center text-xs font-black uppercase tracking-wider text-safety hover:underline touch-target"
                >
                  Inspect QR Vector →
                </Link>
                <Link
                  href="/scan"
                  className="inline-flex min-h-[44px] items-center text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white touch-target"
                >
                  Simulate Camera Scan →
                </Link>
              </div>
            </div>
            <div className="mx-auto rounded-2xl bg-white p-3 shadow-xl max-w-full">
              <QRMark className="w-28 sm:w-32" />
            </div>
          </div>
          <div className="mt-6 sm:mt-8 border-t border-white/10 pt-5 sm:pt-6">
            <StatusTimeline active={2} />
          </div>
        </section>

        {/* Embedded Identity Card */}
        <section className="glass-panel flex flex-col justify-between p-5 sm:p-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-safety">
              Embedded Medical Identity
            </span>
            <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">
              {mockEmergencyProfile.fullName}
            </h2>
            <b className="mt-1 block text-4xl sm:text-5xl font-black text-rescue drop-shadow-[0_0_12px_rgba(255,70,84,0.3)]">
              {mockEmergencyProfile.bloodGroup}
            </b>
            <div className="mt-5 space-y-2 text-xs text-slate-300">
              <p className="flex justify-between border-b border-white/5 pb-2">
                <span>Primary Responder:</span>
                <strong className="text-white">
                  {primary?.name} ({primary?.relationship})
                </strong>
              </p>
              <p className="flex justify-between border-b border-white/5 pb-2">
                <span>Total Contacts:</span>
                <strong className="text-white">
                  {mockEmergencyProfile.contacts.length} saved
                </strong>
              </p>
              <p className="flex justify-between">
                <span>Registered Location:</span>
                <strong className="text-white">
                  {mockEmergencyProfile.city}, {mockEmergencyProfile.state}
                </strong>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/emergency-profile"
            className="button button-secondary mt-6 w-full !min-h-[44px] text-xs font-bold"
          >
            Manage Profile
          </Link>
        </section>
      </div>

      {/* Feature Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            ShieldCheck,
            "My RescueKaro",
            "View high-res QR & download print asset",
            "/dashboard/rescuekaro",
          ],
          [
            Package,
            "Active Order",
            "Track parcel courier shipment status",
            "/dashboard/orders/RK-2026-1042",
          ],
          [
            Siren,
            "Helpline Directory",
            "Review scannable local service numbers",
            "/dashboard/emergency-profile",
          ],
          [
            RefreshCw,
            "Order Replacement",
            "Request an updated static QR sticker",
            "/dashboard/replacement",
          ],
        ].map(([I, t, d, h]) => {
          const Icon = I as typeof HeartPulse;
          return (
            <Link
              href={String(h)}
              className="glass-card group p-5 sm:p-6 flex flex-col justify-between"
              key={String(t)}
            >
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 border border-white/10 text-safety group-hover:border-safety/40 transition-colors">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-black text-white">{String(t)}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-400">{String(d)}</p>
              </div>
              <div className="mt-5 flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-safety transition group-hover:translate-x-1 touch-target">
                <span>Open Section</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
