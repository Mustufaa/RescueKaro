"use client";

import Image from "next/image";
import { Download, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/services/api";
import { qrService } from "@/services/qr.service";

export function MyRescueKaro() {
  const [image, setImage] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [state, setState] = useState("Loading your active sticker...");

  useEffect(() => {
    apiRequest<Array<{ publicUrl: string; status: string; serialCode: string }>>("/qr-codes")
      .then(async (stickers) => {
        const sticker = stickers.find((item) => item.status === "ACTIVE");
        if (!sticker) throw new Error("No active sticker is attached to this account yet.");
        setPublicUrl(sticker.publicUrl);
        setImage(await qrService.toDataUrl(sticker.publicUrl));
        setState(`Active sticker · ${sticker.serialCode}`);
      })
      .catch((error: unknown) => setState(error instanceof Error ? error.message : "Could not load your sticker."));
  }, []);

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><span className="eyebrow">Your account</span><h1 className="display mt-2 text-2xl sm:text-4xl text-white">Your RescueKaro QR</h1><p className="mt-1 text-xs sm:text-sm text-slate-400">{state}</p></div>
    <section className="glass-panel p-5 sm:p-8 text-center">
      {image ? <Image unoptimized src={image} width={520} height={520} alt="Dynamic RescueKaro emergency profile QR" className="mx-auto w-full max-w-[280px] rounded-xl bg-white p-3" /> : <div className="mx-auto grid aspect-square w-full max-w-[280px] place-items-center rounded-xl bg-white text-slate-400"><QrCode size={48}/></div>}
      <p className="mx-auto mt-4 max-w-lg text-xs text-slate-400">This QR contains only your private emergency page URL. Profile information loads from RescueKaro and needs an internet connection.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {image && <a download="rescuekaro-qr.png" href={image} className="button button-secondary !min-h-[44px] text-xs"><Download size={15}/>Download PNG</a>}
        {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="button button-secondary !min-h-[44px] text-xs">Open emergency page</a>}
      </div>
    </section>
  </div>;
}
