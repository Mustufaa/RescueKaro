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
      <span className="text-xs font-black uppercase tracking-[.16em] text-safety">Verified service data</span>
      <h1 className="mt-3 text-4xl font-black">Emergency directory.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Manage reviewed location-specific emergency information. Unverified numbers must never be inserted into a customer QR.
      </p>
      <div className="mt-7 overflow-x-auto surface">
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
                <td className="font-black">{number}</td>
                <td>
                  <span className="text-emerald-400">
                    <CheckCircle2 className="mr-1 inline" size={14} />
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
      <div className="mt-5 flex gap-3 border-l-4 border-emerald-500 bg-emerald-950/30 p-5 text-sm text-emerald-200">
        <Database />
        National Emergency, Police, Fire Brigade and Ambulance are included in the development record and can be encoded into the QR after review.
      </div>
      <button className="button button-primary mt-6">
        <Siren size={16} />
        Add directory record
      </button>
    </div>
  );
}
