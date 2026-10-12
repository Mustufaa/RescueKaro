"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { qrWizardService, type StickerOrder } from "@/services/qr-wizard.service";

type User = { fullName: string; phone: string; email: string };
type Profile = { fullName: string; bloodGroup: string; contacts: unknown[]; updatedAt: string };
type Qr = { id: string; serialCode: string; status: string; publicUrl: string; createdAt: string };
type Order = { id: string; orderNumber: string; product: string; paymentStatus: string; totalPaise: number };

export default function Page() {
  const [user, setUser] = useState<User>();
  const [profile, setProfile] = useState<Profile>();
  const [qr, setQr] = useState<Qr[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stickerOrders, setStickerOrders] = useState<StickerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [session, savedProfile, codes, history, stickers] = await Promise.all([
        authService.session(),
        apiRequest<Profile>("/emergency-profile").catch(reason => {
          if (reason instanceof ApiError && reason.status === 404) return undefined;
          throw reason;
        }),
        apiRequest<Qr[]>("/qr-codes"),
        apiRequest<Order[]>("/orders"),
        qrWizardService.orders(),
      ]);
      setUser(session.user); setProfile(savedProfile); setQr(codes); setOrders(history); setStickerOrders(stickers);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load dashboard."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <p className="text-slate-300">Loading your dashboard...</p>;
  if (error) return <div className="glass-panel p-6"><p role="alert" className="text-rescue">{error}</p><button className="button button-primary mt-4" onClick={() => void load()}>Retry</button></div>;

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><span className="eyebrow">Customer hub</span><h1 className="display mt-2 text-3xl text-white">Welcome, {user?.fullName}</h1><p className="mt-2 text-sm text-slate-400">{user?.phone} · {user?.email}</p></header>
    <div className="grid gap-4 sm:grid-cols-3">{[["QR codes", qr.length], ["Emergency profiles", profile ? 1 : 0], ["Sticker requests", stickerOrders.length]].map(([label, count]) => <div key={label} className="glass-panel p-5"><p className="text-xs text-slate-400">{label}</p><b className="mt-2 block text-3xl text-white">{count}</b></div>)}</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="glass-panel p-6"><h2 className="text-xl font-bold text-white">Emergency profile</h2>
        {profile ? <><p className="mt-3 text-slate-200">{profile.fullName} · {profile.bloodGroup}</p><p className="mt-2 text-sm text-slate-400">{profile.contacts.length} emergency contact{profile.contacts.length === 1 ? "" : "s"}</p><Link className="button button-secondary mt-5" href="/dashboard/emergency-profile">Edit profile</Link></>
          : <><p className="mt-3 text-slate-400">No emergency profile saved yet.</p><Link className="button button-primary mt-5" href="/order">Start QR setup</Link></>}
      </section>
      <section className="glass-panel p-6"><h2 className="text-xl font-bold text-white">Your QR codes</h2>
        {qr.length ? <><p className="mt-3 text-slate-300">{qr.length} QR code{qr.length === 1 ? "" : "s"} linked to your emergency profile.</p><Link className="button button-primary mt-5" href="/dashboard/rescuekaro">View and download QR</Link><Link className="button button-secondary mt-3" href="/order?new=1">Generate additional stickers</Link></>
          : <><p className="mt-3 text-slate-400">You have no QR yet. Your saved setup will resume where you left off.</p><Link className="button button-primary mt-5" href="/order">Generate QR</Link></>}
      </section>
    </div>
    <section className="glass-panel p-6"><h2 className="text-xl font-bold text-white">Sticker requests</h2>
      {stickerOrders.length ? <div className="mt-4 grid gap-3">{stickerOrders.map(order => <div key={order.id} className="rounded-xl border border-white/10 p-4 text-sm">
        <p className="font-bold">{order.quantity} {order.stickerType.replaceAll("_", "/")} sticker{order.quantity === 1 ? "" : "s"} · {order.status}</p>
        <p className="mt-1 text-slate-400">Payment: not required · {new Date(order.createdAt).toLocaleDateString()}</p>
        <Link className="mt-2 inline-block text-safety" href={`/dashboard/sticker-orders/${order.id}`}>View delivery details</Link>
        <div className="mt-2 flex flex-wrap gap-3">{order.stickers.map(sticker => <a key={sticker.id} className="text-safety" href={sticker.publicUrl} target="_blank" rel="noreferrer">Open sticker {sticker.serialCode}</a>)}</div>
      </div>)}</div> : <p className="mt-2 text-sm text-slate-400">No sticker requests yet.</p>}
      {orders.length ? <Link href="/dashboard/orders" className="mt-4 inline-block text-sm text-safety">View historical orders</Link> : null}
    </section>
  </div>;
}
