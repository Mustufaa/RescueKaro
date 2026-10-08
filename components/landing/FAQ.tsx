"use client";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  ["What is RescueKaro?", "A protected physical QR sticker containing selected emergency information stored directly inside a static QR code. When someone scans it with any smartphone camera, your emergency information appears instantly without needing any internet connection or special mobile app."],
  ["Does RescueKaro work without internet or mobile data?", "Yes, 100%. The QR code contains plain-text emergency data directly encoded inside its static matrix. A compatible phone camera decodes the information locally on the device without pinging RescueKaro servers."],
  ["Does the helper or scanner need to install an app?", "No app, login, or OTP is required to scan the printed QR. Any standard iOS or Android camera app or built-in QR scanner will instantly read and display the emergency card."],
  ["What information can I add to my emergency QR?", "Full name, blood group, city/state, emergency contacts with relationship labels, critical medical notes (allergies, medication, conditions), address, and verified local emergency helplines (112, 108)."],
  ["How many emergency contacts can I add?", "You can configure 1 to 5 emergency contacts and designate a primary contact who is highlighted at the top of the decoded screen."],
  ["How are ambulance and police numbers selected?", "Supported location-based numbers come from RescueKaro's verified emergency directory (ERSS 112, 108 Ambulance, etc.). You review and verify them before your sticker is created."],
  ["Can I change my information after printing?", "Because the sticker is a static, offline QR for maximum reliability and privacy, the data printed on physical stickers cannot be changed remotely. If your blood group, contact, or medical notes change, you can easily order a replacement sticker through your dashboard."],
  ["Why is the QR code physically covered with a pull tab?", "The removable pull cover reduces casual exposure to passers-by and shields the vinyl from UV fading, rain, and road debris. It provides physical privacy during normal daily carry."],
  ["What is included in the RescueKaro Starter Kit?", "The Starter Kit includes 2 physical emergency QR stickers, 2 protective pull covers with tactile pull tabs, and surface prep wipes. Shipping is calculated at checkout based on your 6-digit PIN code."]
] as const;

export function FAQ() {
  return (
    <section id="faq" className="section relative overflow-hidden bg-[#071324]">
      <div className="container-page grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <div>
          <span className="eyebrow !text-blue-300">
            <HelpCircle size={14} className="text-safety" />
            Frequently Asked Questions
          </span>
          <h2 className="display mt-4 text-4xl sm:text-6xl">
            Clear answers for
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-white bg-clip-text text-transparent">
              complete peace of mind.
            </span>
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Everything you need to know about RescueKaro offline stickers, privacy protection, and emergency readouts.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h4 className="text-xs font-black uppercase text-safety">Have more questions?</h4>
            <p className="mt-1 text-xs text-slate-400">Our emergency support team is here to assist you.</p>
            <a href="mailto:team@rescuekaro.com" className="mt-3 inline-flex min-h-[44px] items-center text-xs font-bold text-rescue hover:underline touch-manipulation">
              Email team@rescuekaro.com →
            </a>
          </div>
        </div>

        <Accordion.Root type="single" collapsible className="space-y-3">
          {faqs.map(([q, a], i) => (
            <Accordion.Item
              value={`q${i}`}
              key={q}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors data-[state=open]:border-safety/40 data-[state=open]:bg-white/[0.06]"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between p-5 text-left font-bold text-white transition-all sm:p-6">
                  <span className="flex items-center gap-3 pr-4">
                    <span className="font-mono text-xs font-bold text-safety/80">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm sm:text-base">{q}</span>
                  </span>
                  <ChevronDown className="shrink-0 text-slate-400 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-safety" size={18} />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="border-t border-white/5 px-6 pb-6 pt-3 text-sm leading-7 text-slate-300">
                  {a}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
