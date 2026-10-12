"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/services/api";
import { qrWizardService, type StickerOrder } from "@/services/qr-wizard.service";

type HistoricalOrder = { id: string; orderNumber: string; product: string; useCase: string; paymentStatus: string;
  orderStatus: string; totalPaise: number; createdAt: string };

export default function Page() {
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [stickers, setStickers] = useState<StickerOrder[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [history, requests] = await Promise.all([apiRequest<HistoricalOrder[]>("/orders"), qrWizardService.orders()]);
      setOrders(history); setStickers(requests);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load orders."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <div className="mx-auto max-w-5xl space-y-5"><span className="eyebrow">Order history</span>
    <h1 className="display text-3xl text-white">Your sticker requests and orders</h1>
    {busy ? <p>Loading orders...</p> : error ? <div role="alert"><p className="text-rescue">{error}</p><button className="button button-secondary mt-3" onClick={() => void load()}>Retry</button></div> : <>
      {stickers.map(order => <article key={order.id} className="glass-panel p-5">
        <b className="text-white">{order.quantity} {order.stickerType.replaceAll("_", "/")} sticker{order.quantity === 1 ? "" : "s"}</b>
        <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()} · {order.status}</p>
        <p className="mt-3 text-xs text-safety">Payment: not required · Serials: {order.stickers.map(sticker => sticker.serialCode).join(", ")}</p>
        <Link href={`/dashboard/sticker-orders/${order.id}`} className="mt-3 inline-block text-sm text-safety">View request and delivery details</Link>
      </article>)}
      {orders.length > 0 && <h2 className="pt-3 text-xl font-bold text-white">Historical orders</h2>}
      {orders.map(order => <article key={order.id} className="glass-panel p-5"><div className="flex flex-wrap justify-between gap-3">
        <div><b className="text-white">{order.orderNumber}</b><p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()} · {order.product} · {order.useCase}</p></div>
        <p className="text-white">₹{(order.totalPaise / 100).toFixed(2)}</p></div>
        <p className="mt-3 text-xs text-safety">Historical payment: {order.paymentStatus} · Order: {order.orderStatus}</p>
        <Link href={`/dashboard/orders/${order.id}`} className="mt-3 inline-block text-sm text-safety">View details</Link>
      </article>)}
      {!stickers.length && !orders.length && <div className="glass-panel p-6"><p className="text-slate-400">You have no sticker requests or orders yet.</p><Link href="/order" className="button button-primary mt-4">Generate QR</Link></div>}
    </>}
  </div>;
}
