import { apiRequest } from "./api";

export type WizardContact = { id?: string | null; name: string; relationship: string; phone: string; primary: boolean };
export type WizardProfile = {
  id?: string | null; version?: number | null; fullName: string; bloodGroup: string; city: string; state: string;
  dateOfBirth?: string | null; ageYears?: number | null; contacts: WizardContact[];
  medical: { allergies: string; condition: string; medication: string; note: string };
  address: { line1: string; line2: string; landmark: string; city: string; state: string; pinCode: string; country: string };
  selections: { dob: boolean; age: boolean; address: boolean; allergies: boolean; medication: boolean;
    emergencyNote: boolean; additionalContacts: boolean; emergencyServices: boolean };
  publicEmergencyProfileAccepted: boolean;
};
export type Delivery = { recipient: string; phone: string; line1: string; line2: string; landmark: string;
  city: string; state: string; pinCode: string; country: string };
export type WizardData = { profile: WizardProfile; ambulanceNumber: string; policeNumber: string;
  stickerType: string; quantity: number; delivery: Delivery; confirmed: boolean };
export type Sticker = { id: string; serialNumber: number; serialCode: string; status: string; publicUrl: string; createdAt: string };
export type StickerOrder = { id: string; stickerType: string; quantity: number; status: string; paymentStatus: string;
  delivery: Delivery; createdAt: string; stickers: Sticker[] };
export type WizardView = { draftId: string; step: number; data: WizardData; completedOrder: StickerOrder | null };

export const qrWizardService = {
  get: () => apiRequest<WizardView>("/qr-wizard"),
  save: (draftId: string, step: number, data: WizardData) =>
    apiRequest<WizardView>("/qr-wizard", { method: "PUT", body: JSON.stringify({ draftId, step, data }) }),
  finish: (draftId: string, data: WizardData) =>
    apiRequest<WizardView>("/qr-wizard/finish", { method: "POST", body: JSON.stringify({ draftId, data }) }),
  startNew: () => apiRequest<WizardView>("/qr-wizard/new", { method: "POST" }),
  orders: () => apiRequest<StickerOrder[]>("/sticker-orders"),
  order: (id: string) => apiRequest<StickerOrder>(`/sticker-orders/${encodeURIComponent(id)}`),
};
