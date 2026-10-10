import { apiRequest } from "./api";

export interface BackendHealth {
  status: "UP";
  service: "rescuekaro-backend";
}

export const healthService = {
  check: () => apiRequest<BackendHealth>("/health"),
};
