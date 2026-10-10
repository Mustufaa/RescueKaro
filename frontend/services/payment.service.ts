import { apiRequest } from "./api";
export const paymentService = {
  async createCheckout(body: unknown) {
    await apiRequest("/auth/csrf");
    return apiRequest<{id:string;orderNumber:string;paymentStatus:string;totalPaise:number;currency:string;useCase:string}>("/checkout/orders", {method:"POST",body:JSON.stringify(body)});
  },
  createOrder: (orderId: string) => apiRequest<{providerOrderId:string;amount:number;currency:string;simulation:boolean;keyId:string}>(`/payments/orders/${orderId}`, {method:"POST"}),
  simulate: (orderId: string) => apiRequest<OrderStatus>(`/payments/dev-simulate/${orderId}`, {method:"POST"}),
  verify: (body: unknown) => apiRequest<OrderStatus>("/payments/verify", {method:"POST",body:JSON.stringify(body)}),
  getOrder: (orderId: string) => apiRequest<OrderStatus>(`/payments/orders/${orderId}`),
};
export type OrderStatus = {id:string;orderNumber:string;paymentStatus:string;totalPaise:number;currency:string;useCase:string;stickerUrls:string[]};
