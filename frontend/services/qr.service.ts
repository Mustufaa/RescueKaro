import QRCode from "qrcode";

// QR pixels contain only the public emergency-page URL. Profile data stays on
// the server and is filtered by the owner's visibility choices when scanned.
export const qrService = {
  toDataUrl(publicUrl: string) {
    return QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "M",
      margin: 3,
      width: 560,
      color: { dark: "#050d1a", light: "#ffffff" },
    });
  },
};
