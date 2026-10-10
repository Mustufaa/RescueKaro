import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Package,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  SignalZero,
  Sparkles,
  WifiOff,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { images } from "@/config/images";
import { PullScanDemo } from "./PullScanDemo";
import { Reviews } from "@/components/reviews/Reviews";
import { FAQ } from "./FAQ";

const ButtonPair = () => (
  <div className="mt-8 flex flex-wrap items-center gap-3.5">
    <Link href="/order" className="button button-primary">
      <span>Get Your QR Sticker</span>
      <ArrowRight size={17} />
    </Link>
    <Link href="#how-it-works" className="button button-secondary">
      See how it works
    </Link>
  </div>
);

const HeroQRCard = () => (
  <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
    {/* Ambient Glow Aura */}
    <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-blue-500/25 via-transparent to-red-500/20 blur-2xl" />

    {/* Showcase Container */}
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#0a182c]/95 via-[#061222]/95 to-[#040c17]/95 p-3.5 shadow-2xl backdrop-blur-xl sm:p-4">
      {/* Top Header Label */}
      <div className="mb-3 flex items-center justify-between px-1.5 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rescue" />
          TACTILE PULL-COVER
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          OFFLINE STATIC QR
        </span>
      </div>

      {/* Hero Image - 16:9 Aspect Ratio with Right Alignment to preserve helmet and sticker on mobile */}
      <div className="group relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#030913] shadow-inner">
        <Image
          src={images.hero}
          alt="Premium motorcycle helmet with RescueKaro emergency QR code sticker attached, parked car and backpack in background"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 460px, 560px"
          className="object-cover object-right sm:object-center transition duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

        {/* Micro Tag Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-white sm:text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            100% Offline
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-slate-300 backdrop-blur-md">
            <ScanLine size={12} className="text-safety" /> Any Phone Camera
          </span>
        </div>
      </div>

      {/* Card Footer Strip */}
      <div className="mt-3 flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <ShieldCheck size={15} className="shrink-0 text-safety" />
          <span>Physical Privacy Mask</span>
        </div>
        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-extrabold text-safety">
          2 Stickers + 2 Covers
        </span>
      </div>
    </div>

    {/* Floating Badges (Desktop) */}
    <div className="pointer-events-none absolute -bottom-4 -left-4 hidden rounded-xl border border-white/15 bg-[#081729]/95 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md lg:flex lg:items-center lg:gap-2">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      Pan-India Express Dispatch
    </div>
    <div className="pointer-events-none absolute -top-3 -right-3 hidden rounded-xl border border-white/15 bg-[#081729]/95 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md lg:flex lg:items-center lg:gap-2">
      <Zap size={14} className="text-amber-400" />
      Instant Offline Decode
    </div>
  </div>
);

