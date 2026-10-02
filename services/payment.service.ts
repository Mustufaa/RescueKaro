import { apiRequest } from "./api";
export const paymentService = { createOrder: (body: unknown) => apiRequest("/payments/order", { method: "POST", body: JSON.stringify(body) }) };
export { mockPaymentService } from "./mock/payment.service";
