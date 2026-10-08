"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(8, "Please enter a valid phone number"),
  subject: z.string().min(2, "Please enter a subject"),
  message: z.string().min(10, "Please add a little more detail (min 10 characters)"),
});

type Values = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  if (sent) {
    return (
      <div className="glass-panel border-l-4 !border-l-safety p-6 sm:p-8">
        <div className="flex items-center gap-3 text-safety">
          <CheckCircle2 size={24} />
          <h2 className="text-xl sm:text-2xl font-black text-white">Message dispatched to support.</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Thank you for reaching out. Our emergency safety team has received your message and will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async () => {
        await new Promise((r) => setTimeout(r, 600));
        setSent(true);
      })}
      className="grid gap-5 sm:grid-cols-2"
      noValidate
    >
      <label className="block">
        <span className="label">Your Name</span>
        <input
          type="text"
          autoComplete="name"
          placeholder="Aarav Sharma"
          className="field"
          {...register("name")}
        />
        {errors.name && <small className="mt-1 block text-xs font-semibold text-rescue">{errors.name.message}</small>}
      </label>

      <label className="block">
        <span className="label">Email Address</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="aarav@example.com"
          className="field"
          {...register("email")}
        />
        {errors.email && <small className="mt-1 block text-xs font-semibold text-rescue">{errors.email.message}</small>}
      </label>

      <label className="block">
        <span className="label">Mobile Phone</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className="field"
          {...register("phone")}
        />
        {errors.phone && <small className="mt-1 block text-xs font-semibold text-rescue">{errors.phone.message}</small>}
      </label>

      <label className="block">
        <span className="label">Topic / Subject</span>
        <input
          type="text"
          placeholder="Sticker enquiry or general question"
          className="field"
          {...register("subject")}
        />
        {errors.subject && <small className="mt-1 block text-xs font-semibold text-rescue">{errors.subject.message}</small>}
      </label>

      <label className="block sm:col-span-2">
        <span className="label">How can we assist you?</span>
        <textarea
          rows={5}
          placeholder="Describe your question or feedback..."
          className="field !min-h-[120px] resize-y"
          {...register("message")}
        />
        {errors.message && <small className="mt-1 block text-xs font-semibold text-rescue">{errors.message.message}</small>}
      </label>

      <div className="sm:col-span-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="button button-primary w-full sm:w-auto !min-h-[48px] px-8 text-xs font-bold"
        >
          <Send size={15} />
          <span>{isSubmitting ? "Transmitting..." : "Send Message"}</span>
        </button>
      </div>
    </form>
  );
}
