import { apiRequest } from "./api";
export const usersService = { profile: () => apiRequest("/users/me"), update: (body: unknown) => apiRequest("/users/me", { method: "PATCH", body: JSON.stringify(body) }) };
