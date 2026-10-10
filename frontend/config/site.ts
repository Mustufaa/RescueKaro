export const siteConfig = {
  name: "RescueKaro",
  tagline: "Scan Karo. Safe Karo.",
  description: "Protected emergency QR stickers that keep important information one scan away - even without an app or internet.",
  price: 99,
  replacementPrice: 50,
  supportEmail: "team@rescuekaro.com",
  supportPhone: "+91 94550 05380",
  address: "Lucknow, Uttar Pradesh, India",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://rescuekaro.example"
};

export const navItems = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Interactive Demo", href: "/#pull-demo" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQ", href: "/#faq" }
];
