"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, ErrorText } from "./form";

type Review = { id: string; rating: number; body?: string; author: string; createdAt: string };

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function ReviewsSection({ slug }: { slug: string }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [eligible, setEligible] = useState<{ canReview: boolean; reason?: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ reviews: Review[] }>(`/products/${slug}/reviews`);
      setReviews(res.reviews);
    } catch {
      setReviews([]);
    }
    if (token) {
      try {
        setEligible(await api(`/products/${slug}/reviews/eligibility`, { token }));
      } catch {
        setEligible(null);
      }
    }
  }, [slug, token]);

  useEffect(() => {
    // Deferred one tick so the fetch result is never set during the effect itself.
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setError("Choose a star rating.");
      return;
    }
    const body = String(new FormData(e.currentTarget).get("body") ?? "").trim();
    setBusy(true);
    setError("");
    try {
      await api(`/products/${slug}/reviews`, { method: "POST", token, body: { rating, body: body || undefined } });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[26px] font-semibold">Customer reviews</h2>
        {eligible?.canReview && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-foreground bg-white px-5 text-sm font-semibold hover:bg-surface"
          >
            Write a review
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-4 rounded-sm border border-line bg-white p-6">
          <ErrorText message={error} />
          <fieldset className="border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">Your rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={rating === n}
                  onClick={() => setRating(n)}
                  className={`size-11 cursor-pointer rounded-sm border text-2xl ${
                    n <= rating ? "border-accent bg-accent text-foreground" : "border-[#C6C6CB] bg-white text-muted"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Your review <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              name="body"
              rows={4}
              maxLength={1000}
              className="box-border w-full rounded-sm border border-[#C6C6CB] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-accent"
            />
          </label>
          <div className="flex gap-3">
            <Button type="submit" busy={busy} className="h-12">
              Post review
            </Button>
            <Button type="button" tone="outline" className="h-12" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {reviews === null ? (
        <p className="text-muted">Loading…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-sm border border-line bg-white p-6 text-[15px] leading-relaxed text-[#45474B]">
          No reviews yet. Only verified buyers can leave a review, after their order is delivered.
          {!user && (
            <>
              {" "}
              <Link href="/signin" className="font-semibold text-accent-ink underline">
                Sign in
              </Link>{" "}
              to check if you can review this product.
            </>
          )}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-sm border border-line bg-white">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-1.5 p-5">
              <span className="text-accent-ink" aria-label={`${r.rating} out of 5 stars`}>
                {stars(r.rating)}
              </span>
              {r.body && <p className="text-[15px] leading-relaxed text-[#45474B]">{r.body}</p>}
              <span className="text-[13px] text-muted">
                {r.author} · {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · Verified buyer
              </span>
            </li>
          ))}
        </ul>
      )}

      {eligible && !eligible.canReview && user && eligible.reason && reviews && reviews.length === 0 && (
        <p className="mt-3 text-[13px] text-muted">{eligible.reason}</p>
      )}
    </section>
  );
}
