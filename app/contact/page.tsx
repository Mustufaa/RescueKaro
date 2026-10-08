import type { Metadata } from "next";
import { Handshake, LifeBuoy, Mail, MapPin, PackageSearch, Phone } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact RescueKaro in Lucknow for customer, order, and partnership enquiries.",
};

export default function Contact() {
  return (
    <PublicShell>
      <section className="section bg-[#07182d] text-white">
        <div className="container-page pt-4 sm:pt-10">
          <span className="eyebrow">Contact RescueKaro</span>
          <h1 className="display mt-4 max-w-4xl text-3xl sm:text-5xl lg:text-7xl">
            Tell us what you need help with.
          </h1>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-6 text-sm text-white/80">
            <span className="flex min-h-[44px] items-center gap-2">
              <MapPin size={17} className="text-safety shrink-0" />
              Lucknow, Uttar Pradesh, India
            </span>
            <a
              className="flex min-h-[44px] items-center gap-2 hover:text-white transition-colors touch-manipulation"
              href="mailto:team@rescuekaro.com"
            >
              <Mail size={17} className="text-safety shrink-0" />
              team@rescuekaro.com
            </a>
            <a
              className="flex min-h-[44px] items-center gap-2 hover:text-white transition-colors touch-manipulation"
              href="tel:+919455005380"
            >
              <Phone size={17} className="text-safety shrink-0" />
              +91 94550 05380
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div className="space-y-3.5">
            {[
              [LifeBuoy, "Customer Support", "Product and general questions"],
              [PackageSearch, "Order Support", "Payments, shipping and tracking"],
              [Handshake, "Business Enquiries", "Partnership and distribution conversations"],
            ].map(([I, t, d]) => {
              const Icon = I as typeof LifeBuoy;
              return (
                <div className="surface flex items-start gap-4 p-4 sm:p-5" key={String(t)}>
                  <Icon className="text-safety shrink-0 mt-0.5" size={20} />
                  <span>
                    <b className="block text-white text-sm">{String(t)}</b>
                    <small className="text-muted text-xs leading-5 mt-0.5 block">{String(d)}</small>
                  </span>
                </div>
              );
            })}
          </div>
          <ContactForm />
        </div>
      </section>
    </PublicShell>
  );
}
