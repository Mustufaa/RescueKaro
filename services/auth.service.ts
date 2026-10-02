import { apiRequest } from "./api";
export const authService = { login: (body: unknown) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(body) }), register: (body: unknown) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(body) }) };
