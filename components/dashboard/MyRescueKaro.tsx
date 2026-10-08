"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Download, Eye, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { mockEmergencyProfile } from "@/data/mock-user";
import { qrService } from "@/services/qr.service";
import { mockRepository } from "@/services/mock/repository";
import { RescueKaroScanPreview } from "@/components/product/RescueKaroScanPreview";
import type { EmergencyProfile } from "@/types";

export function MyRescueKaro() {
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState(mockEmergencyProfile);

  useEffect(() => {
    try {
      const saved = mockRepository.load<{ profile: EmergencyProfile } | null>(null);
      const current = saved?.profile || mockEmergencyProfile;
      setProfile(current);
      qrService.toDataUrl(current).then(setUrl);
    } catch {
      qrService.toDataUrl(mockEmergencyProfile).then(setUrl);
    }
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <span className="eyebrow">Production Verified</span>
        <h1 className="display mt-2 text-2xl sm:text-4xl lg:text-5xl text-white">
          Your RescueKaro QR
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Inspect your high-resolution static QR vector and test camera decodes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Display Card */}
        <section className="glass-panel p-5 sm:p-8 text-center flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-safety">
              Physical Print Specification
            </span>
            <div className="mx-auto mt-4 w-full max-w-[280px] sm:max-w-xs rounded-2xl bg-white p-4 shadow-2xl ring-4 ring-white/10">
              {url ? (
                <Image
                  unoptimized
                  src={url}
                  width={520}
                  height={520}
                  alt="Your RescueKaro emergency QR"
                  className="mx-auto h-auto w-full rounded-xl object-contain"
                  priority
                />
              ) : (
                <div className="grid aspect-square place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <QrCode size={48} className="animate-pulse" />
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              High-contrast offline matrix with 3-module quiet zone. Scan with any standard phone camera.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => setShow((v) => !v)}
              className="button button-secondary !min-h-[44px] text-xs font-bold"
            >
              <Eye size={15} />
              {show ? "Hide Decoded View" : "Simulate Phone Scan"}
            </button>
            {url && (
              <a
                download="rescuekaro-qr.png"
                href={url}
                className="button button-secondary !min-h-[44px] text-xs font-bold"
              >
                <Download size={15} />
                Download PNG
              </a>
            )}
            <Link
              href="/dashboard/replacement"
              className="button button-primary !min-h-[44px] text-xs font-bold"
            >
              <RefreshCw size={15} />
              Replacement
            </Link>
          </div>
        </section>

        {/* Decoded Profile View or Technical Details */}
        {show ? (
          <RescueKaroScanPreview profile={profile} />
        ) : (
          <section className="glass-panel p-5 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-safety">
                Metadata & Specs
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">Sticker Details</h2>

              <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                {[
                  ["Sticker Status", "Active / Production Verified"],
                  ["Generation Date", "28 Sep 2026"],
                  ["Order Reference", "RK-2026-1042"],
                  ["Gear Application", "Full-Face Helmet"],
                  ["Saved Contacts", `${profile.contacts.length} Encoded`],
                  ["Base Location", `${profile.city}, ${profile.state}`],
                ].map(([l, v]) => (
                  <div
                    className="flex flex-col gap-0.5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm"
                    key={l}
                  >
                    <span className="text-slate-400">{l}</span>
                    <b className="text-white font-semibold">{v}</b>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2.5">
                {[
                  "Deterministic Static QR Matrix",
                  "Verified Offline Camera Decode",
                  "Ready for Industrial Vinyl Print",
                ].map((x) => (
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-400" key={x}>
                    <Check size={16} className="shrink-0" />
                    <span>{x}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Link
                href="/scan"
                className="inline-flex min-h-[44px] items-center text-xs font-bold text-safety hover:underline touch-target"
              >
                Open Fullscreen Emergency Phone Preview →
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
