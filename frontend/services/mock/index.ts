import { mockOrders } from "@/data/mock-orders";
import { mockReviews } from "@/data/mock-reviews";
import { mockEmergencyProfile, mockUser } from "@/data/mock-user";
const delay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));
export const mockService = {
  async getUser() { await delay(); return mockUser; }, async getOrders() { await delay(); return mockOrders; },
  async getReviews() { await delay(); return mockReviews; }, async getEmergencyProfile() { await delay(); return mockEmergencyProfile; }
};
