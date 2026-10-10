import { apiRequest } from "./api";
export const replacementService = { create: (body: unknown) => apiRequest("/replacements", { method: "POST", body: JSON.stringify(body) }) };
