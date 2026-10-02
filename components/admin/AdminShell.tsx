"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, LayoutDashboard, LogOut, MessageSquareText, RefreshCcw, Settings, Siren } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { cn } from "@/lib/utils";

const links = [
  [LayoutDashboard, "Overview", "/admin"],
  [ClipboardList, "Orders", "/admin/orders"],
  [RefreshCcw, "Replacements", "/admin/replacements"],
  [Boxes, "Products", "/admin/products"],
  [MessageSquareText, "Reviews", "/admin/reviews"],
  [Siren, "Emergency directory", "/admin/emergency-directory"],
  [Settings, "Settings", "/admin/settings"],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="admin-dark min-h-dvh min-w-0 bg-canvas text-ink lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden min-h-dvh flex-col border-r border-line bg-[#07182d] text-white lg:flex">
        <div className="border-b border-white/10 p-6">
          <BrandLogo inverse />
          <span className="mt-3 block text-[9px] font-black uppercase tracking-[.2em] text-blue-300">Operations console</span>
        </div>
        <nav className="flex-1 p-4">
          {links.map(([I, l, h]) => (
            <Link
              key={h}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-white/55",
                path === h || (h !== "/admin" && path.startsWith(h)) ? "bg-white/10 text-white" : "hover:text-white",
              )}
              href={h}
            >
              <I size={18} />
              {l}
            </Link>
          ))}
        </nav>
        <Link href="/" className="m-4 flex items-center gap-3 border-t border-white/10 px-4 pt-5 text-sm text-white/55">
          <LogOut size={17} />
          Public website
        </Link>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-surface">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-9">
            <div className="min-w-0">
              <small className="text-muted">RescueKaro Operations</small>
              <b className="block text-sm">Admin access - Demo state</b>
            </div>
            <span className="shrink-0 rounded-full bg-red-950 px-3 py-2 text-[10px] font-black uppercase text-red-300 sm:px-4">Frontend only</span>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 hide-scroll lg:hidden" aria-label="Admin navigation">
            {links.map(([I, l, h]) => (
              <Link
                key={h}
                className={cn(
                  "flex min-w-max items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-black text-muted",
                  path === h || (h !== "/admin" && path.startsWith(h)) ? "border-safety bg-[#0b315d] text-safety" : "bg-canvas",
                )}
                href={h}
              >
                <I size={15} />
                {l}
              </Link>
            ))}
          </nav>
        </header>
        <main className="min-w-0 p-4 sm:p-6 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
