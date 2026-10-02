import { apiRequest } from "./api";
export const emergencyProfileService = { get: () => apiRequest("/emergency-profile"), update: (body: unknown) => apiRequest("/emergency-profile", { method: "PATCH", body: JSON.stringify(body) }) };
