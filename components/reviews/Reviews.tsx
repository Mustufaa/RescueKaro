"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { mockReviews } from "@/data/mock-reviews";

export function RatingDisplay({ rating }: { rating: number }) {
  return <span className="flex shrink-0 gap-1" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((number) => <Star key={number} size={15} className={number <= rating ? "fill-amber-400 text-amber-400" : "text-line"} />)}</span>;
}

export function ReviewBadge({ children }: { children: React.ReactNode }) {
  return <span className="max-w-full rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-safety dark:bg-blue-950">{children}</span>;
}

export function Reviews() {
  const [start, setStart] = useState(0);
  const visible = [0, 1, 2].map((index) => mockReviews[(start + index) % mockReviews.length]);

  return (
    <section id="reviews" className="section">
      <div className="container-page">
        <div className="flex items-end justify-between gap-5">
          <div className="min-w-0"><span className="eyebrow">Sample feedback</span><h2 className="display mt-4 max-w-3xl text-4xl sm:text-6xl">Made for people who believe being prepared matters.</h2></div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <button aria-label="Previous review" onClick={() => setStart((start + 2) % 3)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface"><ChevronLeft /></button>
            <button aria-label="Next review" onClick={() => setStart((start + 1) % 3)} className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white"><ChevronRight /></button>
          </div>
        </div>
        <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 hide-scroll sm:gap-5 md:grid md:grid-cols-3">
          {visible.map((review) => (
            <article className="surface min-w-[calc(100%-1.5rem)] snap-center p-5 sm:min-w-[75%] sm:p-7 md:min-w-0" key={review.id}>
              <div className="flex flex-wrap items-center justify-between gap-3"><RatingDisplay rating={review.rating} /><span className="text-[9px] font-black uppercase tracking-[.12em] text-rescue sm:tracking-[.16em]">Sample / placeholder</span></div>
              <blockquote className="mt-8 break-words text-lg font-semibold leading-8">“{review.review}”</blockquote>
              <div className="mt-8 flex min-w-0 flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-xs font-black text-white">{review.avatar}</span>
                <span className="min-w-0 flex-1"><b className="block break-words text-sm">{review.customerName}</b><small className="block break-words text-muted">{review.location}</small></span>
                <ReviewBadge>{review.useCase}</ReviewBadge>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Development placeholders only. Real ratings and verified reviews will replace these before production launch.</p>
      </div>
    </section>
  );
}
