import { apiRequest } from "./api";
async function establish(path: string, body: unknown) {
  const session = await apiRequest(path, { method: "POST", body: JSON.stringify(body) });
  await apiRequest("/auth/csrf");
  return session;
}
export const authService = {
  login: (body: unknown) => establish("/auth/login", body),
  loginOtp: (body: unknown) => establish("/auth/login/otp", body),
  register: (body: unknown) => establish("/auth/register", body),
  session: () => apiRequest<{user:{id:string;fullName:string;email:string;phone:string}}>("/auth/session"),
  refresh: () => apiRequest("/auth/refresh",{method:"POST"}),
  logout: () => apiRequest("/auth/logout",{method:"POST"}),
};
