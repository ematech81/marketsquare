"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, title }: { images: { url: string }[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-sm border border-line bg-surface">
        <span className="block size-16 border-[3px] border-[#C6C6CB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square rounded-sm border border-line bg-surface">
        <Image
          src={images[active].url}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}${i === active ? ", selected" : ""}`}
              aria-current={i === active}
              className={`relative aspect-square cursor-pointer rounded-sm bg-surface p-0 ${
                i === active ? "border-2 border-accent" : "border border-line"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
