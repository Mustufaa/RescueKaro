"use client";

import { CheckCircle, ChevronLeft, ChevronRight, MessageSquareQuote, Star } from "lucide-react";
import { useState } from "react";
import { mockReviews } from "@/data/mock-reviews";

export function RatingDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex shrink-0 gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((number) => (
        <Star
          key={number}
          size={16}
          className={number <= rating ? "fill-amber-400 text-amber-400 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" : "text-slate-600"}
        />
      ))}
    </span>
  );
}

export function ReviewBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-safety/30 bg-safety/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-safety">
      {children}
    </span>
  );
}

export function Reviews() {
  const [start, setStart] = useState(0);
  const visible = [0, 1, 2].map((index) => mockReviews[(start + index) % mockReviews.length]);

  return (
    <section id="reviews" className="section relative overflow-hidden bg-[#071324]">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <MessageSquareQuote size={14} className="text-rescue" />
              Community Feedback
            </span>
            <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
              Made for people who believe being prepared matters.
            </h2>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <button
              aria-label="Previous review"
              onClick={() => setStart((start + mockReviews.length - 1) % mockReviews.length)}
              className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Next review"
              onClick={() => setStart((start + 1) % mockReviews.length)}
              className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {visible.map((review) => (
            <article className="glass-card flex flex-col justify-between p-6 sm:p-7" key={review.id}>
              <div>
                <div className="flex items-center justify-between">
                  <RatingDisplay rating={review.rating} />
                  <ReviewBadge>{review.useCase}</ReviewBadge>
                </div>
                <blockquote className="mt-6 text-base font-medium leading-7 text-slate-200">
                  &ldquo;{review.review}&rdquo;
                </blockquote>
              </div>

              <div className="mt-8 flex items-center gap-3.5 border-t border-white/5 pt-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-xs font-black text-white shadow-md">
                  {review.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <b className="truncate text-sm font-bold text-white">{review.customerName}</b>
                    <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                  </div>
                  <small className="block truncate text-xs text-slate-400">{review.location}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
