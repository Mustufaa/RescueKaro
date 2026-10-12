"use client";

import Image from "next/image";
import { QrLink } from "@/components/qr/QrLink";
import Link from "next/link";
import { Download, QrCode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/services/api";
import { qrService } from "@/services/qr.service";
import type { Sticker } from "@/services/qr-wizard.service";

export function MyRescueKaro() {
  const [codes, setCodes] = useState<Sticker[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const saved = await apiRequest<Sticker[]>("/qr-codes");
      setCodes(saved);
      const previews = await Promise.all(saved.filter(code => code.status === "ACTIVE")
        .map(async code => [code.id, await qrService.toDataUrl(code.publicUrl)] as const));
      setImages(Object.fromEntries(previews));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load your QR codes."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function generateDigital() {
    setBusy(true); setError("");
    try { await apiRequest<Sticker>("/qr-codes", { method: "POST" }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not generate your digital QR."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <header><span className="eyebrow">Your account</span><h1 className="display mt-2 text-2xl text-white sm:text-4xl">Your RescueKaro QR codes</h1>
      <p className="mt-2 text-sm text-slate-400">Each code opens the current approved emergency profile.</p></header>
    {error && <div className="glass-panel p-4"><p role="alert" className="text-rescue">{error}</p><button className="button button-secondary mt-3" onClick={() => void load()}>Retry</button></div>}
    {loading ? <p className="text-slate-300">Loading QR codes...</p> : codes.length === 0 ?
      <section className="glass-panel p-6"><QrCode size={42} className="text-safety" /><h2 className="mt-3 text-xl font-bold">No QR yet</h2>
        <p className="mt-2 text-sm text-slate-400">Start or resume your saved QR setup.</p><Link href="/order" className="button button-primary mt-5">Generate QR</Link></section> :
      <div className="grid gap-5 sm:grid-cols-2">{codes.map(code => <section key={code.id} className="glass-panel p-5 text-center">
        <p className="font-bold text-white">{/^\d+$/.test(code.serialCode) ? "Sticker" : "Digital QR"} serial {code.serialCode}</p>
        <p className="mt-1 text-xs text-slate-400">{code.status}</p>
        {images[code.id] ? <Image unoptimized src={images[code.id]} width={520} height={520} alt={`QR code ${code.serialCode}`} className="mx-auto mt-4 w-full max-w-[250px] rounded-xl bg-white p-3" />
          : <div className="mx-auto mt-4 grid aspect-square w-full max-w-[250px] place-items-center rounded-xl bg-white text-slate-400"><QrCode size={48} /></div>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {images[code.id] && <a download={`rescuekaro-${code.serialCode}.png`} href={images[code.id]} className="button button-secondary text-xs"><Download size={15} />Download PNG</a>}
          <a href={code.publicUrl} target="_blank" rel="noreferrer" className="button button-secondary text-xs">Open emergency page</a>
        </div>
        <QrLink url={code.publicUrl} />
      </section>)}</div>}
    <div className="flex flex-wrap gap-3"><Link href="/order?new=1" className="button button-primary">Generate additional stickers</Link>
      <button disabled={busy} onClick={() => void generateDigital()} className="button button-secondary">{busy ? "Generating..." : "Get digital QR"}</button>
      <Link href="/dashboard/emergency-profile" className="button button-secondary">Edit emergency profile</Link></div>
  </div>;
}
