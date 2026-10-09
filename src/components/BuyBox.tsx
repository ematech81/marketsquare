"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

type Props = {
  productId: string;
  inStock: boolean;
  stock: number;
  variants: { name: string; options: string[] }[];
};

export default function BuyBox({ productId, inStock, stock, variants }: Props) {
  const { user, loading } = useAuth();
  const { add } = useCart();
  const router = useRouter();
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const maxQty = Math.min(stock, 20);

  async function addToCart(then: "stay" | "checkout") {
    const missing = variants.find((v) => !chosen[v.name]);
    if (missing) {
      setMessage({ kind: "error", text: `Choose a ${missing.name.toLowerCase()}` });
      return;
    }
    setBusy(then === "stay" ? "cart" : "buy");
    setMessage(null);
    try {
      await add(productId, quantity, variants.map((v) => ({ name: v.name, value: chosen[v.name] })));
      if (then === "checkout") router.push("/checkout");
      else setMessage({ kind: "ok", text: "Added to your cart." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not add to cart" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {variants.map((v) => (
        <fieldset key={v.name} className="border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-semibold">
            {v.name}
            {chosen[v.name] ? `: ${chosen[v.name]}` : ""}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {v.options.map((o) => (
              <label
                key={o}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm bg-white px-5 text-sm ${
                  chosen[v.name] === o ? "border-2 border-foreground font-semibold" : "border border-[#C6C6CB] font-medium"
                }`}
              >
                <input
                  type="radio"
                  name={v.name}
                  value={o}
                  checked={chosen[v.name] === o}
                  onChange={() => setChosen((c) => ({ ...c, [v.name]: o }))}
                  className="sr-only"
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        {inStock && (
          <div role="group" aria-label="Quantity" className="flex items-center rounded-sm border border-[#C6C6CB] bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="size-11 cursor-pointer bg-transparent text-xl"
            >
              −
            </button>
            <span className="w-11 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              className="size-11 cursor-pointer bg-transparent text-xl"
            >
              +
            </button>
          </div>
        )}
        <span className={`text-sm font-semibold ${inStock ? "text-[#166534]" : "text-[#B42318]"}`}>
          {!inStock ? "Out of stock" : stock <= 5 ? `Only ${stock} left` : "In stock"}
        </span>
      </div>

      {!loading && !user ? (
        <p className="rounded-sm border border-line bg-white p-4 text-sm">
          <Link href="/signin" className="font-semibold text-accent-ink underline">
            Sign in or create an account
          </Link>{" "}
          to add this to your cart.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={!inStock || busy !== null}
            onClick={() => addToCart("stay")}
            className="min-h-[52px] rounded-sm bg-accent text-base font-semibold text-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === "cart" ? "Adding…" : "Add to cart"}
          </button>
          <button
            type="button"
            disabled={!inStock || busy !== null}
            onClick={() => addToCart("checkout")}
            className="min-h-12 rounded-sm bg-foreground text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === "buy" ? "Please wait…" : "Buy now"}
          </button>
        </div>
      )}

      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`text-sm ${message.kind === "error" ? "text-[#B42318]" : "text-[#166534]"}`}
        >
          {message.text}{" "}
          {message.kind === "ok" && (
            <Link href="/checkout" className="font-semibold text-accent-ink underline">
              View cart
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
