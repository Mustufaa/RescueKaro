import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

const groups = [
  ["Product", [["How It Works", "/#how-it-works"], ["Use Cases", "/#use-cases"], ["Pricing", "/#pricing"], ["Reviews", "/#reviews"]]],
  ["Support", [["Contact", "/contact"], ["Order Support", "/contact?topic=order"], ["Replacement", "/dashboard/replacement"]]],
  ["Company", [["About RescueKaro", "/about"], ["Our Mission", "/about#mission"], ["Contact", "/contact"]]],
  [
    "Legal",
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
    <footer className="border-t border-line bg-[#050e1a] pt-14 text-white sm:pt-20">
      <div className="container-page grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 sm:gap-12 sm:pb-16 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-white sm:text-xs sm:tracking-[.3em]">
            Scan to Safe Life
          </p>
          <div className="mt-6 space-y-3 text-sm text-white/65">
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              Lucknow, Uttar Pradesh, India
            </p>
            <a className="flex items-center gap-2 break-all hover:text-white" href="mailto:team@rescuekaro.com">
              <Mail size={16} className="shrink-0" />
              team@rescuekaro.com
            </a>
            <a className="flex items-center gap-2 hover:text-white" href="tel:+919455005380">
              <Phone size={16} className="shrink-0" />
              +91 94550 05380
            </a>
          </div>
          <div className="mt-6 flex gap-3">
            {socialLinks.map(([I, l, href]) => {
              const Icon = I as typeof Instagram;
              return (
                <a
                  href={href}
                  aria-label={String(l)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15"
                  key={String(l)}
                  rel={href === "#" ? undefined : "noreferrer"}
                  target={href === "#" ? undefined : "_blank"}
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {groups.map(([t, links]) => (
          <div key={t}>
            <h3 className="mb-4 text-xs font-black uppercase tracking-[.18em] text-white/45 sm:mb-5">{t}</h3>
            <ul className="space-y-3">
              {links.map(([l, h]) => (
                <li key={l}>
                  <Link className="text-sm text-white/70 hover:text-white" href={h}>
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page flex flex-col gap-2 py-7 text-xs text-white/45 sm:flex-row sm:justify-between">
        <span>© RescueKaro. All rights reserved.</span>
        <span>Scan Karo. Safe Karo.</span>
      </div>
    </footer>
  );
}
