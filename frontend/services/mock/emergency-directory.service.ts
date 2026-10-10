import type { EmergencyServiceDirectory } from "@/types";

const lucknowServices = [
  { label: "National Emergency", number: "112", verified: true },
  { label: "Police", number: "100", verified: true },
  { label: "Fire Brigade", number: "101", verified: true },
  { label: "Ambulance", number: "108", verified: true },
] as const;

const records: EmergencyServiceDirectory[] = [
  {
    country: "India",
    state: "Uttar Pradesh",
    city: "Lucknow",
    services: [...lucknowServices],
    verificationStatus: "verified",
    source: "Mock development record - ERSS 112 plus service helplines",
    lastVerified: "2026-10-02",
  },
];

export const mockEmergencyDirectoryService = {
  async getEmergencyServices(location: { country: string; state: string; city: string }) {
    await new Promise((r) => setTimeout(r, 650));
    return (
      records.find(
        (r) =>
          r.country.toLowerCase() === location.country.toLowerCase() &&
          r.state.toLowerCase() === location.state.toLowerCase() &&
          r.city.toLowerCase() === location.city.toLowerCase(),
      ) ?? { ...location, services: [], verificationStatus: "unavailable" as const, source: "No verified mock record", lastVerified: "" }
    );
  },
};
