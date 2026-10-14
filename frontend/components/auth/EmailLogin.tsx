"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { EmailOtpVerification } from "@/components/auth/EmailOtpVerification";
import { ApiError } from "@/services/api";
import { authService, type OtpChallenge } from "@/services/auth.service";

export function EmailLogin() {
  const router = useRouter();
  const search = useSearchParams();
  const phoneAlreadyRegistered = search.get("reason") === "phone-already-registered";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true); setError("");
    try {
      const result = await authService.login({ email, password });
      if (result.verification) setChallenge(result.verification);
      else { router.replace("/dashboard"); router.refresh(); }
    }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  if (challenge) return <EmailOtpVerification challenge={challenge} onBack={() => setChallenge(null)}
    onVerify={async (requestId, code) => {
      await authService.verifyEmail({ requestId, code });
      router.replace("/dashboard"); router.refresh();
    }} />;

  return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-4 text-white safe-top safe-bottom safe-px">
    <section className="glass-panel w-full max-w-md p-6 sm:p-9">
      <div className="flex items-center justify-between"><Link href="/"><BrandLogo inverse /></Link>
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-300"><ArrowLeft size={16} /> Back</Link></div>
      <span className="eyebrow mt-8 block">Secure access</span>
      <h1 className="display mt-2 text-3xl">Welcome back.</h1>
      <p className="mt-2 text-sm text-slate-400">Sign in with your email and password.</p>
      {phoneAlreadyRegistered && <p role="status" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-200">This phone number is already registered. Please sign in.</p>}
      <form className="mt-7 space-y-4" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <label className="block"><span className="label">Email Address</span><input className="field" type="email" inputMode="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label className="block"><span className="label">Password</span><input className="field" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        {error && <p role="alert" className="text-sm text-rescue">{error}</p>}
        <button className="button button-primary w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}</button>
      </form>
      <p className="mt-4 text-center text-sm"><Link className="font-bold text-safety" href="/forgot-password">Forgot password?</Link></p>
      <p className="mt-6 text-center text-sm text-slate-400">New here? <Link className="font-bold text-safety" href="/register">Create an account</Link></p>
    </section>
  </main>;
}
