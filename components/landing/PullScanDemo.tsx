"use client";
import { useState } from "react";
import { ChevronRight, ScanLine } from "lucide-react";
import { QRMark } from "@/components/product/QRMark";

export function PullScanDemo() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <section className="section overflow-hidden bg-[#0a1d35] text-white" id="pull-demo">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
        <div>
          <span className="eyebrow !text-blue-300">Interactive demo</span>
          <h2 className="display mt-5 text-4xl sm:text-6xl">
            Pull only when
            <br />
            help is needed.
          </h2>
          <p className="mt-6 max-w-md leading-7 text-white/65">
            Tap the protective cover to reveal the QR underneath. Tap reset to cover it again.
          </p>
          <button onClick={toggle} className="button mt-8 border border-white/25 bg-white/10 text-white">
            {open ? "Reset cover" : "Pull to reveal"}
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[22px] border border-white/10 bg-white/[.04] p-4 grid-bg sm:min-h-[440px] sm:rounded-[30px] sm:p-7">
          <div className="absolute left-1/2 top-7 w-[min(70vw,230px)] -translate-x-1/2 rounded-3xl bg-white p-4 shadow-2xl sm:left-[15%] sm:top-1/2 sm:w-64 sm:-translate-y-1/2 sm:translate-x-0 sm:p-5">
            <p className="mb-3 text-[9px] font-black tracking-[.14em] text-navy sm:text-[10px] sm:tracking-[.2em]">
              RESCUEKARO - EMERGENCY QR
            </p>
            <QRMark className="w-full" />
            <button
              type="button"
              onClick={toggle}
              aria-label={open ? "Reset protective cover" : "Remove protective cover to reveal QR"}
              className={`absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center rounded-3xl bg-rescue text-white shadow-xl transition-transform duration-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-safety ${
                open
                  ? "pointer-events-none translate-y-[118%] rotate-3 sm:translate-x-[115%] sm:translate-y-0 sm:rotate-6"
                  : "translate-x-0"
              }`}
            >
              <span className="text-xs font-black tracking-[.2em]">EMERGENCY</span>
              <strong className="mt-3 text-xl sm:text-2xl">SCAN FOR HELP</strong>
              <span className="mt-8 flex items-center gap-2 text-sm font-black">
                TAP / PULL <ChevronRight />
              </span>
            </button>
          </div>

          <div
            className={`absolute bottom-5 left-1/2 w-[min(72vw,210px)] -translate-x-1/2 rounded-[24px] border-[6px] border-[#1d2938] bg-white p-4 text-navy shadow-2xl transition-all duration-700 sm:left-auto sm:right-[10%] sm:top-12 sm:w-44 sm:translate-x-0 sm:rounded-[28px] sm:border-[7px] ${
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            <div className="relative mx-auto mb-4 h-24 overflow-hidden rounded-lg bg-blue-50 sm:h-28">
              <QRMark className="mx-auto h-full" />
              <div className="absolute inset-x-0 top-0 h-1 animate-scan bg-rescue" />
            </div>
            <p className="text-[9px] font-black tracking-[.16em] text-rescue">EMERGENCY INFORMATION</p>
            <p className="mt-2 text-sm font-black">Aarav Sharma</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
              <span>
                <b className="block text-muted">BLOOD</b>O+
              </span>
              <span>
                <b className="block text-muted">CONTACT</b>Priya
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md bg-blue-50 px-2 py-2 text-[9px] font-bold text-safety">
              <ScanLine size={13} />
              Scan complete
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
