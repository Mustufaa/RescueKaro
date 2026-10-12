"use client";

import Image from "next/image";
import { QrLink } from "@/components/qr/QrLink";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { emergencyDirectoryService } from "@/services/emergency-directory.service";
import { qrService } from "@/services/qr.service";
import { qrWizardService, type StickerOrder, type WizardData, type WizardProfile, type WizardView } from "@/services/qr-wizard.service";

const steps = ["Emergency profile", "Emergency contacts", "Address and emergency details", "Sticker and delivery", "Preview and confirm", "Your QR stickers"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const stickerTypes = [{ value: "HELMET", label: "Helmet" }, { value: "CAR", label: "Car" }, { value: "MOBILE_BAG", label: "Mobile / bag" }];
type DirectoryNumber = { label: string; number: string; verified: boolean };

export function QrWizard() {
  const router = useRouter();
  const search = useSearchParams();
  const [view, setView] = useState<WizardView>();
  const [data, setData] = useState<WizardData>();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("");
  const [directory, setDirectory] = useState<DirectoryNumber[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftId = view?.draftId;
  const directoryCity = data?.profile.address.city ?? "";
  const directoryState = data?.profile.address.state ?? "";

  const load = useCallback(async () => {
    setError("");
    try {
      let result = await qrWizardService.get();
      if (search.get("new") === "1") {
        result = await qrWizardService.startNew();
        router.replace("/order");
      }
      setView(result); setData(result.data); setStep(result.step);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load wizard progress."); }
  }, [router, search]);
  useEffect(() => { void load(); }, [load]);

  const persist = useCallback((draftId: string, target: number, snapshot: WizardData) => {
    const request = queue.current.then(() => qrWizardService.save(draftId, target, snapshot));
    queue.current = request.catch(() => undefined);
    return request;
  }, []);

  useEffect(() => {
    if (!draftId || !data || step === 6 || busy) return;
    timer.current = setTimeout(() => {
      setSaveState("Saving progress...");
      void persist(draftId, step, data)
        .then(() => setSaveState("Progress saved"))
        .catch(() => setSaveState("Progress could not be saved. Use Next to retry."));
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [draftId, data, step, busy, persist]);

  useEffect(() => {
    const order = view?.completedOrder;
    if (!order) return;
    let active = true;
    void Promise.all(order.stickers.map(async sticker => [sticker.id, await qrService.toDataUrl(sticker.publicUrl)] as const))
      .then(entries => { if (active) setImages(Object.fromEntries(entries)); })
      .catch(() => { if (active) setError("The sticker request was saved, but the QR preview could not load. Open the emergency page links below."); });
    return () => { active = false; };
  }, [view?.completedOrder]);

  useEffect(() => {
    if (step !== 3 || !directoryCity || !directoryState) { setDirectory([]); return; }
    let active = true;
    const timeout = setTimeout(() => {
      void emergencyDirectoryService.getEmergencyServices({ country: "India", state: directoryState, city: directoryCity })
        .then(result => { if (active) setDirectory(result.services.filter(item => item.verified)); })
        .catch(() => { if (active) setDirectory([]); });
    }, 500);
    return () => { active = false; clearTimeout(timeout); };
  }, [step, directoryCity, directoryState]);

  function updateProfile(change: Partial<WizardProfile>) {
    setData(old => old && ({ ...old, confirmed: false, profile: { ...old.profile, ...change } }));
  }
  function updateAddress(change: Partial<WizardProfile["address"]>) {
    setData(old => old && ({ ...old, confirmed: false, profile: {
      ...old.profile, city: change.city ?? old.profile.city, state: change.state ?? old.profile.state,
      address: { ...old.profile.address, ...change },
    } }));
  }
  function updateDelivery(change: Partial<WizardData["delivery"]>) {
    setData(old => old && ({ ...old, confirmed: false, delivery: { ...old.delivery, ...change } }));
  }
  async function move(target: number) {
    if (!view || !data || busy) return;
    if (timer.current) clearTimeout(timer.current);
    setBusy(true); setError("");
    try {
      const saved = await persist(view.draftId, target, data);
      setStep(saved.step); setSaveState("Progress saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Complete the required fields before continuing."); }
    finally { setBusy(false); }
  }
  async function finish() {
    if (!view || !data || busy) return;
    if (timer.current) clearTimeout(timer.current);
    setBusy(true); setError("");
    try {
      await queue.current;
      const result = await qrWizardService.finish(view.draftId, data);
      setView(result); setData(result.data); setStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Generation failed. Your progress is saved; please try again."); }
    finally { setBusy(false); }
  }

  const input = (label: string, value: string, onChange: (value: string) => void, required = false, type = "text") =>
    <label className="block"><span className="label">{label}{required ? " *" : ""}</span>
      <input className="field" type={type} value={value ?? ""} onChange={event => onChange(event.target.value)} /></label>;
  if (!view || !data) return <div className="glass-panel mx-auto max-w-xl p-6 text-slate-200">
    {error ? <><p role="alert" className="text-rescue">{error}</p><button className="button button-primary mt-4" onClick={() => void load()}>Retry</button></> : "Loading your QR setup..."}
  </div>;

  const profile = data.profile;
  const order: StickerOrder | null = view.completedOrder;
  return <div className="mx-auto max-w-4xl space-y-5 text-slate-100">
    <header><span className="eyebrow">QR setup</span><h1 className="display mt-2 text-3xl text-white">{steps[step - 1]}</h1>
      <p className="mt-2 text-sm text-slate-400">Step {step} of 6 · Your progress is saved to your account.</p></header>
    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="QR setup progress">{steps.map((name, index) =>
      <li key={name} className={`rounded-xl border px-2 py-2 text-center text-[10px] font-bold ${index + 1 === step ? "border-safety bg-safety/15 text-white" : "border-white/10 text-slate-400"}`}>{index + 1}. {name}</li>)}</ol>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200"><p role="alert">{error}</p>
      <button type="button" className="mt-2 font-bold text-safety" disabled={busy} onClick={() => void load()}>Reload saved progress</button></div>}

    <fieldset disabled={busy} className="min-w-0 space-y-5">
    {step === 1 && <section className="glass-panel space-y-5 p-5 sm:p-7">
      <p className="text-sm text-slate-400">Enter the medical details you want linked to your emergency page. Date of birth and age are optional.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {input("Full name", profile.fullName, value => updateProfile({ fullName: value }), true)}
        <label><span className="label">Blood group *</span><select className="field" value={profile.bloodGroup} onChange={event => updateProfile({ bloodGroup: event.target.value })}>
          <option value="">Select blood group</option>{bloodGroups.map(group => <option key={group} value={group}>{group}</option>)}
        </select></label>
        {input("Medical conditions", profile.medical.condition, value => updateProfile({ medical: { ...profile.medical, condition: value } }))}
        {input("Allergies", profile.medical.allergies, value => updateProfile({ medical: { ...profile.medical, allergies: value } }))}
        {input("Medication", profile.medical.medication, value => updateProfile({ medical: { ...profile.medical, medication: value } }))}
        {input("Emergency note", profile.medical.note, value => updateProfile({ medical: { ...profile.medical, note: value } }))}
        {input("Date of birth (optional)", profile.dateOfBirth ?? "", value => updateProfile({ dateOfBirth: value || null }), false, "date")}
        {input("Age in years (optional)", profile.ageYears == null ? "" : String(profile.ageYears), value => updateProfile({ ageYears: value === "" ? null : Number(value) }), false, "number")}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{([ ["dob", "Show date of birth"], ["age", "Show age"], ["allergies", "Show allergies"], ["medication", "Show medication"], ["emergencyNote", "Show emergency note"] ] as const).map(([key, label]) =>
        <label key={key} className="text-sm text-slate-300"><input type="checkbox" checked={profile.selections[key]} onChange={event => updateProfile({ selections: { ...profile.selections, [key]: event.target.checked } })} /> {label} on the public page</label>)}</div>
    </section>}

    {step === 2 && <section className="glass-panel space-y-4 p-5 sm:p-7">
      <p className="text-sm text-slate-400">Add one to five contacts. One must be primary. Indian mobile formats are normalized when saved.</p>
      {profile.contacts.map((contact, index) => <div key={contact.id ?? index} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-3">
        {input("Contact name", contact.name, value => updateProfile({ contacts: profile.contacts.map((item, i) => i === index ? { ...item, name: value } : item) }), true)}
        {input("Relationship", contact.relationship, value => updateProfile({ contacts: profile.contacts.map((item, i) => i === index ? { ...item, relationship: value } : item) }), true)}
        {input("Phone number", contact.phone, value => updateProfile({ contacts: profile.contacts.map((item, i) => i === index ? { ...item, phone: value } : item) }), true, "tel")}
        <label className="text-sm"><input type="radio" name="primary-contact" checked={contact.primary} onChange={() => updateProfile({ contacts: profile.contacts.map((item, i) => ({ ...item, primary: i === index })) })} /> Primary contact</label>
        <button type="button" className="text-left text-sm text-rescue disabled:opacity-40" disabled={profile.contacts.length === 1}
          onClick={() => { const remaining = profile.contacts.filter((_, i) => i !== index); const hasPrimary = remaining.some(item => item.primary); updateProfile({ contacts: remaining.map((item, i) => ({ ...item, primary: hasPrimary ? item.primary : i === 0 })) }); }}>Remove</button>
      </div>)}
      <button type="button" className="button button-secondary" disabled={profile.contacts.length >= 5}
        onClick={() => updateProfile({ contacts: [...profile.contacts, { name: "", relationship: "", phone: "", primary: false }] })}>Add contact</button>
      <label className="block text-sm text-slate-300"><input type="checkbox" checked={profile.selections.additionalContacts} onChange={event => updateProfile({ selections: { ...profile.selections, additionalContacts: event.target.checked } })} /> Show additional contacts publicly</label>
    </section>}

    {step === 3 && <section className="glass-panel space-y-5 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        {input("Address line 1", profile.address.line1, value => updateAddress({ line1: value }), true)}
        {input("Address line 2", profile.address.line2, value => updateAddress({ line2: value }))}
        {input("Landmark", profile.address.landmark, value => updateAddress({ landmark: value }))}
        {input("City", profile.address.city, value => updateAddress({ city: value }), true)}
        {input("State", profile.address.state, value => updateAddress({ state: value }), true)}
        {input("Postal code", profile.address.pinCode, value => updateAddress({ pinCode: value }), true, "text")}
        {input("Ambulance helpline (optional)", data.ambulanceNumber, value => setData(old => old && ({ ...old, ambulanceNumber: value, confirmed: false })), false, "tel")}
        {input("Police helpline (optional)", data.policeNumber, value => setData(old => old && ({ ...old, policeNumber: value, confirmed: false })), false, "tel")}
      </div>
      {directory.length > 0 && <div className="rounded-xl border border-safety/30 bg-safety/10 p-4 text-sm"><b>Verified directory entries for this location</b>
        {directory.map(item => <p key={`${item.label}-${item.number}`} className="mt-2">{item.label}: {item.number}</p>)}
        <p className="mt-2 text-xs text-slate-400">These are verified directory entries. Enter any numbers you personally want to show above.</p></div>}
      <p className="text-xs text-slate-400">If no verified directory entry is available, leave the fields blank or enter a number you trust. We do not fill in guessed local numbers.</p>
      <label className="block text-sm text-slate-300"><input type="checkbox" checked={profile.selections.address} onChange={event => updateProfile({ selections: { ...profile.selections, address: event.target.checked } })} /> Show address publicly</label>
      <label className="block text-sm text-slate-300"><input type="checkbox" checked={profile.selections.emergencyServices} onChange={event => updateProfile({ selections: { ...profile.selections, emergencyServices: event.target.checked } })} /> Show emergency numbers publicly</label>
    </section>}

    {step === 4 && <section className="glass-panel space-y-5 p-5 sm:p-7">
      <div><span className="label">Sticker type *</span><div className="mt-2 grid gap-3 sm:grid-cols-3">{stickerTypes.map(option =>
        <label key={option.value} className={`cursor-pointer rounded-xl border p-4 text-sm ${data.stickerType === option.value ? "border-safety bg-safety/10" : "border-white/10"}`}>
          <input type="radio" name="sticker-type" checked={data.stickerType === option.value} onChange={() => setData(old => old && ({ ...old, stickerType: option.value, confirmed: false }))} /> {option.label}</label>)}</div></div>
      {input("Sticker quantity (1–10)", String(data.quantity ?? 1), value => setData(old => old && ({ ...old, quantity: Number(value), confirmed: false })), true, "number")}
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-bold">Delivery address</h2>
        <button type="button" className="text-sm font-bold text-safety" onClick={() => updateDelivery({ ...profile.address, recipient: profile.fullName })}>Copy emergency address</button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {input("Recipient", data.delivery.recipient, value => updateDelivery({ recipient: value }), true)}
        {input("Delivery phone", data.delivery.phone, value => updateDelivery({ phone: value }), true, "tel")}
        {input("Address line 1", data.delivery.line1, value => updateDelivery({ line1: value }), true)}
        {input("Address line 2", data.delivery.line2, value => updateDelivery({ line2: value }))}
        {input("Landmark", data.delivery.landmark, value => updateDelivery({ landmark: value }))}
        {input("City", data.delivery.city, value => updateDelivery({ city: value }), true)}
        {input("State", data.delivery.state, value => updateDelivery({ state: value }), true)}
        {input("Postal code", data.delivery.pinCode, value => updateDelivery({ pinCode: value }), true)}
      </div>
    </section>}

    {step === 5 && <section className="glass-panel space-y-5 p-5 sm:p-7">
      <p className="text-sm text-slate-400">Review everything before issuing serials. No payment is required here. A sticker request is recorded for delivery follow-up.</p>
      {[
        ["Emergency profile", 1, `${profile.fullName} · ${profile.bloodGroup}\nMedical conditions: ${profile.medical.condition || "Not entered"}\nAllergies: ${profile.medical.allergies || "Not entered"}\nMedication: ${profile.medical.medication || "Not entered"}\nEmergency note: ${profile.medical.note || "Not entered"}\nDate of birth: ${profile.dateOfBirth || "Not entered"} · Age: ${profile.ageYears ?? "Not entered"}`],
        ["Contacts", 2, profile.contacts.map(contact => `${contact.name} (${contact.relationship}) ${contact.phone}${contact.primary ? " · Primary" : ""}`).join("; ")],
        ["Address and helplines", 3, `${Object.values(profile.address).filter(Boolean).join(", ")}\nAmbulance: ${data.ambulanceNumber || "Not entered"}; Police: ${data.policeNumber || "Not entered"}`],
        ["Sticker and delivery", 4, `${data.quantity} ${data.stickerType.replaceAll("_", "/")} sticker(s)\n${data.delivery.recipient} · ${data.delivery.phone}\n${[data.delivery.line1, data.delivery.line2, data.delivery.landmark, data.delivery.city, data.delivery.state, data.delivery.pinCode, data.delivery.country].filter(Boolean).join(", ")}`],
      ].map(([label, target, details]) => <div key={String(label)} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-3"><h2 className="font-bold">{label}</h2><button className="text-sm text-safety" onClick={() => void move(Number(target))}>Edit</button></div><p className="mt-2 whitespace-pre-line break-words text-sm text-slate-300">{details}</p></div>)}
      <label className="block text-sm text-slate-200"><input type="checkbox" checked={data.confirmed} onChange={event => setData(old => old && ({ ...old, confirmed: event.target.checked, profile: { ...old.profile, publicEmergencyProfileAccepted: event.target.checked } }))} /> I confirm these details and approve this public emergency page.</label>
    </section>}

    {step === 6 && <section className="glass-panel space-y-5 p-5 sm:p-7">
      <h2 className="text-xl font-bold text-white">Your sticker request is saved</h2>
      <p className="text-sm text-slate-300">Status: {order?.status ?? "Recorded"}. Payment: not required. Each QR opens your public emergency page.</p>
      <div className="grid gap-4 sm:grid-cols-2">{order?.stickers.map(sticker => <div key={sticker.id} className="rounded-xl border border-white/10 p-4 text-center">
        <p className="font-bold">Sticker serial {sticker.serialCode}</p>
        {images[sticker.id] ? <Image unoptimized src={images[sticker.id]} alt={`QR for sticker ${sticker.serialCode}`} width={320} height={320} className="mx-auto mt-3 w-full max-w-[220px] rounded-xl bg-white p-2" /> : <p className="mt-3 text-sm text-slate-400">Preparing QR preview...</p>}
        <a className="button button-secondary mt-3 w-full" href={sticker.publicUrl} target="_blank" rel="noreferrer">Open Emergency Page</a>
        <QrLink url={sticker.publicUrl} />
        {images[sticker.id] && <a className="button button-secondary mt-2 w-full" href={images[sticker.id]} download={`rescuekaro-sticker-${sticker.serialCode}.png`}>Download QR</a>}
      </div>)}</div>
      <div className="flex flex-wrap gap-3"><Link href="/dashboard" className="button button-primary">Go to Dashboard</Link>
        <Link href="/order?new=1" className="button button-secondary">Generate additional stickers</Link></div>
    </section>}
    </fieldset>

    {step < 6 && <div className="flex flex-wrap items-center justify-between gap-3">
      <div>{step > 1 && <button className="button button-secondary" disabled={busy} onClick={() => void move(step - 1)}>Back</button>}</div>
      <div className="flex items-center gap-3"><span className="text-xs text-slate-400" role="status">{saveState}</span>
        {step < 5 ? <button className="button button-primary" disabled={busy} onClick={() => void move(step + 1)}>{busy ? "Saving..." : "Next"}</button>
          : <button className="button button-primary" disabled={busy || !data.confirmed} onClick={() => void finish()}>{busy ? "Generating..." : "Generate QR stickers"}</button>}</div>
    </div>}
  </div>;
}
