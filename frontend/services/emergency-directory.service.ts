import { apiRequest } from "./api";
import type { EmergencyServiceDirectory } from "@/types";
export const emergencyDirectoryService = {
  getEmergencyServices: (location: {country:string;state:string;city:string}) => apiRequest<EmergencyServiceDirectory>(`/emergency-directory?${new URLSearchParams(location)}`),
};
