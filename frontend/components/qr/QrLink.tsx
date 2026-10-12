"use client";

import { useState } from "react";

export function QrLink({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i.test(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setMessage("Select the URL above and copy it manually.");
    }
  }

  return <div className="mt-3 space-y-2 text-left">
    <label className="block text-xs text-slate-400">Emergency page URL
      <input readOnly value={url} onFocus={event => event.target.select()} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-sm text-white" />
    </label>
    <button type="button" onClick={() => void copy()} className="button button-secondary w-full">Copy link</button>
    {message && <p role="status" className="text-xs text-slate-300">{message}</p>}
    {local && <p className="text-xs text-amber-300">Local preview: this link works on this computer. Phone scanning needs your public HTTPS address.</p>}
  </div>;
}
