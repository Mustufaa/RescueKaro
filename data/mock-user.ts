import type { EmergencyProfile, User } from "@/types";

export const mockUser: User = {
  id: "usr_01",
  fullName: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "+91 98XXX XXXXX",
  phoneVerified: true,
};

export const mockEmergencyProfile: EmergencyProfile = {
  fullName: "Aarav Sharma",
  bloodGroup: "O+",
  city: "Lucknow",
  state: "Uttar Pradesh",
  age: "29",
  contacts: [
    { id: "c1", name: "Priya Sharma", relationship: "Spouse", phone: "+91 98XXX XXXXX", primary: true },
    { id: "c2", name: "Raj Sharma", relationship: "Father", phone: "+91 97XXX XXXXX", primary: false },
  ],
  medical: {
    allergies: "No known allergies reported",
    condition: "",
    medication: "",
    note: "Please contact family first.",
  },
  address: {
    line1: "Demo address",
    line2: "",
    landmark: "",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pinCode: "226001",
    country: "India",
  },
  selections: {
    dob: false,
    age: true,
    address: true,
    allergies: true,
    medication: false,
    emergencyNote: true,
    additionalContacts: true,
    emergencyServices: true,
  },
  emergencyServices: {
    country: "India",
    state: "Uttar Pradesh",
    city: "Lucknow",
    services: [
      { label: "National Emergency", number: "112", verified: true },
      { label: "Police", number: "100", verified: true },
      { label: "Fire Brigade", number: "101", verified: true },
      { label: "Ambulance", number: "108", verified: true },
    ],
    verificationStatus: "verified",
    source: "Mock development directory - ERSS 112 plus service helplines",
    lastVerified: "2026-10-02",
  },
};
