"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Menu, PhoneCall, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { navItems, siteConfig } from "@/config/site";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(scrollY > 20);
    update();
    addEventListener("scroll", update);
    return () => removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#050d1a]/85 py-2.5 shadow-2xl backdrop-blur-xl"
          : "border-b border-white/5 bg-gradient-to-b from-[#050d1a]/90 via-[#050d1a]/50 to-transparent py-3.5 sm:py-4 backdrop-blur-sm"
      }`}
    >
      <div className="container-page flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" aria-label="RescueKaro home" className="min-w-0 transition-opacity hover:opacity-95">
          <BrandLogo inverse />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            className="hidden min-h-[44px] items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/10 sm:inline-flex"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="button button-primary !min-h-[44px] !w-auto !px-3.5 !py-2 text-xs sm:!px-5"
            href="/order"
          >
            <span>Get RescueKaro</span>
            <ArrowRight size={14} className="hidden sm:inline" />
          </Link>
          <button
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-safety lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-[#050d1a]/80 backdrop-blur-md transition-opacity" onClick={() => setOpen(false)}>
          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="safe-top safe-bottom safe-right ml-auto flex h-full h-screen h-[100dvh] w-[min(92vw,380px)] flex-col overflow-y-auto border-l border-white/10 bg-[#081526] p-5 sm:p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <BrandLogo inverse />
              <button
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-safety"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400">
              <ShieldCheck size={16} className="shrink-0" />
              <span>Offline Emergency QR • Works 100% App-Free</span>
            </div>

            <nav className="flex flex-col space-y-1" aria-label="Mobile navigation links">
              {navItems.map((item) => (
                <Link
                  className="flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={16} className="text-slate-500" />
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-6">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                <span>Helpline Support</span>
                <a href={`tel:${siteConfig.supportPhone}`} className="flex min-h-[44px] items-center gap-1.5 font-bold text-blue-400">
                  <PhoneCall size={13} />
                  {siteConfig.supportPhone}
                </a>
              </div>
              <div className="grid gap-2.5">
                <Link className="button button-secondary !min-h-[44px] w-full text-xs" href="/login" onClick={() => setOpen(false)}>
                  Sign In
                </Link>
                <Link className="button button-primary !min-h-[44px] w-full text-xs" href="/order" onClick={() => setOpen(false)}>
                  Get Starter Kit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
