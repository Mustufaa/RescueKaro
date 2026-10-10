"use client";

import Link from "next/link";
import { AlertTriangle, Copy, Loader2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/services/api";
import { BrandLogo } from "@/components/shared/BrandLogo";

type Contact = { name: string; relationship: string; phone: string; primary: boolean };
type PublicProfile = {
  stickerState: string; displayName: string; bloodGroup: string; city: string; dateOfBirth?: string; age?: number;
  contacts: Contact[]; medical: Record<string, string>;
  address?: { line1: string; line2: string; landmark: string; city: string; state: string; pinCode: string; country: string };
  emergencyDirectory: Array<{ label: string; number: string; source: string; lastVerified: string }>;
};

export default function PublicQrPage() {
  const params = useParams<{ publicToken: string; token?: string }>();
  const serial = params.token ? params.publicToken : undefined;
  const token = params.token ?? params.publicToken;
  const [profile, setProfile] = useState<PublicProfile>();
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationUrl, setLocationUrl] = useState("");
  const primary = useMemo(() => profile?.contacts.find((contact) => contact.primary) ?? profile?.contacts[0], [profile]);

  useEffect(() => {
    const path = serial
      ? `/public/qr/${encodeURIComponent(serial)}/${encodeURIComponent(token)}`
      : `/public/qr/${encodeURIComponent(token)}`;
    apiRequest<PublicProfile>(path)
      .then(setProfile)
      .catch((reason: unknown) => setError(reason instanceof ApiError && reason.status === 410
        ? "This RescueKaro sticker has been replaced or revoked."
        : "We could not find an active emergency profile for this sticker."));
  }, [serial, token]);

  function requestLocation() {
    if (!primary || !navigator.geolocation) {
      setError("Location is unavailable on this browser. You can still call the emergency contact.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = `https://maps.google.com/?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
        setLocationUrl(map);
        setLocating(false);
        const phone = primary.phone.replace(/\D/g, "");
        const message = `Emergency: I scanned ${profile?.displayName}'s RescueKaro sticker. My current pinned location is ${map}. Please verify and respond.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      },
      () => {
        setLocating(false);
        setError("Location permission was denied. Call the contact, or share your live location manually inside WhatsApp.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  if (!profile && !error) return <main className="grid min-h-screen-dvh place-items-center bg-[#050d1a] text-slate-200"><Loader2 className="animate-spin text-safety" aria-label="Loading emergency profile" /></main>;
  if (!profile) return <main className="grid min-h-screen-dvh place-items-center bg-[#050d1a] px-5 text-center text-slate-100"><div className="glass-panel max-w-md p-8"><AlertTriangle className="mx-auto text-rescue" size={42}/><h1 className="display mt-4 text-2xl">Sticker unavailable</h1><p className="mt-3 text-sm text-slate-300">{error}</p><Link href="/" className="button button-secondary mt-6">RescueKaro home</Link></div></main>;

  return <main className="min-h-screen-dvh bg-[#050d1a] px-3 py-5 text-slate-100 safe-top safe-bottom safe-px sm:px-6"><div className="mx-auto max-w-xl space-y-4">
    <header className="flex items-center justify-between gap-3"><BrandLogo/><span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[10px] font-black uppercase text-emerald-300"><ShieldCheck size={13}/>Active</span></header>
    {serial && <p className="text-center text-xs font-bold tracking-wider text-slate-400">Sticker {serial}</p>}
    <section className="glass-panel overflow-hidden"><div className="bg-gradient-to-r from-red-600 to-red-500 p-5"><p className="text-xs font-black uppercase tracking-[.18em]">Emergency information</p><h1 className="display mt-1 text-3xl">{profile.displayName}</h1><p className="mt-1 text-sm">{profile.city}{profile.age !== undefined ? ` · Age ${profile.age}` : ""}</p></div>
      <div className="grid grid-cols-2 gap-3 p-4"><div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4"><span className="text-[10px] font-black uppercase text-red-300">Blood group</span><strong className="mt-1 block text-3xl text-white">{profile.bloodGroup}</strong></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-[10px] font-black uppercase text-slate-400">Profile status</span><strong className="mt-2 block text-sm text-emerald-300">Approved & current</strong></div></div>
      <div className="space-y-3 px-4 pb-5">{profile.contacts.map((contact) => <div key={contact.phone} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><div><b className="text-white">{contact.name}</b><p className="text-xs text-slate-400">{contact.relationship}{contact.primary ? " · Primary" : ""}</p></div><a href={`tel:${contact.phone}`} className="button button-primary !min-h-[44px] !px-4" aria-label={`Call ${contact.name}`}><Phone size={17}/>Call</a></div></div>)}
        {Object.entries(profile.medical).map(([label, value]) => <div key={label} className="rounded-xl border border-safety/20 bg-blue-950/30 p-4"><span className="text-[10px] font-black uppercase text-safety">{label.replace(/([A-Z])/g, " $1")}</span><p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{value}</p></div>)}
        {profile.address && <div className="rounded-xl border border-white/10 p-4"><span className="text-[10px] font-black uppercase text-slate-400">Approved address</span><p className="mt-1 text-sm">{Object.values(profile.address).filter(Boolean).join(", ")}</p></div>}
      </div></section>
    <section className="glass-panel p-4"><h2 className="flex items-center gap-2 font-black"><MapPin className="text-safety" size={19}/>Share this pinned location</h2><p className="mt-2 text-xs leading-5 text-slate-400">Your browser asks permission only after you tap. RescueKaro does not save the coordinates. WhatsApp opens a prepared message; you must review and press Send.</p><button onClick={requestLocation} disabled={locating || !primary} className="button button-primary mt-4 w-full">{locating?<Loader2 className="animate-spin" size={17}/>:<MapPin size={17}/>}Open in WhatsApp</button>{locationUrl&&<button onClick={()=>navigator.clipboard.writeText(locationUrl)} className="button button-secondary mt-2 w-full"><Copy size={16}/>Copy location link</button>}<details className="mt-4 text-xs text-slate-400"><summary className="cursor-pointer font-bold text-slate-200">How to share WhatsApp live location</summary><p className="mt-2 leading-5">Open the chat, tap Attach/+, choose Location, then choose Share live location. A website cannot start native live-location sharing or send a message automatically.</p></details></section>
    {profile.emergencyDirectory.map((entry)=><a key={entry.label} href={`tel:${entry.number}`} className="glass-panel flex min-h-[56px] items-center justify-between p-4"><span><b className="block">{entry.label}</b><small className="text-slate-400">Verified source: {entry.source}</small></span><Phone className="text-rescue"/></a>)}
    {error&&<p className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">{error}</p>}
  </div></main>;
}
