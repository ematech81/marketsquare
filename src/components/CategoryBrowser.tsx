"use client";

import Link from "next/link";
import { useRef } from "react";

type Category = { _id: string; name: string; slug: string };

const tile =
  "flex h-16 min-w-0 items-center justify-between gap-2 rounded-sm border border-line bg-white px-4 text-[15px] font-semibold hover:border-foreground";

// "Shop by category". On a large screen: two rows of six that scroll up and down when there are more.
// On a phone: one full-width bar that opens all the categories in a window.
export default function CategoryBrowser({ categories }: { categories: Category[] }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-4 md:px-6 md:pt-14">
      <h2 className="mb-6 hidden text-[28px] font-semibold tracking-tight md:block">Shop by category</h2>

      <div className="hidden max-h-36 grid-cols-4 gap-4 overflow-y-auto overscroll-contain pr-1 md:grid lg:grid-cols-6">
        {categories.map((c) => (
          <Link key={c._id} href={`/products?category=${c.slug}`} className={tile}>
            <span className="min-w-0 truncate">{c.name}</span>
            <span className="text-accent-ink" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-sm border border-line bg-white px-4 text-left text-base font-semibold hover:border-foreground md:hidden"
      >
        Shop by category
        <span className="text-accent-ink" aria-hidden>
          →
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label="Shop by category"
        onClick={(e) => {
          // A click on the dim area outside the window closes it.
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md rounded-[10px] border border-line bg-white p-0 backdrop:bg-black/50 md:hidden"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-semibold">Shop by category</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="flex size-11 cursor-pointer items-center justify-center text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <ul className="flex max-h-[calc(85dvh-4rem)] flex-col gap-2 overflow-y-auto overscroll-contain p-4">
          {categories.map((c) => (
            <li key={c._id}>
              <Link href={`/products?category=${c.slug}`} onClick={() => dialog.current?.close()} className={tile}>
                <span className="min-w-0 truncate">{c.name}</span>
                <span className="text-accent-ink" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </dialog>
    </section>
  );
}
