"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  PhoneCall,
  Share2,
  ShieldAlert,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { getVerifiedEmergencyServices } from "@/lib/emergency-services";
import type { EmergencyProfile } from "@/types";

interface LocationState {
  status: "idle" | "locating" | "success" | "denied" | "unsupported";
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  mapsUrl?: string;
  errorMessage?: string;
}

export function RescueKaroScanPreview({
  profile,
  compact = false,
}: {
  profile: EmergencyProfile;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>({ status: "idle" });

  const contacts = profile.contacts.filter(
    (_, i) => i === 0 || profile.selections.additionalContacts
  );
  const primaryContact = contacts.find((c) => c.primary) || contacts[0];
  const emergencyServices = getVerifiedEmergencyServices(profile);

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationState({
        status: "unsupported",
        errorMessage: "GPS location is not supported on this browser.",
      });
      return;
    }

    setLocationState({ status: "locating" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        setLocationState({
          status: "success",
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          mapsUrl,
        });
      },
      (err) => {
        let msg = "Could not retrieve GPS location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. You can still call contacts directly.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Please try again or call directly.";
        }
        setLocationState({
          status: "denied",
          errorMessage: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const copyLocation = async () => {
    if (!locationState.mapsUrl) return;
    try {
      await navigator.clipboard.writeText(
        `RescueKaro Emergency SOS - ${profile.fullName || "User"}\nLocation: ${locationState.mapsUrl}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const primaryPhone = primaryContact?.phone?.replace(/\s+/g, "") || "";
  const locationMsg = locationState.mapsUrl
    ? `EMERGENCY! I am with ${profile.fullName || "the user"} (Blood Group: ${profile.bloodGroup || "Unknown"}). Current Location: ${locationState.mapsUrl}`
    : `EMERGENCY! I am with ${profile.fullName || "the user"} (Blood Group: ${profile.bloodGroup || "Unknown"}). Please call back immediately!`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(locationMsg)}`;
  const smsUrl = primaryPhone
    ? `sms:${primaryPhone}?body=${encodeURIComponent(locationMsg)}`
    : `sms:?body=${encodeURIComponent(locationMsg)}`;

  return (
    <article
      className={`w-full min-w-0 overflow-hidden rounded-[20px] border border-line bg-[#f8fafc] text-[#07182d] shadow-lift sm:rounded-[28px] ${
        compact ? "p-3.5 sm:p-4" : "p-4 sm:p-6"
      }`}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <BrandLogo variant="full" />
        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
          Offline ID
        </span>
      </header>

      {/* Primary Emergency Banner */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-red-600 p-3 text-white shadow-md sm:p-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="h-5 w-5 shrink-0 text-white" />
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest text-red-100">
              Emergency Profile
            </span>
            <p className="truncate text-xs font-bold text-white sm:text-sm">
              Critical Medical & Contact Data
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[9px] font-black uppercase text-red-100">Blood</span>
          <strong className="block text-2xl font-black leading-none sm:text-3xl">
            {profile.bloodGroup || "-"}
          </strong>
        </div>
      </div>

      {/* Identity Summary */}
      <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-black sm:text-2xl text-slate-900">
            {profile.fullName || "Your name"}
          </h2>
          <p className="mt-1 break-words text-xs sm:text-sm text-slate-600">
            {[
              profile.age && profile.selections.age ? `Age ${profile.age}` : "",
              profile.city,
              profile.state,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      </div>

      {/* ONE-HANDED QUICK ACTIONS: 1-Tap Dial & GPS SOS */}
      <section className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-3 sm:p-4">
        <span className="block text-[10px] font-black uppercase tracking-wider text-red-700">
          Rapid Responder Actions (One-Tap)
        </span>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {/* Call Primary Contact */}
          {primaryContact && (
            <a
              href={`tel:${primaryPhone}`}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-red-700 active:scale-95 touch-target focus-visible:outline-2 focus-visible:outline-red-600"
            >
              <PhoneCall size={16} className="shrink-0 animate-bounce" />
              <span className="truncate">Call Primary: {primaryContact.name || "Responder"}</span>
            </a>
          )}

          {/* Call 112 National Helpline */}
          <a
            href="tel:112"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#081526] px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#0d223d] active:scale-95 touch-target focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <Phone size={16} className="shrink-0 text-red-400" />
            <span>Call 112 National SOS</span>
          </a>
        </div>

        {/* Location-Sharing Controls (Requirement 12) */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Navigation size={15} className="text-blue-600 shrink-0" />
              <span>Accident Location Sharing</span>
            </div>
            {locationState.status === "idle" && (
              <button
                type="button"
                onClick={handleGetLocation}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-700 active:scale-95 touch-target"
              >
                <MapPin size={13} />
                Get GPS Pin
              </button>
            )}
          </div>

          {locationState.status === "locating" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 animate-pulse">
              <span className="h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>Acquiring satellite GPS coordinates...</span>
            </div>
          )}

          {locationState.status === "success" && (
            <div className="mt-2 space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
                <span className="font-mono font-semibold">
                  Lat: {locationState.latitude?.toFixed(5)}, Lng: {locationState.longitude?.toFixed(5)}
                </span>
                <span className="text-emerald-700 font-bold">±{locationState.accuracy}m accuracy</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 active:scale-95 touch-target"
                >
                  <Share2 size={13} />
                  <span>WhatsApp SOS</span>
                </a>
                <a
                  href={smsUrl}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-blue-700 active:scale-95 touch-target"
                >
                  <MessageSquare size={13} />
                  <span>SMS Location</span>
                </a>
                <button
                  type="button"
                  onClick={copyLocation}
                  className="col-span-2 sm:col-span-1 flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95 touch-target"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          )}

          {(locationState.status === "denied" || locationState.status === "unsupported") && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="min-w-0">
                <span>{locationState.errorMessage}</span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="mt-1 block text-[11px] font-bold text-blue-700 underline"
                >
                  Retry GPS request
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Emergency Contacts List with 1-Tap Dial */}
      {contacts.length > 0 && (
        <section className="mt-5">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
            Emergency Contacts
          </h3>
          <div className="mt-2.5 space-y-2">
            {contacts.map((c) => (
              <div
                className={`flex min-w-0 items-center justify-between gap-3 rounded-xl p-3 ${
                  c.primary ? "bg-blue-50 ring-1 ring-blue-300" : "bg-slate-100"
                }`}
                key={c.id}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      c.primary ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Phone size={17} />
                  </div>
                  <div className="min-w-0">
                    <b className="block break-words text-sm text-slate-900">
                      {c.name || "Contact name"}
                      {c.primary && (
                        <span className="ml-2 inline-block rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                          Primary
                        </span>
                      )}
                    </b>
                    <span className="block break-words text-xs text-slate-600">
                      {c.relationship} • {c.phone}
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${c.phone?.replace(/\s+/g, "")}`}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-blue-600 p-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 touch-target focus-visible:outline-2 focus-visible:outline-blue-600"
                  aria-label={`Call ${c.name} at ${c.phone}`}
                >
                  <PhoneCall size={16} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Medical Information */}
      {(profile.selections.allergies && profile.medical.allergies) ||
      (profile.selections.medication && profile.medical.medication) ||
      (profile.selections.emergencyNote && profile.medical.note) ? (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
            Vital Medical Information
          </h3>
          <div className="mt-2 space-y-1.5 text-xs">
            {profile.selections.allergies && profile.medical.allergies && (
              <p className="break-words rounded-lg bg-amber-50 p-2 text-amber-950 border border-amber-200">
                <b className="text-amber-800">Known Allergies:</b> {profile.medical.allergies}
              </p>
            )}
            {profile.selections.medication && profile.medical.medication && (
              <p className="break-words rounded-lg bg-blue-50 p-2 text-blue-950 border border-blue-200">
                <b className="text-blue-800">Regular Medication:</b> {profile.medical.medication}
              </p>
            )}
            {profile.selections.emergencyNote && profile.medical.note && (
              <p className="break-words rounded-lg bg-slate-100 p-2 text-slate-900 border border-slate-200">
                <b className="text-slate-800">Emergency Care Note:</b> {profile.medical.note}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {/* Address */}
      {profile.selections.address && profile.address.line1 && (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
            Home Address
          </h3>
          <p className="mt-1 break-words text-xs text-slate-700">
            {[
              profile.address.line1,
              profile.address.line2,
              profile.address.city,
              profile.address.state,
              profile.address.pinCode,
              profile.address.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </section>
      )}

      {/* Emergency Services Directory with Direct Dial */}
      {profile.selections.emergencyServices && emergencyServices.length > 0 && (
        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
            Verified Helplines
          </h3>
          <div className="mt-2 space-y-1.5">
            {emergencyServices.map((s) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-800"
                key={s.label}
              >
                <span className="font-semibold">{s.label}</span>
                <a
                  href={`tel:${s.number}`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1 text-xs font-black text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                >
                  <Phone size={12} className="text-red-400" />
                  <span>{s.number}</span>
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-[10px] font-black uppercase tracking-[.14em] text-blue-800 sm:tracking-[.16em]">
        RescueKaro • Scan Karo. Safe Karo.
      </footer>
    </article>
  );
}
