import { CheckCircle2, Database, Siren } from "lucide-react";

const rows = [
  ["India", "Uttar Pradesh", "Lucknow", "National Emergency", "112", "ERSS single emergency number"],
  ["India", "Uttar Pradesh", "Lucknow", "Police", "100", "Police helpline"],
  ["India", "Uttar Pradesh", "Lucknow", "Fire Brigade", "101", "Fire and rescue helpline"],
  ["India", "Uttar Pradesh", "Lucknow", "Ambulance", "108", "Ambulance helpline"],
] as const;

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <span className="text-xs font-black uppercase tracking-[.16em] text-safety">
        Verified service data
      </span>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Emergency directory.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Manage reviewed location-specific emergency information. Unverified numbers must never be inserted into a customer QR.
      </p>

      {/* Mobile Card List (< 640px) */}
      <div className="mt-6 space-y-3 sm:hidden">
        {rows.map(([country, state, city, service, number, source]) => (
          <div key={service} className="surface p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{service}</span>
              <b className="font-mono text-base text-safety">{number}</b>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-muted">Location:</span>
              <span>{city}, {state} ({country})</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-muted">Verification:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 size={13} /> Verified
              </span>
            </div>
            <div className="text-[11px] text-muted border-t border-white/5 pt-1.5">
              Source: {source} • Last verified 02 Oct 2026
            </div>
          </div>
        ))}
      </div>

      {/* Desktop & Tablet Table (>= 640px) */}
      <div className="mt-7 hidden overflow-x-auto surface table-wrapper sm:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr>
              {["Country", "State", "City", "Service", "Number", "Verification", "Source", "Last verified"].map((x) => (
                <th className="px-5 py-4 text-[10px] uppercase text-muted" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([country, state, city, service, number, source]) => (
              <tr className="border-t border-line" key={service}>
                <td className="px-5 py-5">{country}</td>
                <td>{state}</td>
                <td>{city}</td>
                <td>{service}</td>
                <td className="font-black font-mono text-safety">{number}</td>
                <td>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={14} />
                    Verified
                  </span>
                </td>
                <td>Mock directory - {source}</td>
                <td>02 Oct 2026</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-950/30 p-4 text-xs sm:text-sm text-emerald-200">
        <Database size={20} className="shrink-0 mt-0.5" />
        <span>
          National Emergency, Police, Fire Brigade and Ambulance are included in the development record and can be encoded into the QR after review.
        </span>
      </div>

      <button className="button button-primary mt-6 min-h-[44px] touch-manipulation">
        <Siren size={16} />
        Add directory record
      </button>
    </div>
  );
}
