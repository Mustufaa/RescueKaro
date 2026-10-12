"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { qrWizardService, type StickerOrder } from "@/services/qr-wizard.service";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<StickerOrder>();
  const [error, setError] = useState("");
  useEffect(() => {
    qrWizardService.order(id).then(setOrder).catch(reason => setError(reason instanceof Error ? reason.message : "Could not load sticker request."));
  }, [id]);
  return <div className="mx-auto max-w-4xl space-y-5"><Link className="text-sm text-safety" href="/dashboard/orders">Back to requests and orders</Link>
    {error ? <p role="alert" className="text-rescue">{error}</p> : !order ? <p>Loading sticker request...</p> : <>
      <header><span className="eyebrow">Sticker request</span><h1 className="display mt-2 text-3xl text-white">{order.quantity} {order.stickerType.replaceAll("_", "/")} sticker{order.quantity === 1 ? "" : "s"}</h1></header>
      <section className="glass-panel space-y-3 p-6 text-sm"><p>Status: <b>{order.status}</b></p><p>Payment: <b>not required</b></p>
        <h2 className="pt-2 font-bold text-white">Delivery information</h2><p>{order.delivery.recipient} · {order.delivery.phone}</p>
        <p className="break-words text-slate-300">{[order.delivery.line1, order.delivery.line2, order.delivery.landmark, order.delivery.city, order.delivery.state, order.delivery.pinCode, order.delivery.country].filter(Boolean).join(", ")}</p>
        <p className="text-xs text-slate-400">The request is recorded. A shipment has not been booked automatically.</p>
      </section>
      <section className="glass-panel p-6"><h2 className="font-bold text-white">Sticker emergency pages</h2>
        {order.stickers.map(sticker => <a key={sticker.id} href={sticker.publicUrl} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-safety">Open sticker serial {sticker.serialCode}</a>)}
        <Link href="/dashboard/rescuekaro" className="button button-secondary mt-5">View and download QR codes</Link>
      </section>
    </>}
  </div>;
}
