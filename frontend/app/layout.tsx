import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#050d1a",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = process.env.SITE_URL || (host ? `${protocol}://${host}` : "http://localhost:3000");
  return {
  metadataBase: new URL(origin),
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
