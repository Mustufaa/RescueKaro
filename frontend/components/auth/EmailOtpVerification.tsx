"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ApiError } from "@/services/api";
import { authService, type OtpChallenge } from "@/services/auth.service";

type Props = {
  challenge: OtpChallenge;
  onBack: () => void;
  onVerify: (requestId: string, code: string) => Promise<void>;
  onChallengeChange?: (challenge: OtpChallenge) => void;
};

export function EmailOtpVerification({ challenge, onBack, onVerify, onChallengeChange }: Props) {
  const [current, setCurrent] = useState(challenge);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [expires, setExpires] = useState(challenge.expiresIn);
  const [cooldown, setCooldown] = useState(challenge.resendAfter);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Check your email. If this address has an account, a code will arrive shortly.");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setExpires(value => Math.max(0, value - 1));
      setCooldown(value => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      setDigits(Array.from({ length: 6 }, (_, position) => clean[position] || ""));
      refs.current[Math.min(clean.length, 5)]?.focus();
      return;
    }
    setDigits(old => old.map((digit, position) => position === index ? clean : digit));
    if (clean && index < 5) refs.current[index + 1]?.focus();
  }

  async function verify() {
    setBusy(true); setError(""); setNotice("");
    try { await onVerify(current.requestId, digits.join("")); setNotice("Verification successful."); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "Verification failed. Please try again."); }
    finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError(""); setNotice("");
    try {
      const next = await authService.resendOtp(current.requestId);
      setCurrent(next); setDigits(["", "", "", "", "", ""]);
      onChallengeChange?.(next);
      setExpires(next.expiresIn); setCooldown(next.resendAfter);
      setNotice("Check your email for a new code.");
      refs.current[0]?.focus();
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : "Could not resend the code."); }
    finally { setBusy(false); }
  }

  const clock = `${String(Math.floor(expires / 60)).padStart(2, "0")}:${String(expires % 60).padStart(2, "0")}`;
  return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-4 text-white">
    <section className="glass-panel w-full max-w-md p-6 sm:p-9">
      <BrandLogo inverse />
      <span className="eyebrow mt-8 block">Secure access</span>
      <h1 className="display mt-2 text-3xl">Check your email.</h1>
      <p className="mt-3 text-sm text-slate-300">Enter the six-digit code sent to <strong>{current.maskedEmail}</strong>.</p>
      <form className="mt-7" onSubmit={event => { event.preventDefault(); void verify(); }}>
        <div className="flex gap-2 sm:gap-3" role="group" aria-label="Six-digit verification code">
          {digits.map((digit, index) => <input key={index}
            ref={element => { refs.current[index] = element; }}
            className="field w-10 flex-1 p-0 text-center text-xl font-bold sm:w-12"
            aria-label={`Digit ${index + 1}`} inputMode="numeric" pattern="[0-9]*" autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={6} value={digit}
            onChange={event => setDigit(index, event.target.value)}
            onKeyDown={event => { if (event.key === "Backspace" && !digit && index > 0) refs.current[index - 1]?.focus(); }}
            onPaste={event => { event.preventDefault(); setDigit(0, event.clipboardData.getData("text")); }} />)}
        </div>
        <p className="mt-3 text-xs text-slate-400" role="timer">{expires > 0 ? `Code expires in ${clock}` : "Code expired. Request a new one."}</p>
        {notice && <p className="mt-3 text-sm text-emerald-300" role="status">{notice}</p>}
        {error && <p className="mt-3 text-sm text-rescue" role="alert">{error}</p>}
        <button className="button button-primary mt-6 w-full" disabled={busy || expires === 0 || digits.some(value => !value)}>
          {busy ? <Loader2 className="animate-spin" size={18} /> : "Verify OTP"}
        </button>
      </form>
      <button type="button" className="mt-4 text-sm font-bold text-safety disabled:text-slate-500" disabled={busy || cooldown > 0}
        onClick={() => void resend()}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}</button>
      <button type="button" className="mt-5 flex items-center gap-2 text-sm text-slate-300 disabled:opacity-50" disabled={busy} onClick={onBack}><ArrowLeft size={16} /> Back</button>
    </section>
  </main>;
}
