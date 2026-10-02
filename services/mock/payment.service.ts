export const mockPaymentService={async pay(amount:number){await new Promise(r=>setTimeout(r,900));return {id:`pay_demo_${Date.now()}`,orderId:"RK-2026-1042",amount,status:"verified" as const};}};
