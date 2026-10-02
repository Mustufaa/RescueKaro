const DEVELOPMENT_OTP = "000111";
export const mockOtpService = {
  async send(phone:string){ await new Promise(r=>setTimeout(r,500)); return {requestId:`dev-${phone.slice(-4)}`,expiresIn:30}; },
  async verify(code:string){ await new Promise(r=>setTimeout(r,500)); if(process.env.NODE_ENV==="production") return {verified:false,error:"Development verification is disabled in production."}; return code===DEVELOPMENT_OTP?{verified:true}:{verified:false,error:"Invalid development OTP."}; }
};
