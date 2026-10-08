"use client";

import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { otpService } from "@/services/otp.service";

export function RegisterScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const send = async () => {
    setBusy(true);
    await otpService.send(phone);
    setSent(true);
    setBusy(false);
  };

  const verify = async () => {
    setBusy(true);
    const r = await otpService.verify(otp);
    setVerified(r.verified);
    setError(r.error || "");
    setBusy(false);
  };

  return (
    <main className="grid min-h-screen min-h-screen-dvh place-items-center bg-[#050d1a] p-4 safe-top safe-bottom safe-px sm:p-8">
      <div className="w-full max-w-xl glass-panel p-5 sm:p-9 md:p-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="RescueKaro Home">
            <BrandLogo inverse />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white touch-target"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>

        {done ? (
          <div className="mt-8 text-center sm:mt-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Check size={36} />
            </div>
            <h1 className="display mt-5 text-3xl sm:text-4xl text-white">Account ready.</h1>
            <p className="mt-3 text-sm text-slate-300">
              Your emergency account and phone have been authenticated.
            </p>
            <Link className="button button-primary mt-7 w-full sm:w-auto" href="/order">
              Configure Emergency Starter Kit
            </Link>
          </div>
        ) : (
          <>
            <span className="eyebrow mt-8 sm:mt-10">Create account</span>
            <h1 className="display mt-3 text-2xl sm:text-4xl font-black text-white">
              Start prepared.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Set up your profile to manage offline emergency stickers.
            </p>

            <form
              className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (verified) setDone(true);
              }}
            >
              <label className="block">
                <span className="label">Full Name</span>
                <input required autoComplete="name" placeholder="Aarav Sharma" className="field" />
              </label>

              <label className="block">
                <span className="label">Email Address</span>
                <input
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="aarav@example.com"
                  className="field"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="label">Mobile Phone</span>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    className="field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={busy || phone.length < 10}
                    className="button button-secondary whitespace-nowrap !min-h-[48px] px-5 text-xs font-bold disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : "Send OTP"}
                  </button>
                </div>
              </label>

              {sent && !verified && (
                <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <label className="block">
                    <span className="label">6-digit Verification OTP</span>
                    <input
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      placeholder="000111"
                      className="field text-center text-xl tracking-[0.3em] font-mono"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Demo OTP: <strong className="text-safety">000111</strong></span>
                  </div>
                  {error && <p className="mt-2 text-xs font-bold text-rescue">{error}</p>}
                  <button
                    type="button"
                    onClick={verify}
                    disabled={busy || otp.length !== 6}
                    className="button button-secondary mt-3 w-full !min-h-[46px] text-xs font-bold"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : "Verify OTP Code"}
                  </button>
                </div>
              )}

              {verified && (
                <div className="sm:col-span-2 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-300">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span>Mobile number successfully verified</span>
                </div>
              )}

              <label className="block">
                <span className="label">Password</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="field"
                />
              </label>

              <label className="block">
                <span className="label">Confirm Password</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="field"
                />
              </label>

              <button
                disabled={!verified}
                className="button button-primary sm:col-span-2 !min-h-[48px] text-xs font-bold disabled:opacity-40"
              >
                Create Account & Continue
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Already registered?{" "}
              <Link className="font-bold text-safety hover:underline p-1" href="/login">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
