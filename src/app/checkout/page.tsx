"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ErrorText, Field, PhoneField, SelectField } from "@/components/form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart, type CartLine } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { toApiPhone, toLocalPhone } from "@/lib/phone";
import { NIGERIA_STATES } from "@/lib/states";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/settings";

type Zone = { state: string; fee: number; estimatedDays: number };

const panel = "rounded-sm border border-line bg-white";
const panelTitle = "border-b border-line px-5 py-4 font-display text-xl font-semibold";

type Group = { key: string; seller: string; lines: CartLine[] };

function groupBySeller(lines: CartLine[]): Group[] {
  const map = new Map<string, Group>();
  for (const l of lines) {
    const key = l.product.seller.id ?? "house";
    if (!map.has(key)) map.set(key, { key, seller: l.product.seller.name, lines: [] });
    map.get(key)!.lines.push(l);
  }
  return [...map.values()];
}

export default function CheckoutPage() {
  const { user, token, loading } = useAuth();
  const { cart, setQuantity, remove, refresh } = useCart();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"online" | "cod">("online");

  useEffect(() => {
    api<StoreSettings>("/settings")
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
    api<{ zones: Zone[] }>("/delivery-zones")
      .then((r) => setZones(r.zones))
      .catch(() => setZones([]));
  }, []);

  const shell = (children: React.ReactNode) => (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-8 pb-14">
      <h1 className="mb-6 text-[34px] font-bold tracking-[-0.02em]">Cart and checkout</h1>
      {children}
    </main>
  );

  if (loading) return shell(<p className="text-muted">Loading…</p>);

  if (!user) {
    return shell(
      <p className={`${panel} p-6`}>
        <Link href="/signin" className="font-semibold text-accent-ink underline">
          Sign in or create an account
        </Link>{" "}
        to see your cart and check out.
      </p>,
    );
  }

  if (cart.items.length === 0) {
    return shell(
      <p className={`${panel} p-6`}>
        Your cart is empty.{" "}
        <Link href="/products" className="font-semibold text-accent-ink underline">
          Browse products
        </Link>
      </p>,
    );
  }

  const groups = groupBySeller(cart.items);
  const zone = zones?.find((z) => z.state === state);
  const delivery = zone ? zone.fee * groups.length : null;
  const total = delivery !== null ? cart.subtotal + delivery : null;
  const shortBy = Math.max(0, settings.minOrderAmount - cart.subtotal);
  // Pay on delivery is offered when the admin has it on, for orders up to the limit they set.
  const codOn = settings.codEnabled === true;
  const codMax = settings.codMaxAmount ?? 0;
  const codOverLimit = total !== null && total > codMax;
  const payMethod = method === "cod" && codOn && !codOverLimit ? "cod" : "online";
  const blocked = cart.items.some((i) => i.issue) || shortBy > 0;

  const run = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    setError("");
    try {
      const res = await api<{ orderNumber: string; checkoutUrl?: string }>("/orders/checkout", {
        method: "POST",
        token,
        body: {
          email: get("email") || undefined,
          paymentMethod: payMethod,
          address: {
            fullName: get("fullName"),
            phone: toApiPhone(get("phone")),
            street: get("street"),
            city: get("city"),
            state: get("state"),
            landmark: get("landmark") || undefined,
          },
        },
      });
      if (payMethod === "cod") {
        // Nothing to pay now. The order is placed, so show it.
        await refresh();
        router.push(`/orders/${res.orderNumber}`);
        return;
      }
      // Hand over to KoraPay's secure payment page.
      window.location.href = res.checkoutUrl!;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return shell(
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
        <ErrorText message={error} />
        {shortBy > 0 && (
          <p role="alert" className="rounded-sm border border-[#B42318] bg-[#FEF3F2] p-4 text-sm text-[#B42318]">
            The minimum order is {formatNaira(settings.minOrderAmount)}. Add {formatNaira(shortBy)} more to check out.{" "}
            <Link href="/products" className="font-semibold underline">
              Continue shopping
            </Link>
          </p>
        )}

        <section className={panel}>
          <h2 className={panelTitle}>1. Your cart</h2>
          {groups.map((g) => (
            <div key={g.key} className="border-b border-line last:border-b-0">
              <div className="flex flex-wrap justify-between gap-3 bg-[#F3F4F5] px-5 py-3 text-sm">
                <span>
                  Sold by <strong>{g.seller}</strong>
                </span>
                <span className="text-[#45474B]">
                  {zone
                    ? `Delivery: ${formatNaira(zone.fee)} · about ${zone.estimatedDays} ${zone.estimatedDays === 1 ? "day" : "days"}`
                    : "Delivery: choose your state below"}
                </span>
              </div>
              {g.lines.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-4 border-t border-surface px-5 py-4">
                  <div className="relative size-18 shrink-0 bg-surface">
                    {l.product.image && <Image src={l.product.image} alt="" fill sizes="72px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
                    <Link href={`/products/${l.product.slug}`} className="text-[15px] font-semibold text-foreground hover:text-accent-ink">
                      {l.product.title}
                    </Link>
                    <span className="text-[13px] text-muted">
                      {formatNaira(l.price)} each
                      {l.options.length > 0 && ` · ${l.options.map((o) => o.value).join(", ")}`}
                    </span>
                    {l.issue && <span className="text-[13px] font-semibold text-[#B42318]">{l.issue}</span>}
                  </div>
                  <div role="group" aria-label="Quantity" className="flex items-center rounded-sm border border-[#C6C6CB]">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={l.quantity <= 1}
                      onClick={() => run(() => setQuantity(l.id, l.quantity - 1))}
                      className="size-11 cursor-pointer bg-transparent text-xl disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-9 text-center font-semibold">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={l.quantity >= Math.min(l.stock, 20)}
                      onClick={() => run(() => setQuantity(l.id, l.quantity + 1))}
                      className="size-11 cursor-pointer bg-transparent text-xl disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-24 text-right font-display text-[17px] font-bold">{formatNaira(l.lineTotal)}</span>
                  <button
                    type="button"
                    onClick={() => run(() => remove(l.id))}
                    className="min-h-11 cursor-pointer px-2 text-[13px] font-semibold text-[#B42318]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className={panel}>
          <h2 className={panelTitle}>2. Delivery details</h2>
          <form id="checkout-form" onSubmit={onSubmit} className="grid gap-4 p-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            <Field compact label="Full name" name="fullName" defaultValue={user.name} autoComplete="name" required />
            <PhoneField compact label="Phone number" name="phone" defaultValue={toLocalPhone(user.phone)} required />
            <div className="col-span-full">
              <Field compact label="Email" name="email" type="email" defaultValue={user.email} autoComplete="email" required />
            </div>
            <div className="col-span-full">
              <Field compact label="Street address" name="street" autoComplete="street-address" minLength={5} required />
            </div>
            <SelectField compact label="State" name="state" value={state} onChange={(e) => setState(e.target.value)} required>
              <option value="" disabled>
                Choose your state
              </option>
              {/* Every state is listed. States we do not deliver to yet are greyed out. */}
              {NIGERIA_STATES.map((name) => {
                const available = zones?.some((z) => z.state === name) ?? false;
                return (
                  <option key={name} value={name} disabled={!available}>
                    {available ? name : `${name} (not available yet)`}
                  </option>
                );
              })}
            </SelectField>
            <Field compact label="City / local government area" name="city" required />
            <div className="col-span-full">
              <Field compact label="Nearest landmark" name="landmark" optional />
            </div>
            {zones?.length === 0 && (
              <p className="col-span-full text-sm text-[#B42318]">
                We cannot take orders yet because delivery fees have not been set up. Please check back soon.
              </p>
            )}
          </form>
        </section>

        <section className={panel}>
          <h2 className={panelTitle}>3. Payment</h2>
          <fieldset className="flex flex-col gap-3 p-5">
            <legend className="sr-only">How do you want to pay?</legend>
            {(
              [
                { id: "online", title: "Pay now", body: "Pay on KoraPay's secure page with your card or by bank transfer.", disabled: false },
                ...(codOn
                  ? [
                      {
                        id: "cod",
                        title: "Pay on delivery",
                        body: codOverLimit
                          ? `Pay on delivery is for orders up to ${formatNaira(codMax)}. Please pay now for this order.`
                          : `Pay ${total !== null ? formatNaira(total) : "the total"} when your order arrives. Please have the amount ready.${total === null ? ` Available for orders up to ${formatNaira(codMax)}.` : ""}`,
                        disabled: codOverLimit,
                      },
                    ]
                  : []),
              ] as { id: "online" | "cod"; title: string; body: string; disabled: boolean }[]
            ).map((o) => (
              <label
                key={o.id}
                className={`flex items-start gap-3 rounded-sm border p-4 ${o.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${payMethod === o.id ? "border-foreground bg-[#F8F9FA]" : "border-[#C6C6CB]"}`}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={o.id}
                  checked={payMethod === o.id}
                  disabled={o.disabled}
                  onChange={() => setMethod(o.id)}
                  className="mt-1 size-[18px] accent-accent"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{o.title}</span>
                  <span className="text-sm text-[#45474B]">{o.body}</span>
                </span>
              </label>
            ))}
            <p className="text-sm text-[#45474B]">We deliver your order to you ourselves.</p>
          </fieldset>
        </section>
      </div>

      <aside className="sticky top-6 flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-sm border border-line bg-white p-6">
        <h2 className="font-display text-[22px] font-semibold">Order summary</h2>
        <p className="flex justify-between text-[15px]">
          <span className="text-[#45474B]">Items ({cart.itemCount})</span>
          <span>{formatNaira(cart.subtotal)}</span>
        </p>
        {groups.map((g) => (
          <p key={g.key} className="flex justify-between text-[15px]">
            <span className="text-[#45474B]">Delivery, {g.seller}</span>
            <span>{zone ? formatNaira(zone.fee) : "Choose a state"}</span>
          </p>
        ))}
        <p className="flex items-baseline justify-between border-t-2 border-foreground pt-4">
          <span className="text-[17px] font-semibold">Total</span>
          <span className="font-display text-[30px] font-bold">{total !== null ? formatNaira(total) : "-"}</span>
        </p>
        <Button type="submit" form="checkout-form" busy={busy} disabled={blocked} className="h-14 text-[17px]">
          {payMethod === "cod" ? (total !== null ? `Place order · pay ${formatNaira(total)} on delivery` : "Place order") : total !== null ? `Pay ${formatNaira(total)}` : "Continue to payment"}
        </Button>
        {blocked && (
          <p className="text-center text-[13px] text-[#B42318]">
            {shortBy > 0 ? `Add ${formatNaira(shortBy)} more to reach the minimum order.` : "Fix the items marked above to continue."}
          </p>
        )}
        <p className="text-center text-[13px] leading-normal text-muted">
          By {payMethod === "cod" ? "placing this order" : "paying"} you agree to the{" "}
          <Link href="/terms" className="text-accent-ink underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/delivery-and-returns" className="text-accent-ink underline">
            return policy
          </Link>
          .
        </p>
      </aside>
    </div>,
  );
}
