"use client";

import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { images } from "@/config/images";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api";

type Mode = "login" | "register" | "forgot" | "reset";

const configs = {
  login: {
    title: "Welcome back.",
    copy: "Sign in to view orders and manage your RescueKaro emergency QR.",
    button: "Sign in",
  },
  register: {
    title: "Start prepared.",
    copy: "Create your account before personalising your emergency QR.",
    button: "Create account",
  },
  forgot: {
    title: "Reset your password.",
    copy: "Enter your account email and we'll prepare a secure reset link.",
    button: "Send reset link",
  },
  reset: {
    title: "Choose a new password.",
    copy: "Use at least eight characters for your new password.",
    button: "Update password",
  },
};

const schema = z.object({
  fullName: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Use at least 8 characters").optional(),
  confirm: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function AuthScreen({ mode }: { mode: Mode }) {
  const c = configs[mode];
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <main className="grid min-h-screen min-h-screen-dvh bg-[#050d1a] text-slate-100 lg:grid-cols-[1.1fr_.9fr] safe-top safe-bottom safe-px">
      <section className="relative hidden overflow-hidden bg-[#071324] lg:block">
        <Image
          src={images.hero}
          alt="RescueKaro emergency QR code badge"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a] via-[#050d1a]/40 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-safety/30 bg-safety/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-safety backdrop-blur-md">
            Scan Karo. Safe Karo.
          </span>
          <h2 className="display mt-4 max-w-2xl text-4xl xl:text-5xl">
            Your emergency information, protected and one scan away.
          </h2>
          <div className="mt-7 flex flex-wrap gap-5 text-xs font-bold text-slate-300">
            {["No mobile app required", "Owner-approved public fields", "Physical pull-cover privacy"].map(
              (x) => (
                <span className="flex items-center gap-2" key={x}>
                  <Check size={16} className="text-safety" />
                  {x}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
            <Link href="/" aria-label="RescueKaro home">
              <BrandLogo />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white touch-target focus-visible:outline-2 focus-visible:outline-safety"
            >
              <ArrowLeft size={14} />
              <span>Back Home</span>
            </Link>
          </div>

          {done ? (
            <div className="glass-panel border-l-4 !border-l-safety p-6 sm:p-8">
              <h1 className="text-2xl font-black text-white">Request received.</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Authentication successfully acknowledged. You can now explore the customer dashboard.
              </p>
              <Link href="/dashboard" className="button button-primary mt-6 w-full text-xs !min-h-[48px]">
                Open customer dashboard
              </Link>
            </div>
          ) : (
            <div className="glass-panel p-5 sm:p-8 md:p-9">
              <span className="eyebrow">Secure Access</span>
              <h1 className="display mt-3 text-2xl sm:text-3xl font-black text-white">{c.title}</h1>
              <p className="mt-2 text-xs leading-6 text-slate-400">{c.copy}</p>

              <form
                className="mt-6 space-y-4"
                onSubmit={handleSubmit(async (values) => {
                  setSubmitError("");
                  try {
                    if (mode === "login") await authService.login({ email: values.email, password: values.password });
                    else throw new Error("This recovery flow is not connected yet.");
                    setDone(true);
                  } catch (reason) {
                    setSubmitError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : "Request failed.");
                  }
                })}
                noValidate
              >
                {mode === "register" && (
                  <>
                    <label className="block">
                      <span className="label">Full Name</span>
                      <input
                        className="field"
                        placeholder="Aarav Sharma"
                        autoComplete="name"
                        {...register("fullName")}
                      />
                    </label>
                    <label className="block">
                      <span className="label">Mobile Phone</span>
                      <input
                        className="field"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        {...register("phone")}
                      />
                    </label>
                  </>
                )}

                <label className="block">
                  <span className="label">Email Address</span>
                  <input
                    className="field"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <small className="mt-1 block text-xs font-semibold text-rescue">
                      {errors.email.message}
                    </small>
                  )}
                </label>

                {mode !== "forgot" && (
                  <label className="block">
                    <span className="label">{mode === "reset" ? "New Password" : "Password"}</span>
                    <span className="relative block">
                      <input
                        className="field pr-12"
                        type={show ? "text" : "password"}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        placeholder="••••••••"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center text-slate-400 hover:text-white touch-target"
                        onClick={() => setShow((v) => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </span>
                    {errors.password && (
                      <small className="mt-1 block text-xs font-semibold text-rescue">
                        {errors.password.message}
                      </small>
                    )}
                  </label>
                )}

                {(mode === "register" || mode === "reset") && (
                  <label className="block">
                    <span className="label">Confirm Password</span>
                    <input
                      className="field"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register("confirm")}
                    />
                  </label>
                )}

                {mode === "login" && (
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="inline-block py-1 text-xs font-bold text-safety hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  disabled={isSubmitting}
                  className="button button-primary w-full text-xs font-bold !min-h-[48px] mt-2"
                >
                  {isSubmitting ? "Please wait..." : c.button}
                </button>
                {submitError && <p className="text-xs font-semibold text-rescue" role="alert">{submitError}</p>}
              </form>

              <p className="mt-6 text-center text-xs text-slate-400">
                {mode === "login" ? (
                  <>
                    New to RescueKaro?{" "}
                    <Link className="font-bold text-safety hover:underline p-1" href="/register">
                      Create an account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link className="font-bold text-safety hover:underline p-1" href="/login">
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
