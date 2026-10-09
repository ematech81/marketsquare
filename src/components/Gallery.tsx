"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, title }: { images: { url: string }[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-foreground/5 text-foreground/40">
        No image
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square bg-foreground/5">
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
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square border-2 ${i === active ? "border-accent" : "border-transparent"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
