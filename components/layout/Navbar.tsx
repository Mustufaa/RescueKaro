"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { navItems } from "@/config/site";

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
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "border-b border-line bg-canvas/90 py-2 shadow-sm backdrop-blur-xl" : "py-3 sm:py-4"}`}>
      <div className="container-page flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" aria-label="RescueKaro home" className="min-w-0"><BrandLogo inverse /></Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => <Link className="text-xs font-bold text-muted hover:text-ink" key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link className="hidden min-h-11 items-center px-3 text-xs font-extrabold sm:flex" href="/login">Login</Link>
          <Link className="button button-primary !min-h-11 !w-auto !px-3 sm:!px-5" href="/order"><span className="sm:hidden">Get</span><span className="hidden sm:inline">Get RescueKaro</span></Link>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface lg:hidden" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)}><Menu size={19} /></button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation" className="safe-bottom ml-auto flex h-dvh w-[min(88vw,370px)] flex-col overflow-y-auto bg-surface p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between gap-4">
              <BrandLogo inverse />
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button>
            </div>
            <nav className="flex flex-col" aria-label="Mobile navigation links">
              {navItems.map((item) => <Link className="flex min-h-12 items-center border-b border-line py-3 text-lg font-extrabold" key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
            </nav>
            <div className="mt-auto grid gap-3 pt-8">
              <Link className="button button-secondary" href="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link className="button button-primary" href="/order" onClick={() => setOpen(false)}>Start your order</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
