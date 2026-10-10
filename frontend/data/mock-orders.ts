import type { Order } from "@/types";
export const mockOrders: Order[] = [
  { id: "RK-2026-1042", date: "28 Sep 2026", product: "RescueKaro Starter Kit", useCase: "Helmet", quantity: 1, amount: 99, payment: "Paid", status: "Printing", qrStatus: "Verified" },
  { id: "RK-2026-0884", date: "11 Aug 2026", product: "RescueKaro Starter Kit", useCase: "Car", quantity: 1, amount: 99, payment: "Paid", status: "Delivered", qrStatus: "Generated", tracking: "RKSHIP48821" }
];
