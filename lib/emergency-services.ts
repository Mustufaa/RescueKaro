import type { EmergencyProfile, EmergencyServiceNumber } from "@/types";

const indiaEmergencyDefaults: EmergencyServiceNumber[] = [
  { label: "National Emergency", number: "112", verified: true },
  { label: "Police", number: "100", verified: true },
  { label: "Fire Brigade", number: "101", verified: true },
  { label: "Ambulance", number: "108", verified: true },
];

export function getVerifiedEmergencyServices(profile: EmergencyProfile) {
  const reviewed = profile.emergencyServices?.services.filter((service) => service.verified) ?? [];
  const shouldUseIndiaDefaults = profile.address.country.toLowerCase() === "india" || !profile.address.country;
  const services = shouldUseIndiaDefaults ? [...reviewed, ...indiaEmergencyDefaults] : reviewed;
  const seen = new Set<string>();

  return services.filter((service) => {
    const key = `${service.label.toLowerCase()}-${service.number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return service.verified;
  });
}
