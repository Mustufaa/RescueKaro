"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { apiRequest, ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";

export function PhoneLogin() {
  const router = useRouter();
  const search = useSearchParams();
  const requestedNext = search.get("next");
  const destination = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [mock, setMock] = useState(false);

  useEffect(() => { apiRequest<{ mockOtp: boolean }>("/auth/config").then(result => setMock(result.mockOtp)).catch(() => {}); }, []);
  useEffect(() => { if (!seconds) return; const timer = setTimeout(() => setSeconds(seconds - 1), 1000); return () => clearTimeout(timer); }, [seconds]);

  async function send() {
    setBusy(true); setError("");
    try {
      const response = await apiRequest<{ requestId: string; resendAfter: number }>("/auth/otp/send", {
        method: "POST", body: JSON.stringify({ phone, purpose: "login" }),
      });
      setRequestId(response.requestId); setSeconds(response.resendAfter); setCode("");
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : "Could not send OTP."); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError("");
    try { await authService.loginOtp({ requestId, code }); router.replace(destination); router.refresh(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-4 text-white">
    <section className="glass-panel w-full max-w-md p-6 sm:p-9">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="RescueKaro home"><BrandLogo inverse /></Link>
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"><ArrowLeft size={14} /> Back</Link>
      </div>
      <span className="eyebrow mt-8 block">Secure access</span>
      <h1 className="display mt-2 text-3xl">Sign in with phone OTP</h1>
      <p className="mt-2 text-sm text-slate-400">Use the phone number registered with your RescueKaro account.</p>
      {search.get("notice") === "existing-account" && <p role="status" className="mt-4 rounded-xl border border-safety/30 bg-safety/10 p-3 text-sm text-safety">This phone number is already registered. Sign in with OTP below.</p>}
      <form className="mt-7 space-y-4" onSubmit={event => { event.preventDefault(); void (requestId ? verify() : send()); }}>
        <label className="block"><span className="label">Phone number</span>
          <input className="field" type="tel" autoComplete="tel" inputMode="tel" required value={phone} onChange={event => { setPhone(event.target.value); setRequestId(""); setCode(""); setError(""); }} placeholder="+91 98765 43210" />
        </label>
        {requestId && <label className="block"><span className="label">6-digit OTP</span>
          <input className="field" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
        </label>}
        {mock && <p className="text-xs text-safety">Testing mode: use OTP 000111</p>}
        {error && <p role="alert" className="text-sm text-rescue">{error}</p>}
        <button className="button button-primary w-full" disabled={busy || !phone || !!requestId && code.length !== 6}>{busy ? "Please wait..." : requestId ? "Verify OTP and sign in" : "Send OTP"}</button>
        {requestId && <button type="button" className="text-xs text-safety disabled:text-slate-500" disabled={busy || seconds > 0} onClick={() => void send()}>{seconds > 0 ? `Resend in ${seconds}s` : "Resend OTP"}</button>}
      </form>
      <p className="mt-4 text-center text-xs"><Link className="font-bold text-safety hover:underline" href={`/forgot-password?next=${encodeURIComponent(destination)}`}>Forgot password?</Link></p>
      <p className="mt-6 text-center text-xs text-slate-400">New here? <Link className="font-bold text-safety" href={`/register?next=${encodeURIComponent(destination)}`}>Create an account</Link></p>
    </section>
  </main>;
}
