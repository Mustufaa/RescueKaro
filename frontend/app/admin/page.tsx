import Link from "next/link";
export default function Page() {
  return <div className="mx-auto max-w-4xl space-y-5"><h1 className="text-3xl font-black text-white">Operations</h1><p className="text-slate-300">Physical sticker ordering and payment are currently unavailable. No new fulfilment queue is being created.</p><Link href="/admin/orders" className="text-safety">Historical orders</Link></div>;
}
