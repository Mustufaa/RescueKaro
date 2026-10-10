import { ApiError, apiRequest } from "./api";

let currentRequestId = "";
type OtpVerification = { verified: boolean; verificationToken?: string; error?: string };

export const otpService = {
  async send(phone: string) {
    const response = await apiRequest<{ requestId: string; expiresIn: number; resendAfter: number }>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone, purpose: "registration" }),
    });
    currentRequestId = response.requestId;
    return response;
  },
  async verify(code: string): Promise<OtpVerification> {
    if (!currentRequestId) return { verified: false, error: "Request a new verification code." };
    try {
      const verified = await apiRequest<{ verified: boolean; verificationToken: string }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ requestId: currentRequestId, code }),
      });
      return { verified: verified.verified, verificationToken: verified.verificationToken };
    } catch (error) {
      return { verified: false, error: error instanceof ApiError ? error.message : "Verification failed." };
    }
  },
};
