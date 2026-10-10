import Link from "next/link";
import { ArrowUpRight, Instagram, Linkedin, Mail, MapPin, Phone, ShieldCheck, Siren, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { siteConfig } from "@/config/site";

const groups = [
  [
    "Product",
    [
      ["How It Works", "/#how-it-works"],
      ["Interactive Demo", "/#pull-demo"],
      ["Use Cases", "/#use-cases"],
      ["Starter Kit Package", "/#starter-kit"],
      ["Rider Reviews", "/#reviews"],
    ],
  ],
  [
    "Customer Care",
    [
      ["Contact Support", "/contact"],
      ["Order Lookup", "/contact?topic=order"],
      ["Sticker Replacement", "/dashboard/replacement"],
      ["Customer Sign In", "/login"],
    ],
  ],
  [
    "Company",
    [
      ["About RescueKaro", "/about"],
      ["Our Safety Mission", "/about#mission"],
      ["Official Support", "/contact"],
    ],
  ],
  [
    "Legal & Policies",
    [
      ["Privacy Policy", "/privacy"],
      ["Terms & Conditions", "/terms"],
      ["Shipping Policy", "/shipping-policy"],
      ["Refund Policy", "/refund-policy"],
      ["Replacement Policy", "/replacement-policy"],
    ],
  ],
] as const;

const socialLinks = [
  [Instagram, "Instagram", "https://www.instagram.com/rescuekaro"],
  [Linkedin, "LinkedIn", "#"],
  [Youtube, "YouTube", "#"],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#040a14] pt-14 text-white sm:pt-20">
      {/* Emergency Helpline Banner */}
      <div className="container-page mb-14">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-[#0a1626] to-[#0a1626] p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rescue/20 text-rescue">
              <Siren size={20} />
            </span>
            <div>
              <b className="block text-sm font-black text-white">Emergency in India?</b>
              <span className="text-xs text-slate-300">Dial 112 for all-in-one National Emergency Services • 108 for Medical Ambulance</span>
            </div>
          </div>
          <a
            href="tel:112"
            className="button button-primary !min-h-[44px] !px-5 text-xs shrink-0 touch-manipulation"
          >
            Emergency 112
          </a>
        </div>
      </div>

      <div className="container-page grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 sm:gap-12 sm:pb-16 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo />
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-safety sm:text-xs">
            Scan to Safe Life
          </p>
          <p className="mt-3 max-w-sm text-xs leading-6 text-slate-400">
            Protected offline emergency QR stickers engineered to keep essential medical and contact details one scan away—even without cell service.
          </p>

          <div className="mt-6 space-y-1 text-xs text-slate-300">
            <p className="flex items-center gap-2 py-1.5">
              <MapPin size={14} className="text-safety shrink-0" />
              {siteConfig.address}
            </p>
            <a className="flex min-h-[44px] items-center gap-2 py-2 hover:text-white transition-colors" href={`mailto:${siteConfig.supportEmail}`}>
              <Mail size={14} className="text-safety shrink-0" />
              {siteConfig.supportEmail}
            </a>
            <a className="flex min-h-[44px] items-center gap-2 py-2 hover:text-white transition-colors" href={`tel:${siteConfig.supportPhone}`}>
              <Phone size={14} className="text-safety shrink-0" />
              {siteConfig.supportPhone}
            </a>
          </div>

          <div className="mt-6 flex gap-2.5">
            {socialLinks.map(([IconComponent, label, href]) => {
              const Icon = IconComponent as typeof Instagram;
              return (
                <a
                  href={href}
                  aria-label={String(label)}
                  className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety"
                  key={String(label)}
                  rel={href === "#" ? undefined : "noreferrer"}
                  target={href === "#" ? undefined : "_blank"}
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {groups.map(([title, links]) => (
          <div key={title}>
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              {title}
            </h3>
            <ul className="space-y-1">
              {links.map(([linkTitle, linkHref]) => (
                <li key={linkTitle}>
                  <Link
                    className="group inline-flex min-h-[36px] items-center gap-1 py-1 text-xs text-slate-300 transition hover:text-white"
                    href={linkHref}
                  >
                    <span>{linkTitle}</span>
                    <ArrowUpRight size={11} className="opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page flex flex-col gap-3 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>© {new Date().getFullYear()} RescueKaro. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Offline Architecture</span>
          <span>•</span>
          <span>Physical Cover Privacy</span>
          <span>•</span>
          <span className="font-bold text-white">Scan Karo. Safe Karo.</span>
        </div>
      </div>
    </footer>
  );
}
