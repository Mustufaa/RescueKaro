"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { qrService } from "@/services/qr.service";
import { apiRequest } from "@/services/api";

export function GeneratedQRPanel() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    apiRequest<Array<{ publicUrl: string }>>("/qr-codes")
      .then((stickers) => stickers[0] && qrService.toDataUrl(stickers[0].publicUrl))
      .then((image) => image && setUrl(image))
      .catch(() => setUrl(""));
  }, []);

  return (
    <section className="glass-panel p-5 sm:p-6 text-center">
      <h2 className="font-black text-white text-base">Physical Emergency QR</h2>
      {url && (
        <div className="mx-auto mt-4 w-full max-w-[240px] rounded-2xl bg-white p-3 shadow-xl">
          <Image
            unoptimized
            src={url}
            width={520}
            height={520}
            alt="Generated emergency QR associated with this order"
            className="h-auto w-full rounded-xl object-contain"
          />
        </div>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href="/dashboard/rescuekaro"
          className="button button-secondary !min-h-[44px] text-xs font-bold"
        >
          <Eye size={15} />
          <span>View & Test</span>
        </Link>
        {url && (
          <a
            href={url}
            download="rescuekaro-qr.png"
            className="button button-secondary !min-h-[44px] text-xs font-bold"
          >
            <Download size={15} />
            <span>Download PNG</span>
          </a>
        )}
      </div>
    </section>
  );
}
