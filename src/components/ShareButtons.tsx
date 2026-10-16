"use client";

import { useState } from "react";

const round =
  "flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#76777B] text-foreground hover:border-foreground hover:bg-surface";

// "Share this product": WhatsApp, Facebook, X, and a button that copies the link.
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`${title} on Square Market`);
  const link = encodeURIComponent(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can be blocked; the other buttons still work
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold tracking-[0.06em] text-muted uppercase">Share this product</span>
      <div className="flex items-center gap-2.5">
        <a href={`https://wa.me/?text=${text}%20${link}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className={round}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
            <path d="M9 8.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8c-.8-.3-1.7-1.2-2-2l.8-.8-1-2Z" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${link}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className={round}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.7-1.6h1.4V4.3c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4v1.3H8v3h2.5V21Z" />
          </svg>
        </a>
        <a href={`https://twitter.com/intent/tweet?text=${text}&url=${link}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className={round}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <button type="button" onClick={copy} aria-label="Copy link" className={round}>
          {copied ? (
            <span className="text-[13px] font-bold">✓</span>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
            </svg>
          )}
        </button>
        <span role="status" className="text-[13px] text-muted">
          {copied ? "Link copied" : ""}
        </span>
      </div>
    </div>
  );
}
