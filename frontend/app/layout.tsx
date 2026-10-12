import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#050d1a",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || (process.env.RENDER_EXTERNAL_HOSTNAME
    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : "http://localhost:3000")),
  title: {
    default: "RescueKaro - Emergency Information, One Scan Away",
    template: "%s | RescueKaro",
  },
  description:
    "Protected emergency QR stickers for helmets, vehicles, bags and personal items. Scan online without an app or login.",
  icons: {
    icon: "/brand/logo/rescuekaro-emblem.png",
  },
  openGraph: {
    title: "RescueKaro - Emergency Information, One Scan Away",
    description: "Protected emergency QR stickers that open an online emergency profile.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RescueKaro",
    description: "Scan Karo. Safe Karo.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