export function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-w-0 bg-[#050d1a] text-slate-100">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-[#050d1a] pt-24 pb-14 text-white sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
          {/* Ambient Lighting Background */}
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
          <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-20 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050d1a] via-transparent to-transparent" />

          <div className="container-page relative z-10">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
              {/* Copy Column */}
              <div className="lg:col-span-7 xl:col-span-7">
                <div className="mb-6 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-400 backdrop-blur-md sm:text-[11px]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-rescue" />
                    EMERGENCY ID • 100% OFFLINE
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur-md">
                    Scan karo safe karo
                  </span>
                </div>

                <h1 className="display text-[clamp(2.3rem,6.5vw,5rem)] leading-[1.04] text-white">
                  When every second counts, your emergency details should be{" "}
                  <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-white bg-clip-text text-transparent">
                    one scan away.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                  A physical emergency QR sticker engineered for helmets, vehicles, and daily gear. Concealed under a tactile pull cover until help is needed—no app, login, or internet required to read.
                </p>

                <ButtonPair />

                {/* Mobile Hero QR Showcase: displayed right after CTAs on phone viewports */}
                <div className="mt-8 lg:hidden">
                  <HeroQRCard />
                </div>

                {/* Quick Trust Highlights */}
                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:flex sm:flex-wrap sm:gap-6">
                  {[
                    "Zero Apps Needed",
                    "Works 100% Offline",
                    "Scans on Any Phone",
                    "Weather & Rain Proof",
                  ].map((highlight) => (
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-300" key={highlight}>
                      <CheckCircle2 size={15} className="shrink-0 text-safety" />
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              {/* Desktop Showcase Column */}
              <div className="hidden lg:col-span-5 lg:block xl:col-span-5">
                <HeroQRCard />
              </div>
            </div>
          </div>
        </section>

        {/* STATS & METRICS STRIP */}
        <section className="border-y border-white/10 bg-[#081424]">
          <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4 sm:gap-8">
            {[
              { stat: "100%", label: "Offline Storage", sub: "Decodes with 0 cell bars" },
              { stat: "< 1 Sec", label: "Instant Scan", sub: "Standard phone camera" },
              { stat: "IP67", label: "Weatherproof", sub: "UV, rain & scratch proof" },
              { stat: "2×", label: "Dual Kit", sub: "2 stickers + 2 pull masks" },
            ].map((m) => (
              <div className="text-center sm:text-left" key={m.label}>
                <b className="display block text-2xl font-black text-white sm:text-3xl lg:text-4xl">
                  {m.stat}
                </b>
                <span className="mt-1 block text-xs font-bold text-slate-200">{m.label}</span>
                <small className="block text-[11px] text-slate-400">{m.sub}</small>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFIT ICONS TICKER */}
        <div className="border-b border-white/5 bg-[#050e1a]/80 py-4">
          <div className="container-page flex gap-8 overflow-x-auto hide-scroll sm:justify-between">
            {[
              [WifiOff, "No app required"],
              [SignalZero, "Works 100% offline"],
              [ScanLine, "Camera instant decode"],
              [ShieldCheck, "Physical privacy mask"],
              [Zap, "Direct responder contacts"],
            ].map(([IconComponent, text]) => {
              const Icon = IconComponent as typeof WifiOff;
              return (
                <span
                  className="flex min-w-max items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-300"
                  key={String(text)}
                >
                  <Icon size={16} className="text-rescue" />
                  {String(text)}
                </span>
              );
            })}
          </div>
        </div>

        {/* HOW IT WORKS — THREE CORE STEPS */}
        <section id="how-it-works" className="section relative overflow-hidden bg-[#050d1a]">
          <div className="container-page">
            <div className="max-w-2xl">
              <span className="eyebrow">How It Works • Three Simple Steps</span>
              <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
                Simple before you need it.
                <br />
                <span className="bg-gradient-to-r from-safety via-sky-300 to-white bg-clip-text text-transparent">
                  Crucial when you do.
                </span>
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                RescueKaro operates 100% offline without apps, passwords, or server downtime. Notice, pull, scan, help.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1: Apply */}
              <div className="glass-card flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.steps.apply}
                    alt="Close-up of adult hands applying RescueKaro emergency vinyl sticker smoothly onto motorcycle helmet surface"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-lg bg-[#050d1a]/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-safety backdrop-blur-md">
                    Step 01
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-lg font-black text-white">Apply your sticker</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                      Adhere the industrial-grade, weather-resistant vinyl sticker firmly to any clean, smooth helmet surface, car window, or rigid tag.
                    </p>
                  </div>
                  <div className="mt-5 border-t border-white/5 pt-3">
                    <span className="text-[11px] font-bold text-slate-400">
                      Curved & flat adhesion • High tack
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Open and Scan */}
              <div className="glass-card flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.steps.scan}
                    alt="Close-up showing RescueKaro protective cover lifted and a smartphone camera scanning the revealed emergency QR code"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-lg bg-[#050d1a]/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-rescue backdrop-blur-md">
                    Step 02
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-lg font-black text-white">Lift the cover and scan</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                      In an emergency, any passerby or first responder lifts the protective cover reading &ldquo;Scan for help&rdquo; and points their regular phone camera.
                    </p>
                  </div>
                  <div className="mt-5 border-t border-white/5 pt-3">
                    <span className="text-[11px] font-bold text-slate-400">
                      No app required • Instant camera decode
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: View and Contact */}
              <div className="glass-card flex flex-col overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.steps.contact}
                    alt="Smartphone displaying RescueKaro decoded emergency page with medical info, emergency contacts, and one-tap call button beside motorcycle helmet"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-lg bg-[#050d1a]/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-400 backdrop-blur-md">
                    Step 03
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-lg font-black text-white">View details and contact help</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                      Your blood group, verified emergency contacts, and medical alerts appear instantly on the screen with one-tap dialing and GPS sharing controls.
                    </p>
                  </div>
                  <div className="mt-5 border-t border-white/5 pt-3">
                    <span className="text-[11px] font-bold text-slate-400">
                      Direct phone dial • 100% offline payload
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE PULL & SCAN DEMO */}
        <PullScanDemo />

        {/* PRODUCT FORMAT SELECTION */}
        <section id="products" className="section relative overflow-hidden bg-[#071324] grid-bg">
          <div className="container-page">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <Package size={13} className="text-rescue" />
                Product Selection
              </span>
              <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
                Engineered formats for every ride.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
                High-density static QR printing with tactile &ldquo;Scan for help&rdquo; protective pull-covers. Choose the format configured for your setup.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Product 1: Helmet Product Card */}
              <article className="glass-card flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="relative aspect-square w-full overflow-hidden bg-[#030913] p-4">
                    <Image
                      src={images.products.helmet}
                      alt="Two RescueKaro helmet stickers on charcoal studio surface, one closed with Scan for help cover and one with cover partially lifted"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-2 transition duration-500 hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 rounded-lg bg-rescue/20 border border-rescue/30 px-2.5 py-1 text-[10px] font-black uppercase text-rescue backdrop-blur-md">
                      Rider Standard
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-white">Helmet QR Sticker</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-safety">
                      Curved Surface Adhesive
                    </p>
                    <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-sm">
                      Precision-cut vinyl engineered to contour cleanly around curved helmet shells and fairings. Features the durable pull-tab cover reading &ldquo;Scan for help&rdquo;.
                    </p>
                    <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400" /> 2× Helmet Stickers + 2× Covers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400" /> UV & Rainproof Vinyl
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <Link href="/order?useCase=Helmet" className="button button-primary w-full">
                    <span>Configure Helmet Kit</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>

              {/* Product 2: Car Product Card */}
              <article className="glass-card flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="relative aspect-square w-full overflow-hidden bg-[#030913] p-4">
                    <Image
                      src={images.products.car}
                      alt="RescueKaro slim horizontal car window emergency QR sticker with visible branding and Scan for help privacy cover"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-2 transition duration-500 hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 rounded-lg bg-safety/20 border border-safety/30 px-2.5 py-1 text-[10px] font-black uppercase text-safety backdrop-blur-md">
                      Automotive Glass
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-white">Car Window Sticker</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-safety">
                      Slim Horizontal Profile
                    </p>
                    <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-sm">
                      Streamlined horizontal format designed for vehicle exterior fixed rear quarter-windows. Clear emergency branding without obstructing driver road vision.
                    </p>
                    <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400" /> Glass-Safe Exterior Tack
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400" /> Direct 112 Helpline Integration
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <Link href="/order?useCase=Car" className="button button-primary w-full">
                    <span>Configure Car Kit</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>

              {/* Product 3: Compact Product Card */}
              <article className="glass-card flex flex-col justify-between overflow-hidden sm:col-span-2 lg:col-span-1">
                <div>
                  <div className="relative aspect-square w-full overflow-hidden bg-[#030913] p-4">
                    <Image
                      src={images.products.compact}
                      alt="Three RescueKaro compact stickers for phone cases, luggage tags, and ID badge holders showing closed, partially lifted, and open states"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-2 transition duration-500 hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-400 backdrop-blur-md">
                      Other Uses
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-white">Compact Everyday Sticker</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-safety">
                      Phone Cases & ID Holders
                    </p>
                    <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-sm">
                      Miniaturized form factor optimized for smooth smartphone cases, rigid luggage transit tags, and workplace lanyard ID-card holders.
                    </p>
                    <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400" /> Camera Lens Clearance
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400" /> Rigid Tag Compatibility
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <Link href="/order?useCase=ID%20%2F%20Personal" className="button button-primary w-full">
                    <span>Configure Compact Kit</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* WHERE YOU CAN USE RESCUEKARO (USE CASES) */}
        <section id="use-cases" className="section bg-[#050d1a]">
          <div className="container-page">
            <div className="max-w-2xl">
              <span className="eyebrow">Everyday Gear & Vehicles</span>
              <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
                Where You Can Use RescueKaro.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                A single emergency identification ecosystem designed for realistic everyday carry across India.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {/* Use Case 1: Helmets & Motorcycles */}
              <article className="glass-card group flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.uses["Helmets & Motorcycles"]}
                    alt="Helper lifting Scan for help cover and pointing smartphone camera to scan RescueKaro QR code on a helmet resting on a parked motorcycle in India"
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 rounded-lg bg-[#050d1a]/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    Helmets & Motorcycles
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <h3 className="text-xl font-black text-white sm:text-2xl">Helmets & Motorcycles</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                    Resting on your helmet shell, RescueKaro ensures first responders can instantly identify you and reach your family even if your phone is locked or damaged.
                  </p>
                  <Link href="/order?useCase=Helmet" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-safety transition hover:underline">
                    Explore helmet placement <ArrowRight size={13} />
                  </Link>
                </div>
              </article>

              {/* Use Case 2: Cars */}
              <article className="glass-card group flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.uses["Cars"]}
                    alt="Adult scanning exposed RescueKaro QR code on a parked car rear fixed side window"
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 rounded-lg bg-[#050d1a]/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    Cars
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <h3 className="text-xl font-black text-white sm:text-2xl">Cars</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                    Adhered to exterior rear side glass, bystanders can lift the cover and scan without entering the vehicle, accessing driver emergency details immediately.
                  </p>
                  <Link href="/order?useCase=Car" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-safety transition hover:underline">
                    Explore car placement <ArrowRight size={13} />
                  </Link>
                </div>
              </article>

              {/* Use Case 3: Bags & Everyday Carry */}
              <article className="glass-card group flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.uses["Bags & Everyday Carry"]}
                    alt="Adult scanning RescueKaro QR sticker attached to a smooth rigid luggage tag on a travel backpack"
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 rounded-lg bg-[#050d1a]/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    Bags & Everyday Carry
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <h3 className="text-xl font-black text-white sm:text-2xl">Bags & Everyday Carry</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                    Affixed to rigid luggage tags on travel backpacks and commute bags, giving solo commuters and travelers essential offline emergency coverage.
                  </p>
                  <Link href="/order?useCase=Bag" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-safety transition hover:underline">
                    Explore bag placement <ArrowRight size={13} />
                  </Link>
                </div>
              </article>

              {/* Use Case 4: Phone Cases & ID Holders */}
              <article className="glass-card group flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030913]">
                  <Image
                    src={images.uses["Phone Cases & ID Holders"]}
                    alt="RescueKaro compact emergency stickers affixed neatly to a smartphone case and lanyard ID card badge"
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 rounded-lg bg-[#050d1a]/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    Phone Cases & ID Holders
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <h3 className="text-xl font-black text-white sm:text-2xl">Phone Cases & ID Holders</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
                    Positioned unobtrusively on phone cases without blocking camera lenses, or on office lanyard cards, keeping your emergency contacts within reach 24/7.
                  </p>
                  <Link href="/order?useCase=ID%20%2F%20Personal" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-safety transition hover:underline">
                    Explore phone & ID placement <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* WHY RESCUEKARO EXISTS */}
        <section className="relative overflow-hidden bg-[#071324] py-20 lg:py-28">
          <div className="relative aspect-[16/9] w-full md:absolute md:inset-0 md:aspect-auto">
            <Image
              src={images.emergency}
              alt="Roadside helper scanning emergency details from helmet"
              fill
              sizes="100vw"
              className="object-cover object-center opacity-30 md:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071324] via-[#071324]/85 to-[#071324]/60 md:bg-gradient-to-r md:from-[#071324] md:via-[#071324]/90 md:to-transparent" />
          </div>

          <div className="container-page relative z-10 flex items-center">
            <div className="max-w-xl">
              <span className="eyebrow !text-blue-300">
                <ShieldAlert size={14} className="text-rescue" />
                The Golden Hour
              </span>
              <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl text-white">
                You may not always be able to explain who to call.
              </h2>
              <p className="mt-6 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                In sudden road accidents or medical incidents, phones are often locked, cracked, out of battery, or flung far away. RescueKaro stays physically affixed to your helmet or gear, giving doctors and helpers instant answers without delay.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                {["Notice Pull Cover", "Pull Tab", "Scan With Camera", "Reach Family"].map((step, i) => (
                  <span key={step} className="flex items-center gap-2">
                    <b className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md">
                      {step}
                    </b>
                    {i < 3 && <ChevronRight size={15} className="text-safety" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* OFFLINE BY DESIGN ARCHITECTURE */}
        <section className="section bg-[#050d1a]">
          <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow !text-blue-300">
                <WifiOff size={13} className="text-safety" />
                Zero Infrastructure Dependency
              </span>
              <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
                No signal?<br />
                RescueKaro still works.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
                Unlike smart wristbands or app-based profiles that fail when mobile data drops, RescueKaro writes your emergency profile directly into the QR code matrix. The scanner&apos;s phone decodes it instantly without reaching any server.
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {["No App to Install", "No Login Needed", "No Server Lookup", "No Battery"].map((chip) => (
                  <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200" key={chip}>
                    <CircleOff size={14} className="text-rescue" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Architecture Comparison Cards */}
            <div className="space-y-4">
              <div className="glass-card border-red-500/20 bg-red-950/20 p-5">
                <div className="flex items-center justify-between text-xs font-bold text-red-400">
                  <span>❌ Traditional Emergency Apps</span>
                  <span>Fails in remote areas</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Requires unlocking phone, cellular data, server uptime, and helper having compatible app or account.
                </p>
              </div>

              <div className="glass-card border-emerald-500/40 bg-emerald-950/20 p-5 ring-1 ring-emerald-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>✅ RescueKaro Offline QR</span>
                  <span>100% Reliable Anywhere</span>
                </div>
                <p className="mt-2 text-xs text-slate-200">
                  Standard camera scans the plain-text payload directly from the physical sticker. Zero network latency, zero dependencies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STARTER KIT / WHAT'S IN THE BOX */}
        <section id="starter-kit" className="section bg-[#071324]">
          <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <span className="eyebrow">Complete Starter Package</span>
              <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
                Prepared twice over.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
                Every kit comes packed with two protected emergency QR stickers and covers—ready for your helmet and your secondary gear or vehicle.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "2× High-Density QR Stickers",
                  "2× Protective Pull-Tab Masks",
                  "All-Weather UV Vinyl",
                  "1× Surface Alcohol Primer",
                  "Direct Helpline Coding (112)",
                  "Express Pan-India Delivery",
                ].map((item) => (
                  <div className="glass-card flex items-center gap-3 p-4" key={item}>
                    <CheckCircle2 size={18} className="text-safety shrink-0" />
                    <span className="text-xs font-bold text-white sm:text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <ButtonPair />
            </div>

            {/* Product Card Callout */}
            <div className="glass-panel relative overflow-hidden p-8 text-center sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-safety/30 bg-safety/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-safety">
                <Sparkles size={13} /> Complete Package
              </span>
              <h3 className="mt-4 text-3xl font-black text-white">Starter Kit Package</h3>
              <p className="mt-2 text-sm text-slate-300">Complete emergency identification for you and your bike.</p>

              <div className="my-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="block text-2xl font-black text-white sm:text-3xl">2 Stickers + 2 Covers</span>
                <span className="mt-1 block text-xs font-semibold text-safety">100% Offline • Zero Subscription</span>
              </div>

              <Link href="/order" className="button button-primary w-full">
                Order Your Kit Now
              </Link>
              <p className="mt-3 text-xs text-slate-400">Pan-India express dispatch • 100% money-back guarantee</p>
            </div>
          </div>
        </section>

        {/* REVIEWS & SOCIAL PROOF */}
        <Reviews />

        {/* FREQUENTLY ASKED QUESTIONS */}
        <FAQ />

        {/* FINAL CALL TO ACTION (Image 12: rescuekaro-cta.webp) */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#061426] via-[#091b33] to-[#040b15] py-20 text-white lg:py-24">
          <div className="container-page relative z-10">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              {/* Text Side */}
              <div className="lg:col-span-7">
                <span className="eyebrow !text-blue-300">
                  Scan karo safe karo
                </span>
                <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
                  Get your RescueKaro stickers.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  Take two minutes today to configure your emergency QR. It could make the vital difference tomorrow. Complete offline peace of mind for you, your vehicle, and your loved ones.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/order" className="button button-primary !min-h-12 !px-8 text-sm">
                    <span>Get Your QR Sticker</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/contact" className="button button-secondary !min-h-12 !px-6 text-sm">
                    Have a Question? Contact Us
                  </Link>
                </div>
              </div>

              {/* Image Side */}
              <div className="lg:col-span-5">
                <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#030913] p-2 shadow-2xl backdrop-blur-xl">
                  <Image
                    src={images.cta}
                    alt="Neat premium arrangement of RescueKaro helmet, car, and compact emergency QR sticker formats on dark charcoal surface with closed and lifted protective covers"
                    fill
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="rounded-2xl object-cover object-center transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
