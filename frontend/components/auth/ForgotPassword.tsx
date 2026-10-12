"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { EmailOtpVerification } from "@/components/auth/EmailOtpVerification";
import { ApiError } from "@/services/api";
import { authService, type OtpChallenge } from "@/services/auth.service";

export function ForgotPassword() {
  const search = useSearchParams();
  const next = search.get("next");
  const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const loginUrl = `/login?next=${encodeURIComponent(destination)}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try { setChallenge(await authService.requestPasswordReset(email)); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "Could not request a code."); }
    finally { setBusy(false); }
  }

  if (challenge && !done) return <EmailOtpVerification challenge={challenge} onBack={() => setChallenge(null)}
    onVerify={async (requestId, code) => {
      await authService.resetPassword({ requestId, code, newPassword: password, confirmPassword });
      setDone(true);
    }} />;

  return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-4 text-white">
    <section className="glass-panel w-full max-w-md p-6 sm:p-9">
      <Link href="/"><BrandLogo inverse /></Link>
      <span className="eyebrow mt-8 block">Account recovery</span>
      <h1 className="display mt-2 text-3xl">Reset your password.</h1>
      {done ? <><p className="mt-4 text-sm text-slate-300">Your password has been updated. Sign in to continue.</p>
        <Link className="button button-primary mt-6 w-full" href={loginUrl}>Go to login</Link></> : <>
        <p className="mt-2 text-sm text-slate-400">We will send a verification code to your registered email address.</p>
        <form className="mt-7 space-y-4" onSubmit={event => { event.preventDefault(); void requestCode(); }}>
          <label className="block"><span className="label">Registered Email Address</span><input className="field" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
          <label className="block"><span className="label">New Password</span><input className="field" type="password" autoComplete="new-password" minLength={6} maxLength={6} required value={password} onChange={event => setPassword(event.target.value)} /></label>
          <label className="block"><span className="label">Confirm New Password</span><input className="field" type="password" autoComplete="new-password" minLength={6} maxLength={6} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
          <p className="text-xs text-slate-400">Use exactly 6 characters.</p>
          {error && <p role="alert" className="text-sm text-rescue">{error}</p>}
          <button className="button button-primary w-full" disabled={busy}>{busy ? "Please wait..." : "Send Email Verification Code"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">Remember your password? <Link className="font-bold text-safety" href={loginUrl}>Sign in</Link></p>
      </>}
    </section>
  </main>;
}
