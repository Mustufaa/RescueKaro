const DEVELOPMENT_OTP = process.env.NEXT_PUBLIC_DEMO_OTP_CODE || "000111";
const demoOtpEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ENABLE_DEMO_OTP === "true";

export const mockOtpService = {
  async send(phone:string){ await new Promise(r=>setTimeout(r,500)); return {requestId:`dev-${phone.slice(-4)}`,expiresIn:30}; },
  async verify(code:string){ await new Promise(r=>setTimeout(r,500)); if(!demoOtpEnabled) return {verified:false,error:"Demo OTP is disabled for this deployment."}; return code===DEVELOPMENT_OTP?{verified:true}:{verified:false,error:"Invalid development OTP."}; }
};
