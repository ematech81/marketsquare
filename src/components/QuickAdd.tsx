"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const button =
  "flex h-11 w-full cursor-pointer items-center justify-center rounded-sm bg-foreground text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-foreground disabled:hover:text-white motion-reduce:transition-none";

// The "Add to cart" button on a product card. A product with options (like Size) needs the buyer to choose first,
// so it sends them to the product page instead.
export default function QuickAdd({
  productId,
  href,
  inStock,
  hasOptions,
}: {
  productId: string;
  href: string;
  inStock: boolean;
  hasOptions: boolean;
}) {
  const { user } = useAuth();
  const { add } = useCart();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "added" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!inStock) {
    return (
      <button type="button" disabled className={button}>
        Out of stock
      </button>
    );
  }
  if (hasOptions) {
    return (
      <Link href={href} className={button}>
        Choose options
      </Link>
    );
  }

  async function onClick() {
    if (!user) {
      router.push("/signin");
      return;
    }
    setState("busy");
    setMessage("");
    try {
      await add(productId, 1, []);
      setState("added");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add to cart");
      setState("error");
    }
  }

  return (
    <>
      <button type="button" onClick={onClick} disabled={state === "busy"} className={button}>
        {state === "busy" ? "Adding…" : state === "added" ? "Added ✓" : "Add to cart"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-800">
          {message}
        </p>
      )}
    </>
  );
}
