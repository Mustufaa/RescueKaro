import { apiRequest } from "./api";
type Product = { id: string; pricePaise: number; stickerCount: number; coverCount: number };
type Quote = { quoteId: string; available: boolean; chargePaise: number; currency: string };
let quoteId = "";
let product: Product | undefined;
export const shippingService = {
  async calculate(pinCode: string, country = "India") {
    try {
      await apiRequest("/auth/csrf");
      if (!product) product = await apiRequest<Product>("/products/starter-kit");
      const result = await apiRequest<Quote>("/shipping/quote", { method: "POST", body: JSON.stringify({ pinCode, country, productId: product.id, quantity: 1 }) });
      quoteId = result.quoteId;
      return { available: result.available, charge: result.chargePaise / 100, quoteId: result.quoteId, error: result.available ? undefined : "Delivery is unavailable for this PIN code." };
    } catch (e) { quoteId = ""; return { available: false, charge: 0, error: e instanceof Error ? e.message : "Could not calculate shipping." }; }
  },
  getQuoteId: () => quoteId,
  clearQuote: () => { quoteId = ""; },
  getProduct: async () => product ?? (product = await apiRequest<Product>("/products/starter-kit")),
};
