"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { EmailOtpVerification } from "@/components/auth/EmailOtpVerification";
import { ApiError } from "@/services/api";
import { authService, type OtpChallenge } from "@/services/auth.service";

export function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [previousRequestId, setPreviousRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("rescuekaro.signup.challenge");
      if (saved) {
        const pending = JSON.parse(saved) as { challenge: OtpChallenge; email: string; phone: string; fullName?: string; savedAt?: number };
        if (pending.challenge?.requestId && pending.email && pending.phone) {
          const elapsed = Math.floor((Date.now() - (pending.savedAt ?? Date.now())) / 1000);
          setChallenge({ ...pending.challenge, expiresIn: Math.max(0, pending.challenge.expiresIn - elapsed), resendAfter: Math.max(0, pending.challenge.resendAfter - elapsed) });
          setEmail(pending.email); setPhone(pending.phone); setFullName(pending.fullName ?? "");
        }
      }
    } catch { sessionStorage.removeItem("rescuekaro.signup.challenge"); }
  }, []);

  async function submit() {
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const pending = await authService.register({ fullName, email, phone, password, confirmPassword, previousRequestId });
      setChallenge(pending); setPreviousRequestId(null);
      sessionStorage.setItem("rescuekaro.signup.challenge", JSON.stringify({ challenge: pending, email, phone, fullName, savedAt: Date.now() }));
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "PHONE_ALREADY_REGISTERED") {
        sessionStorage.removeItem("rescuekaro.signup.challenge");
        router.replace("/login?reason=phone-already-registered");
        return;
      }
      setError(reason instanceof ApiError ? reason.message : "Could not start registration.");
    }
    finally { setBusy(false); }
  }

  if (challenge) return <EmailOtpVerification challenge={challenge} onBack={() => { setPreviousRequestId(challenge.requestId); setChallenge(null); sessionStorage.removeItem("rescuekaro.signup.challenge"); }}
    onChallengeChange={next => { setChallenge(next); sessionStorage.setItem("rescuekaro.signup.challenge", JSON.stringify({ challenge: next, email, phone, fullName, savedAt: Date.now() })); }}
    onVerify={async (requestId, code) => {
      await authService.verifyEmail({ requestId, code });
      sessionStorage.removeItem("rescuekaro.signup.challenge");
      router.replace("/order");
      router.refresh();
    }} />;

  return <main className="grid min-h-dvh place-items-center bg-[#050d1a] p-4 text-white safe-top safe-bottom safe-px">
    <section className="glass-panel w-full max-w-xl p-6 sm:p-9">
      <div className="flex items-center justify-between"><Link href="/"><BrandLogo inverse /></Link>
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-300"><ArrowLeft size={16} /> Back</Link></div>
      <span className="eyebrow mt-8 block">Create account</span>
      <h1 className="display mt-2 text-3xl">Start prepared.</h1>
      <p className="mt-2 text-sm text-slate-400">We will email a verification code before activating your account.</p>
      <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <label><span className="label">Full Name</span><input className="field" required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} /></label>
        <label><span className="label">Mobile Number</span><input className="field" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={event => setPhone(event.target.value)} /></label>
        <label className="sm:col-span-2"><span className="label">Email Address</span><input className="field" required type="email" inputMode="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label><span className="label">Password</span><input className="field" required type="password" autoComplete="new-password" minLength={6} maxLength={6} value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label><span className="label">Confirm Password</span><input className="field" required type="password" autoComplete="new-password" minLength={6} maxLength={6} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        <p className="sm:col-span-2 text-xs text-slate-400">Use exactly 6 characters.</p>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-rescue">{error}</p>}
        <button className="button button-primary sm:col-span-2" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : "Send Email Verification Code"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">Already registered? <Link className="font-bold text-safety" href="/login">Sign in</Link></p>
    </section>
  </main>;
}
