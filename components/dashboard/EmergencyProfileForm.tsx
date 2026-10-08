"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Edit3, Save, X } from "lucide-react";
import { useState } from "react";
import { mockEmergencyProfile } from "@/data/mock-user";

export function EmergencyProfileForm() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState(mockEmergencyProfile);

  return (
    <div className="space-y-6">
      {saved && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs sm:text-sm text-emerald-300">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>Profile updates saved to your active session.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Offline Profile Data</span>
          <h1 className="display mt-2 text-3xl sm:text-4xl text-white">Emergency Profile</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            View the personal and medical details embedded in your RescueKaro identity.
          </p>
        </div>
        <button
          className="button button-secondary w-full sm:w-auto !min-h-[44px] text-xs font-bold"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? (
            <>
              <X size={15} /> Cancel
            </>
          ) : (
            <>
              <Edit3 size={15} /> Edit Information
            </>
          )}
        </button>
      </div>

      {editing && (
        <div className="flex items-start gap-3 rounded-2xl border border-rescue/40 bg-red-950/40 p-4 text-xs sm:text-sm text-red-200">
          <AlertTriangle className="shrink-0 text-rescue mt-0.5" size={20} />
          <div>
            <b className="text-white block">Physical Static QR Notice</b>
            <p className="mt-1 leading-5 text-slate-300">
              Because RescueKaro stickers operate 100% offline without remote databases, updating this form does not modify an already-printed physical sticker.
            </p>
            <Link
              href="/dashboard/replacement"
              className="mt-2.5 inline-flex min-h-[44px] items-center text-xs font-black uppercase text-rescue hover:underline touch-target"
            >
              Order updated replacement sticker →
            </Link>
          </div>
        </div>
      )}

      <div className="glass-panel grid gap-4 p-5 sm:p-7 sm:grid-cols-2">
        <label className="block">
          <span className="label">Full Name</span>
          <input
            disabled={!editing}
            autoComplete="name"
            className="field disabled:opacity-60 disabled:cursor-not-allowed"
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="label">Blood Group</span>
          <input
            disabled={!editing}
            className="field disabled:opacity-60 disabled:cursor-not-allowed"
            value={data.bloodGroup}
            onChange={(e) => setData({ ...data, bloodGroup: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="label">City</span>
          <input
            disabled={!editing}
            autoComplete="address-level2"
            className="field disabled:opacity-60 disabled:cursor-not-allowed"
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="label">State</span>
          <input
            disabled={!editing}
            autoComplete="address-level1"
            className="field disabled:opacity-60 disabled:cursor-not-allowed"
            value={data.state}
            onChange={(e) => setData({ ...data, state: e.target.value })}
          />
        </label>

        <div className="sm:col-span-2 pt-2">
          <h2 className="mb-3 text-base font-black text-white">Emergency Contacts</h2>
          <div className="space-y-3">
            {data.contacts.map((c, idx) => (
              <div
                className="grid gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5 sm:grid-cols-3"
                key={c.id || idx}
              >
                <div>
                  <span className="label text-[11px]">Contact Name</span>
                  <input
                    disabled={!editing}
                    autoComplete="name"
                    className="field disabled:opacity-60 disabled:cursor-not-allowed"
                    value={c.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        contacts: data.contacts.map((x) =>
                          x.id === c.id ? { ...x, name: e.target.value } : x
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <span className="label text-[11px]">Relationship</span>
                  <input
                    disabled={!editing}
                    className="field disabled:opacity-60 disabled:cursor-not-allowed"
                    value={c.relationship}
                    onChange={(e) =>
                      setData({
                        ...data,
                        contacts: data.contacts.map((x) =>
                          x.id === c.id ? { ...x, relationship: e.target.value } : x
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <span className="label text-[11px]">Phone Number</span>
                  <input
                    disabled={!editing}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="field disabled:opacity-60 disabled:cursor-not-allowed"
                    value={c.phone}
                    onChange={(e) =>
                      setData({
                        ...data,
                        contacts: data.contacts.map((x) =>
                          x.id === c.id ? { ...x, phone: e.target.value } : x
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="sm:col-span-2 block pt-2">
          <span className="label">Critical Emergency Care Note</span>
          <textarea
            disabled={!editing}
            rows={3}
            className="field !min-h-[90px] disabled:opacity-60 disabled:cursor-not-allowed"
            value={data.medical.note}
            onChange={(e) =>
              setData({
                ...data,
                medical: { ...data.medical, note: e.target.value },
              })
            }
          />
        </label>

        {editing && (
          <div className="sm:col-span-2 pt-2">
            <button
              onClick={() => {
                setEditing(false);
                setSaved(true);
              }}
              className="button button-primary w-full sm:w-auto !min-h-[48px] px-8 text-xs font-bold"
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
