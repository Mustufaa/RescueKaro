"use client";

import {
  Check,
  Download,
  Eye,
  PackageCheck,
  Printer,
  QrCode,
  Truck,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { QRMark } from "@/components/product/QRMark";
import { RescueKaroScanPreview } from "@/components/product/RescueKaroScanPreview";
import { mockEmergencyProfile } from "@/data/mock-user";

export function AdminOrderDetail({ id }: { id: string }) {
  const [done, setDone] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const actions = [
    [UserCheck, "Verify information"],
    [QrCode, "Verify QR"],
    [Download, "Download QR"],
    [Printer, "Mark printed"],
    [Truck, "Mark shipped"],
    [PackageCheck, "Mark delivered"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <span className="text-xs font-black uppercase tracking-[.16em] text-safety">
        Admin order detail
      </span>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">{id}</h1>
      <p className="mt-2 text-sm text-muted">
        Aarav Sharma - RescueKaro Starter Kit - Helmet - Paid Rs 99 + shipping
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="surface p-4 sm:p-6">
            <h2 className="font-black text-white">Customer, delivery & payment</h2>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <small className="block text-xs font-bold uppercase text-muted">Customer</small>
                <span className="mt-1 block font-semibold text-white">Aarav Sharma</span>
                <span className="text-xs text-slate-400">+91 98XXX XXXXX</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <small className="block text-xs font-bold uppercase text-muted">Delivery</small>
                <span className="mt-1 block text-xs text-slate-300">Demo address, Lucknow, Uttar Pradesh</span>
                <span className="text-xs text-slate-400">{mockEmergencyProfile.city}, {mockEmergencyProfile.state}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <small className="block text-xs font-bold uppercase text-muted">Payment</small>
                <span className="mt-1 block font-bold text-emerald-400">Verified Paid</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <small className="block text-xs font-bold uppercase text-muted">Emergency Dispatch</small>
                <span className="mt-1 block font-semibold text-white">Offline Sticker Ready</span>
              </div>
            </div>
          </section>

          <section className="surface p-4 sm:p-6">
            <h2 className="font-black text-white">Emergency profile & contacts</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:col-span-2">
                <b className="text-base text-white">{mockEmergencyProfile.fullName}</b>
                <span className="ml-2 rounded bg-rescue/20 px-2 py-0.5 text-xs font-black text-rescue">
                  Blood: {mockEmergencyProfile.bloodGroup}
                </span>
              </div>
              {mockEmergencyProfile.contacts.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
                  <span className="font-bold text-safety">{c.primary ? "Primary Contact: " : "Contact: "}</span>
                  <b className="text-white">{c.name}</b> ({c.relationship})
                  <div className="mt-1 font-mono text-slate-300">{c.phone}</div>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-xs font-black uppercase text-safety">Verified emergency numbers</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {mockEmergencyProfile.emergencyServices?.services.map((s) => (
                <div key={s.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <b className="font-mono text-white">{s.number}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-4 sm:p-6">
            <h2 className="font-black text-white">Fulfilment actions</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {actions.map(([I, l]) => (
                <button
                  onClick={() => setDone([...done, l])}
                  disabled={done.includes(l)}
                  className="button button-secondary min-h-[44px] touch-manipulation disabled:bg-emerald-900/60 disabled:border-emerald-500/40 disabled:text-emerald-200"
                  key={l}
                >
                  {done.includes(l) ? <Check size={16} /> : <I size={16} />}
                  <span>{done.includes(l) ? `${l} done` : l}</span>
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="label">Tracking number</span>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="field sm:rounded-r-none"
                  placeholder="e.g. BLUEDART-9823412"
                  autoComplete="off"
                />
                <button className="button button-primary min-h-[44px] sm:rounded-l-none touch-manipulation">
                  Add tracking
                </button>
              </div>
            </label>
          </section>
        </div>

        <aside>
          {preview ? (
            <RescueKaroScanPreview profile={mockEmergencyProfile} />
          ) : (
            <section className="surface p-4 sm:p-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-safety">
                Static QR verification
              </span>
              <div className="mt-4 rounded-2xl bg-white p-6 shadow-md">
                <QRMark className="w-full" />
              </div>
              <p className="mt-4 text-xs leading-6 text-muted">
                Verify that the deterministic payload matches the customer-approved scan preview before printing.
              </p>
            </section>
          )}
          <button
            onClick={() => setPreview((v) => !v)}
            className="button button-secondary mt-4 w-full min-h-[44px] touch-manipulation"
          >
            <Eye size={16} />
            {preview ? "View QR" : "Scan preview"}
          </button>
        </aside>
      </div>
    </div>
  );
}
