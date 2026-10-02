import { apiRequest } from "./api";
export const reviewsService = { list: () => apiRequest("/reviews") };
