"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { RescueKaroScanPreview } from "@/components/product/RescueKaroScanPreview";
import { mockEmergencyProfile } from "@/data/mock-user";
import { mockRepository } from "@/services/mock/repository";
import type { EmergencyProfile } from "@/types";

export default function ScanPage() {
  const [profile, setProfile] = useState<EmergencyProfile>(mockEmergencyProfile);

  useEffect(() => {
    try {
      const saved = mockRepository.load<{ profile: EmergencyProfile } | null>(null);
      if (saved?.profile) {
        setProfile(saved.profile);
      }
    } catch {
      // Fallback to mock profile
    }
  }, []);

  return (
    <main className="min-h-screen min-h-screen-dvh bg-[#050d1a] px-3 py-6 text-slate-100 safe-top safe-bottom safe-px sm:px-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        {/* Top Navigation Bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white touch-target focus-visible:outline-2 focus-visible:outline-safety"
          >
            <ArrowLeft size={15} />
            <span>RescueKaro Home</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rescue" />
            Active Emergency View
          </span>
        </div>

        {/* Scan Result Container */}
        <RescueKaroScanPreview profile={profile} />

        {/* Informative Bystander Help Banner */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-slate-300 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-safety" />
            <div>
              <b className="block text-white text-xs sm:text-sm font-black">
                First Responder Information
              </b>
              <p className="mt-1 leading-5 text-slate-400">
                This emergency card was decoded directly from a physical RescueKaro offline QR badge. No network access or database login is required. Use the one-tap buttons above to dial emergency contacts or dispatch your current GPS coordinates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

