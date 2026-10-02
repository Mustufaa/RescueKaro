import { apiRequest } from "./api";
export const adminService = { orders: () => apiRequest("/admin/orders"), updateOrder: (id: string, body: unknown) => apiRequest(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(body) }) };
