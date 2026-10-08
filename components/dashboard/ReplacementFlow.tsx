"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";

const stages = ["Choose", "Reason", "Update", "Preview", "Confirm", "Payment", "Submitted"];

export function ReplacementFlow() {
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("Information changed");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <span className="eyebrow">Replacement Request</span>
        <h1 className="display mt-2 text-3xl sm:text-4xl text-white">Keep your physical QR current.</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Order a replacement physical sticker if your medical info or contacts have changed.
        </p>
      </div>

      {/* Responsive Progress Bar */}
      <div className="glass-panel overflow-hidden p-3 sm:p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 sm:hidden">
          <span>Stage {step + 1} of {stages.length}: <b className="text-white">{stages[step]}</b></span>
          <span className="font-mono text-safety">{Math.round(((step + 1) / stages.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10 sm:hidden">
          <div
            className="h-full bg-gradient-to-r from-safety to-rescue transition-all duration-300"
            style={{ width: `${((step + 1) / stages.length) * 100}%` }}
          />
        </div>

        <div className="hidden sm:flex overflow-x-auto hide-scroll justify-between">
          {stages.map((s, i) => (
            <span
              className={`flex items-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                i === step ? "text-rescue font-bold" : i < step ? "text-safety" : "text-slate-500"
              }`}
              key={s}
            >
              {i < step ? <Check size={12} className="text-safety" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              {s}
            </span>
          ))}
        </div>
      </div>

      <section className="glass-panel min-h-[320px] p-5 sm:min-h-[360px] sm:p-8">
        {step === 0 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white">Choose RescueKaro Item</h2>
            <p className="mt-1 text-xs text-slate-400">Select which active sticker you need replaced.</p>
            <button className="mt-6 w-full rounded-2xl border-2 border-safety bg-blue-950/40 p-5 text-left transition hover:bg-blue-900/40 touch-target">
              <b className="block text-base text-white">RK-2026-1042 — Helmet Kit</b>
              <span className="mt-1 block text-xs text-slate-300">Active Offline QR • Production Verified</span>
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white">Why do you need a replacement?</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Information changed", "Sticker damaged", "Sticker lost", "Placement issue", "Other"].map(
                (x) => (
                  <button
                    onClick={() => setReason(x)}
                    className={`rounded-xl border p-4 text-left text-xs sm:text-sm font-bold transition min-h-[48px] touch-target ${
                      reason === x
                        ? "border-safety bg-safety/15 text-white ring-1 ring-safety"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                    key={x}
                  >
                    {x}
                  </button>
                )
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white">Update Information</h2>
            <p className="mt-1 text-xs text-slate-400">
              Only modify the fields that need updating. Your new physical sticker will encode this revised static data.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Full Name</span>
                <input className="field" defaultValue="Aarav Sharma" autoComplete="name" />
              </label>
              <label className="block">
                <span className="label">Blood Group</span>
                <input className="field" defaultValue="O+" />
              </label>
              <label className="block">
                <span className="label">Primary Contact</span>
                <input className="field" defaultValue="Priya Sharma" autoComplete="name" />
              </label>
              <label className="block">
                <span className="label">Contact Phone</span>
                <input className="field" type="tel" inputMode="tel" defaultValue="+91 98765 43210" autoComplete="tel" />
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white">Preview Changes</h2>
            <div className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2 text-xs sm:text-sm">
              <div>
                <small className="block text-[11px] font-bold text-slate-400">Selected Reason</small>
                <b className="mt-1 block text-white">{reason}</b>
              </div>
              <div>
                <small className="block text-[11px] font-bold text-slate-400">New QR Profile</small>
                <b className="mt-1 block text-white">Aarav Sharma • O+ • Priya Sharma</b>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white">Confirm Replacement</h2>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-300">
              Submitting requests a brand new physical static QR to be printed and shipped. Your previous physical sticker will remain readable until you discard it.
            </p>
            <label className="mt-6 flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-rescue shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white">
                I have reviewed the replacement information and understand physical QR cannot be edited after print.
              </span>
            </label>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white">Replacement Processing</h2>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-300">
              Warranty eligibility is verified during checkout. Damaged or defective starter kits qualify for free dispatch under our warranty policy.
            </p>
            <div className="mt-6 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between font-black text-sm text-white">
              <span>Standard Replacement Dispatch</span>
              <span className="text-safety">Express Shipping Included</span>
            </div>
          </>
        )}

        {step === 6 && (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 size={36} />
            </span>
            <h2 className="mt-5 text-2xl sm:text-3xl font-black text-white">Replacement Submitted.</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Tracking reference: <b className="font-mono text-white">RPL-2026-044</b>. Print queue review is active.
            </p>
          </div>
        )}
      </section>

      {step < 6 && (
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-between pt-2">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="button button-secondary !min-h-[46px] w-full sm:w-auto disabled:opacity-0"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => setStep((s) => s + 1)}
            className="button button-primary !min-h-[46px] w-full sm:w-auto"
          >
            {step === 5 ? "Submit Replacement Request" : "Continue"}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
