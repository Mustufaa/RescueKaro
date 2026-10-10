"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { apiRequest, ApiError } from "@/services/api";

export function ForgotPassword() {
  const search = useSearchParams();
  const requestedNext = search.get("next");
  const destination = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const loginUrl = `/login?next=${encodeURIComponent(destination)}`;
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [mock, setMock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { apiRequest<{ mockOtp: boolean }>("/auth/config").then(result => setMock(result.mockOtp)).catch(() => {}); }, []);
  useEffect(() => { if (!seconds) return; const timer = setTimeout(() => setSeconds(seconds - 1), 1000); return () => clearTimeout(timer); }, [seconds]);

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ requestId: string; resendAfter: number }>("/auth/otp/send", {
        method: "POST", body: JSON.stringify({ phone, purpose: "login" }),
      });
      setRequestId(result.requestId);
      setSeconds(result.resendAfter);
      setCode("");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not send the code.");
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    setError("");
    try {
      await apiRequest<void>("/auth/password/reset", {
        method: "POST", body: JSON.stringify({ requestId, code, newPassword: password, confirmPassword: confirm }),
      });
      setDone(true);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not reset your password.");
    } finally { setBusy(false); }
  }

  return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-4 text-white">
    <section className="glass-panel w-full max-w-md p-6 sm:p-9">
      <Link href="/"><BrandLogo inverse /></Link>
      <span className="eyebrow mt-8 block">Account recovery</span>
      <h1 className="display mt-2 text-3xl">Reset your password.</h1>
      {done ? <>
        <p className="mt-4 text-sm text-slate-300">Your password has been updated. Sign in to continue.</p>
        <Link className="button button-primary mt-6 w-full" href={loginUrl}>Go to login</Link>
      </> : <>
        <p className="mt-2 text-sm text-slate-400">Verify your registered phone number, then choose a new password.</p>
        <form className="mt-7 space-y-4" onSubmit={event => { event.preventDefault(); void (requestId ? resetPassword() : sendCode()); }}>
          <label className="block"><span className="label">Registered phone number</span>
            <input className="field" type="tel" autoComplete="tel" inputMode="tel" required value={phone} onChange={event => { setPhone(event.target.value); setRequestId(""); setCode(""); setSeconds(0); setError(""); }} placeholder="+91 98765 43210" />
          </label>
          {requestId && <>
            <label className="block"><span className="label">6-digit OTP</span>
              <input className="field" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} placeholder="6-digit code" />
            </label>
            {mock && <p className="text-xs text-safety">Testing mode: use OTP 000111.</p>}
            <label className="block"><span className="label">New password</span>
              <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={event => setPassword(event.target.value)} />
            </label>
            <label className="block"><span className="label">Confirm new password</span>
              <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirm} onChange={event => setConfirm(event.target.value)} />
            </label>
          </>}
          {error && <p role="alert" className="text-sm text-rescue">{error}</p>}
          <button className="button button-primary w-full" disabled={busy || !phone || !!requestId && (code.length !== 6 || password.length < 8 || confirm.length < 8)}>{busy ? "Please wait..." : requestId ? "Reset password" : "Send OTP"}</button>
          {requestId && <button type="button" className="text-xs text-safety disabled:text-slate-500" disabled={busy || seconds > 0} onClick={() => void sendCode()}>{seconds > 0 ? `Resend in ${seconds}s` : "Resend OTP"}</button>}
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">Remember your password? <Link className="font-bold text-safety" href={loginUrl}>Sign in</Link></p>
      </>}
    </section>
  </main>;
}
