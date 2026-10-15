"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Banner } from "@/lib/banners";

const INTERVAL_MS = 5000;

// True when the visitor asked their device to avoid animation. Then nothing moves on its own.
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const q = window.matchMedia("(prefers-reduced-motion: reduce)");
      q.addEventListener("change", notify);
      return () => q.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const arrow =
  "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm bg-white/90 text-xl text-foreground opacity-0 shadow transition-opacity hover:bg-white focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 max-md:hidden";

// The full-width banner at the top of the home page. It moves by itself every 5 seconds, stops while you point at it,
// and can be swiped, stepped with arrows or dots, or paused. The admin fills it with up to 6 designs.
export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const count = banners.length;
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  // Set briefly after a swipe so that the swipe does not also open the banner's link.
  const suppressClick = useRef(false);

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  const autoplay = count > 1 && !userPaused && !hovering && !reduced;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      // A background tab should not keep turning slides.
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [autoplay, count, index]);

  // The banner is a wide, fixed shape (4 to 1: for example 1920 x 480). A design of another shape is trimmed to fit,
  // so make every banner this size.
  // Phones show a taller picture (4 to 3) when every banner has one. Otherwise they show the wide design, smaller.
  const phoneDesigns = banners.every((b) => b.mobileImage);
  const frame = phoneDesigns ? "aspect-[4/3] md:aspect-[4/1]" : "aspect-[4/1]";

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(index - 1);
    else if (e.key === "ArrowRight") go(index + 1);
  }

  // Sits inside the page width, like the rest of the page, with space above it and a border around it.
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-5 pb-1 md:px-6 md:pt-6">
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="group relative w-full overflow-hidden rounded-sm border-[5px] border-[#C6C6CB] bg-surface shadow-sm"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onKeyDown={onKeyDown}
    >
      <div
        className="flex touch-pan-y transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={autoplay ? "off" : "polite"}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, moved: false };
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || count < 2) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 50) {
            d.moved = true;
            go(index + (dx < 0 ? 1 : -1));
            // A swipe must not also count as a click on the banner's link.
            drag.current = null;
            suppressClick.current = true;
            setTimeout(() => (suppressClick.current = false), 0);
          }
        }}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {banners.map((b, i) => {
          const picture = (
            <div className={`relative w-full md:max-h-[28rem] ${frame}`}>
              {b.mobileImage ? (
                <>
                  <Image src={b.mobileImage} alt={b.alt} fill priority={i === 0} sizes="100vw" className="object-cover md:hidden" draggable={false} />
                  <Image src={b.image} alt="" aria-hidden fill priority={i === 0} sizes="100vw" className="hidden object-cover md:block" draggable={false} />
                </>
              ) : (
                <Image src={b.image} alt={b.alt} fill priority={i === 0} sizes="100vw" className="object-cover" draggable={false} />
              )}
            </div>
          );
          const internal = b.link?.startsWith("/");
          return (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              // Slides that are out of view cannot be tabbed to or read.
              inert={i !== index}
              className="w-full shrink-0"
            >
              {b.link ? (
                internal ? (
                  <Link href={b.link} className="block">
                    {picture}
                  </Link>
                ) : (
                  <a href={b.link} target="_blank" rel="noopener noreferrer" className="block">
                    {picture}
                  </a>
                )
              ) : (
                picture
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous banner" className={`${arrow} left-3`}>
            ‹
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next banner" className={`${arrow} right-3`}>
            ›
          </button>

          <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-sm bg-black/35 px-1.5 backdrop-blur-sm">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show banner ${i + 1} of ${count}`}
                aria-current={i === index}
                className="flex h-6 min-w-6 cursor-pointer items-center justify-center"
              >
                <span className={`block h-2 rounded-full bg-white transition-all ${i === index ? "w-6" : "w-2 opacity-60"}`} />
              </button>
            ))}
            {!reduced && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Start the banner rotation" : "Pause the banner rotation"}
                className="ml-1 flex h-6 min-w-6 cursor-pointer items-center justify-center text-[11px] text-white"
              >
                {userPaused ? "▶" : "❚❚"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
    </div>
  );
}

