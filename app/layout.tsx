import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rescuekaro.example"),
  title: {
    default: "RescueKaro - Emergency Information, One Scan Away",
    template: "%s | RescueKaro",
  },
  description:
    "Protected offline emergency QR stickers for helmets, vehicles, bags and personal items. No app, login, or server lookup required.",
  icons: {
    icon: "/brand/logo/rescuekaro-emblem.png",
  },
  openGraph: {
    title: "RescueKaro - Emergency Information, One Scan Away",
    description: "Protected offline emergency QR stickers for safer everyday journeys.",
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
