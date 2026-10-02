import type { Review } from "@/types";
export const mockReviews: Review[] = [
  { id: "r1", customerName: "Sample rider", location: "Pune", rating: 5, review: "The pull-cover idea makes the purpose instantly clear while keeping the QR protected for everyday rides.", useCase: "Helmet", avatar: "SR", createdAt: "2026-09-08", verified: false, sample: true },
  { id: "r2", customerName: "Sample parent", location: "Bengaluru", rating: 5, review: "A simple, thoughtful layer of preparedness for our family vehicles and travel bags.", useCase: "Family", avatar: "SP", createdAt: "2026-09-11", verified: false, sample: true },
  { id: "r3", customerName: "Sample commuter", location: "Lucknow", rating: 4, review: "No app and no network dependency is exactly what makes this feel practical in an emergency.", useCase: "Bike / Scooter", avatar: "SC", createdAt: "2026-09-16", verified: false, sample: true }
];
