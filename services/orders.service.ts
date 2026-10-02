import { apiRequest } from "./api";
export const ordersService = { list: () => apiRequest("/orders"), detail: (id: string) => apiRequest(`/orders/${id}`), create: (body: unknown) => apiRequest("/orders", { method: "POST", body: JSON.stringify(body) }) };
