"use client";
import { useState } from "react";
import { CheckCircle2, ChevronRight, CornerDownRight, Hand, Phone, RotateCcw, Scan, Sparkles } from "lucide-react";
import { QRMark } from "@/components/product/QRMark";

export function PullScanDemo() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <section className="section relative overflow-hidden bg-[#071527] text-white" id="pull-demo">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />

      <div className="container-page relative z-10 grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div>
          <span className="eyebrow !text-blue-300">
            <Sparkles size={14} className="text-rescue" />
            Interactive Simulation
          </span>
          <h2 className="display mt-4 text-4xl sm:text-6xl">
            Pull only when
            <br />
            <span className="bg-gradient-to-r from-rescue via-red-400 to-amber-300 bg-clip-text text-transparent">
              help is needed.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300 sm:text-lg">
            In everyday use, the tactile pull-cover shields your QR from dirt, weather, and casual gazes. In an emergency, any passerby or first responder simply pulls the tab to reveal and scan the code.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={toggle}
              className={`button ${open ? "button-secondary" : "button-primary"} gap-2`}
            >
              {open ? (
                <>
                  <RotateCcw size={16} />
                  <span>Reset Cover</span>
                </>
              ) : (
                <>
                  <Hand size={16} />
                  <span>Pull Cover Tab</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <CornerDownRight size={14} className="text-safety" />
              {open ? "Cover removed • QR exposed" : "Tap cover or button to test"}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <b className="block text-xs font-black uppercase text-safety">01 • Everyday</b>
              <span className="mt-1 block text-xs text-slate-400">QR is masked and protected on gear</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <b className="block text-xs font-black uppercase text-rescue">02 • Emergency</b>
              <span className="mt-1 block text-xs text-slate-400">One pull reveals full static emergency card</span>
            </div>
          </div>
        </div>

        {/* Simulation Sandbox */}
        <div className="glass-panel relative min-h-[480px] overflow-hidden p-4 sm:min-h-[460px] sm:p-8 lg:p-10">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs font-black uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Tactile Simulator
            </span>
            <span>{open ? "State: Uncovered (Scannable)" : "State: Covered (Protected)"}</span>
          </div>

          <div className="relative mt-8 flex flex-col items-center justify-center gap-8 sm:flex-row sm:items-center sm:justify-around">
            {/* The Physical Sticker Component */}
            <div className="relative w-full max-w-[240px] select-none">
              <div className="relative rounded-3xl border-4 border-slate-700 bg-white p-5 shadow-2xl ring-4 ring-black/40">
                <div className="mb-2 flex items-center justify-between text-[9px] font-black tracking-widest text-[#07182d]">
                  <span>RESCUE<span className="text-rescue">KARO</span></span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">OFFLINE ID</span>
                </div>
                <QRMark className="w-full" />
                <p className="mt-2 text-center text-[9px] font-black tracking-wider text-[#07182d]">
                  SCAN IN EMERGENCY
                </p>

                {/* Peelable Cover Mask with Physical Pull Tab */}
                <div
                  onClick={toggle}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
                  aria-label={open ? "Reset protective cover" : "Pull protective cover to reveal emergency QR"}
                  className={`absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#ff4654] via-[#e22838] to-[#b71826] text-white shadow-2xl transition-all duration-700 ease-out ${
                    open
                      ? "pointer-events-none translate-x-[110%] translate-y-[-10%] rotate-12 opacity-30 sm:translate-x-[120%]"
                      : "translate-x-0 translate-y-0 opacity-100 hover:scale-[1.02]"
                  }`}
                >
                  <span className="text-[10px] font-black tracking-[0.25em] text-white/90">
                    EMERGENCY
                  </span>
                  <strong className="mt-2 text-xl font-black tracking-tight">
                    SCAN FOR HELP
                  </strong>

                  {/* Textured Grip Tab */}
                  <div className="mt-6 flex flex-col items-center">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black backdrop-blur-sm">
                      <Hand size={13} />
                      PULL TAB
                      <ChevronRight size={13} />
                    </span>
                    <div className="mt-2 flex gap-1">
                      <span className="h-1 w-3 rounded-full bg-white/40" />
                      <span className="h-1 w-3 rounded-full bg-white/40" />
                      <span className="h-1 w-3 rounded-full bg-white/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Phone Camera Viewfinder */}
            <div
              className={`w-full max-w-[260px] rounded-[32px] border-[6px] border-[#1e293b] bg-[#0c1624] p-4 text-white shadow-2xl transition-all duration-700 ${
                open ? "translate-y-0 opacity-100 scale-100" : "translate-y-6 opacity-30 scale-95 pointer-events-none"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1 text-[9px] font-bold text-slate-400">
                <span>PHONE CAMERA</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Scan size={11} /> 100% OFFLINE
                </span>
              </div>

              {/* Viewfinder Target Frame */}
              <div className="relative mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-safety/40 bg-white/[0.04] p-2">
                <div className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-safety" />
                <div className="absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-safety" />
                <div className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-safety" />
                <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-safety" />

                <QRMark className="h-20 w-20 opacity-80" />
                <div className="absolute inset-x-0 top-0 h-1 animate-scan bg-rescue shadow-[0_0_8px_#ff4654]" />
              </div>

              {/* Parsed Instant Result */}
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-rescue">Decoded Info</span>
                    <h4 className="text-xs font-black text-white">Aarav Sharma</h4>
                  </div>
                  <strong className="rounded-md bg-rescue/20 px-2 py-0.5 text-sm font-black text-rescue">
                    O+
                  </strong>
                </div>

                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px]">
                  <span className="font-semibold text-slate-300">Priya (Spouse)</span>
                  <a href="tel:+919800000000" className="flex items-center gap-1 font-bold text-safety hover:underline">
                    <Phone size={10} /> Call Now
                  </a>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400">
                  <CheckCircle2 size={12} />
                  Instant Camera Readout • No App
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
