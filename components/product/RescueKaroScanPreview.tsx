import { Phone } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { getVerifiedEmergencyServices } from "@/lib/emergency-services";
import type { EmergencyProfile } from "@/types";

export function RescueKaroScanPreview({ profile, compact = false }: { profile: EmergencyProfile; compact?: boolean }) {
  const contacts = profile.contacts.filter((_, i) => i === 0 || profile.selections.additionalContacts);
  const emergencyServices = getVerifiedEmergencyServices(profile);

  return (
    <article
      className={`w-full min-w-0 overflow-hidden rounded-[20px] border border-line bg-[#f8fafc] text-[#07182d] shadow-lift sm:rounded-[28px] ${
        compact ? "p-4" : "p-4 sm:p-6"
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <BrandLogo variant="full" />
        <span className="h-3 w-3 shrink-0 animate-pulseSoft rounded-full bg-red-500" />
      </header>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[.14em] text-red-600 sm:tracking-[.18em]">
        Emergency information
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-black sm:text-2xl">{profile.fullName || "Your name"}</h2>
          <p className="mt-1 break-words text-sm text-slate-500">
            {[profile.age && profile.selections.age ? `Age ${profile.age}` : "", profile.city, profile.state].filter(Boolean).join(" - ")}
          </p>
        </div>
        <strong className="shrink-0 text-4xl text-red-600 sm:text-5xl">{profile.bloodGroup || "-"}</strong>
      </div>

      {contacts.length > 0 && (
        <section className="mt-6">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Emergency contacts</h3>
          <div className="mt-2 space-y-2">
            {contacts.map((c) => (
              <div className={`flex min-w-0 items-center gap-3 rounded-xl p-3 ${c.primary ? "bg-blue-50 ring-1 ring-blue-200" : "bg-slate-100"}`} key={c.id}>
                <Phone size={16} className="shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <b className="block break-words text-sm">
                    {c.name || "Contact name"}
                    {c.primary && <span className="ml-2 whitespace-nowrap text-[8px] uppercase text-blue-600">Primary</span>}
                  </b>
                  <span className="block break-words text-xs text-slate-500">
                    {c.relationship} - {c.phone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(profile.selections.allergies && profile.medical.allergies) ||
      (profile.selections.medication && profile.medical.medication) ||
      (profile.selections.emergencyNote && profile.medical.note) ? (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Medical information</h3>
          {profile.selections.allergies && profile.medical.allergies && (
            <p className="mt-2 break-words text-xs">
              <b>Allergies:</b> {profile.medical.allergies}
            </p>
          )}
          {profile.selections.medication && profile.medical.medication && (
            <p className="mt-2 break-words text-xs">
              <b>Medication:</b> {profile.medical.medication}
            </p>
          )}
          {profile.selections.emergencyNote && profile.medical.note && (
            <p className="mt-2 break-words text-xs">
              <b>Note:</b> {profile.medical.note}
            </p>
          )}
        </section>
      ) : null}

      {profile.selections.address && profile.address.line1 && (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Address</h3>
          <p className="mt-2 break-words text-xs">
            {[profile.address.line1, profile.address.line2, profile.address.city, profile.address.state, profile.address.pinCode, profile.address.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        </section>
      )}

      {profile.selections.emergencyServices && emergencyServices.length > 0 && (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Emergency services</h3>
          {emergencyServices.map((s) => (
              <div className="mt-2 flex justify-between gap-3 text-sm" key={s.label}>
                <span className="break-words">{s.label}</span>
                <b className="shrink-0">{s.number}</b>
              </div>
            ))}
        </section>
      )}

      <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-[10px] font-black uppercase tracking-[.14em] text-blue-700 sm:tracking-[.16em]">
        RescueKaro - Scan Karo. Safe Karo.
      </footer>
    </article>
  );
}
