import { apiRequest, refreshSession } from "./api";

export type OtpChallenge = { requestId: string; expiresIn: number; resendAfter: number; maskedEmail: string };

async function establish(path: string, body: unknown) {
  const session = await apiRequest(path, { method: "POST", body: JSON.stringify(body) });
  await apiRequest("/auth/csrf");
  return session;
}

export const authService = {
  register: (body: unknown) => apiRequest<OtpChallenge>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  verifyEmail: (body: unknown) => establish("/auth/verify-email", body),
  login: (body: unknown) => apiRequest<OtpChallenge>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  verifyLogin: (body: unknown) => establish("/auth/verify-login-otp", body),
  resendOtp: (requestId: string) => apiRequest<OtpChallenge>("/auth/resend-otp", { method: "POST", body: JSON.stringify({ requestId }) }),
  requestPasswordReset: (email: string) => apiRequest<OtpChallenge>("/auth/password/reset/request", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (body: unknown) => apiRequest<void>("/auth/password/reset", { method: "POST", body: JSON.stringify(body) }),
  session: () => apiRequest<{ user: { id: string; fullName: string; email: string; phone: string } }>("/auth/session"),
  refresh: refreshSession,
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
};
