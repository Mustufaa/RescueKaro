"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, HeartPulse, Home, LogOut, Menu, Package, RefreshCw, Settings, ShieldCheck, User, X } from "lucide-react";
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
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [open]);

  const side = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-line px-4 sm:px-6">
        <BrandLogo inverse />
        <button className="grid h-11 w-11 place-items-center rounded-full border border-line lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Dashboard navigation">
        {links.map(([Icon, label, href]) => (
          <Link onClick={() => setOpen(false)} className={cn("mb-1 flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-muted", path === href || href !== "/dashboard" && path.startsWith(href) ? "bg-[#0b315d] text-safety" : "hover:bg-canvas")} key={href} href={href}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      <div className="safe-bottom border-t border-line p-4">
        <Link href="/" className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm font-bold text-muted"><ChevronLeft size={18} />Public website</Link>
        <Link href="/login" className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm font-bold text-muted"><LogOut size={18} />Sign out</Link>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh min-w-0 bg-canvas lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">{side}</aside>
      {open && <div className="fixed inset-0 z-50 bg-navy/75 lg:hidden" onClick={() => setOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Dashboard navigation" className="flex h-dvh w-[min(88vw,320px)] flex-col bg-surface" onClick={(event) => event.stopPropagation()}>{side}</aside></div>}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-20 min-w-0 items-center border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-5 lg:px-9">
          <button className="mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open}><Menu /></button>
          <div className="mr-auto min-w-0"><small className="block truncate font-bold text-muted">Customer account</small><b className="block truncate text-sm">Aarav Sharma</b></div>
          <span className="ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface"><User size={17} /></span>
        </header>
        <main className="min-w-0 p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
