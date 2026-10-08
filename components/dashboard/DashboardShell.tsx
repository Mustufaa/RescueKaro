"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { cn } from "@/lib/utils";

const links = [
  [Home, "Overview", "/dashboard"],
  [ShieldCheck, "My RescueKaro", "/dashboard/rescuekaro"],
  [Package, "Orders", "/dashboard/orders"],
  [HeartPulse, "Emergency profile", "/dashboard/emergency-profile"],
  [RefreshCw, "Replacement", "/dashboard/replacement"],
  [Settings, "Settings", "/dashboard/settings"],
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = prev;
      removeEventListener("keydown", close);
    };
  }, [open]);

  const side = (
    <>
      <div className="flex h-18 sm:h-20 items-center justify-between border-b border-white/10 px-4 sm:px-6 safe-top">
        <BrandLogo inverse />
        <button
          className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white touch-target lg:hidden focus-visible:outline-2 focus-visible:outline-safety"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5" aria-label="Dashboard navigation">
        {links.map(([Icon, label, href]) => (
          <Link
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 touch-target",
              path === href || (href !== "/dashboard" && path.startsWith(href))
                ? "border border-safety/30 bg-[#0b2447] text-white shadow-md"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
            key={href}
            href={href}
          >
            <Icon
              size={17}
              className={
                path === href || (href !== "/dashboard" && path.startsWith(href))
                  ? "text-safety shrink-0"
                  : "text-slate-500 shrink-0"
              }
            />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="safe-bottom border-t border-white/10 p-4 space-y-1">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/5 hover:text-white touch-target"
        >
          <ChevronLeft size={16} />
          <span>Public Website</span>
        </Link>
        <Link
          href="/login"
          className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-bold text-red-400 transition hover:bg-red-950/20 touch-target"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen min-h-screen-dvh min-w-0 bg-[#050d1a] text-slate-100 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen h-[100dvh] flex-col border-r border-white/10 bg-[#071324] lg:flex">
        {side}
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#050d1a]/80 backdrop-blur-md lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="safe-left safe-top safe-bottom flex h-screen h-[100dvh] w-[min(88vw,320px)] flex-col border-r border-white/10 bg-[#081526] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {side}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 sm:h-20 min-w-0 items-center border-b border-white/10 bg-[#06101f]/90 px-3.5 sm:px-6 lg:px-8 backdrop-blur-xl safe-top safe-px">
          <button
            className="mr-2.5 sm:mr-3 grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white touch-target lg:hidden focus-visible:outline-2 focus-visible:outline-safety"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <Menu size={19} />
          </button>
          <div className="mr-auto min-w-0">
            <span className="block truncate text-[10px] font-black uppercase tracking-wider text-safety">
              Customer Portal
            </span>
            <b className="block truncate text-xs sm:text-sm font-bold text-white">
              Aarav Sharma • Verified Rider
            </b>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-bold text-emerald-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active QR
            </span>
            <span className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
              <User size={16} />
            </span>
          </div>
        </header>
        <main className="min-w-0 p-3.5 sm:p-6 lg:p-8 safe-bottom safe-px">{children}</main>
      </div>
    </div>
  );
}
