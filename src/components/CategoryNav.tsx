"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Cat = { _id: string; name: string; slug: string };

const hit = "rounded-sm border border-transparent hover:border-white focus-visible:border-white focus-visible:outline-none";
const GAP = 4; // the gap between two links, in pixels (gap-1)

// The row of categories under the search bar.
//   - Phones: every category, scrolling sideways with a finger.
//   - Larger screens: only as many as fit on the row. The rest are in the "All" menu. This keeps the buttons at the end of
//     the row (like "Vendor dashboard") always in view, however many categories there are.
export default function CategoryNav({ categories, activeCats }: { categories: Cat[]; activeCats: string[] }) {
  const room = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(categories.length);

  // Measures every link at its natural width (in a hidden copy), and counts how many fit in the space there is.
  useEffect(() => {
    const measure = () => {
      if (!room.current || !ruler.current) return;
      const available = room.current.clientWidth;
      let used = 0;
      let count = 0;
      for (const el of Array.from(ruler.current.children) as HTMLElement[]) {
        const next = used + el.offsetWidth + (count > 0 ? GAP : 0);
        if (next > available) break;
        used = next;
        count += 1;
      }
      setFits(count);
    };
    const first = setTimeout(measure, 0);
    const watcher = new ResizeObserver(measure);
    if (room.current) watcher.observe(room.current);
    return () => {
      clearTimeout(first);
      watcher.disconnect();
    };
  }, [categories]);

  const link = (c: Cat) => {
    const active = activeCats.includes(c.slug);
    return (
      <Link
        key={c._id}
        href={`/products?category=${c.slug}`}
        aria-current={active ? "page" : undefined}
        className={`${hit} flex min-h-10 shrink-0 items-center px-3 text-sm whitespace-nowrap ${active ? "font-bold underline decoration-accent decoration-2 underline-offset-8" : ""}`}
      >
        {c.name}
      </Link>
    );
  };

  return (
    <>
      {/* Phones */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:hidden">{categories.map(link)}</div>

      {/* Larger screens */}
      <div ref={room} className="relative hidden min-w-0 flex-1 items-center gap-1 overflow-hidden md:flex">
        {categories.slice(0, fits).map(link)}
        {/* A hidden copy at natural size, only used to measure */}
        <div ref={ruler} aria-hidden className="pointer-events-none invisible absolute top-0 left-0 flex h-0 gap-1 overflow-hidden">
          {categories.map((c) => (
            <span key={c._id} className="flex shrink-0 items-center border border-transparent px-3 text-sm whitespace-nowrap">
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
