"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

type Shipment = {
  _id: string;
  vendorName: string;
  status: "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  timeline: { status: string; at: string }[];
  estimatedDelivery?: string;
  items: { title: string; quantity: number; image?: string; price?: number; options?: { name: string; value: string }[] }[];
};

type Order = {
  orderNumber: string;
  paymentStatus: "pending" | "paid" | "failed" | "mismatch" | "cod";
  paymentMethod?: "online" | "cod";
  paidAt?: string;
  createdAt: string;
  address: { fullName: string; phone: string; street: string; city: string; state: string; landmark?: string };
  subtotal: number;
  deliveryTotal: number;
  total: number;
  shipments: Shipment[];
};

const STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  placed: "Order placed",
  confirmed: "Order confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
const panel = "rounded-sm border border-line bg-white";
const h2 = "font-display text-lg font-semibold";

function orderPill(o: Order): { text: string; cls: string } {
  if (o.paymentStatus === "pending") return { text: "Awaiting payment", cls: "bg-surface text-foreground" };
  if (o.paymentStatus === "failed") return { text: "Payment not completed", cls: "bg-[#FEF3F2] text-[#B42318]" };
  if (o.paymentStatus === "mismatch") return { text: "Needs attention", cls: "bg-[#FEF3F2] text-[#B42318]" };
  const s = o.shipments.map((x) => x.status);
  if (s.length > 0 && s.every((x) => x === "delivered")) return { text: "Delivered", cls: "bg-[#DCFCE7] text-[#14532D]" };
  if (s.some((x) => x === "shipped" || x === "delivered")) {
    const all = s.every((x) => x === "shipped" || x === "delivered");
    return { text: all ? "Shipped" : "Partly shipped", cls: "bg-[#FBEAE4] text-[#8A3219]" };
  }
  if (s.some((x) => x === "packed")) return { text: "Packed", cls: "bg-[#FBEAE4] text-[#8A3219]" };
  return { text: o.paymentStatus === "cod" ? "Pay on delivery" : "Paid", cls: "bg-[#FBEAE4] text-[#8A3219]" };
}

// Where the money stands, as ticks, ahead of the delivery steps.
function paymentSteps(o: Order): { label: string; done: boolean; note: string }[] {
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const placed = { label: "Order placed", done: true, note: day(o.createdAt) };
  if (o.paymentMethod === "cod") {
    return [
      placed,
      { label: "Pay on delivery", done: true, note: `You pay ${formatNaira(o.total)} when it arrives` },
      {
        label: "Payment received",
        done: o.paymentStatus === "paid",
        note: o.paymentStatus === "paid" && o.paidAt ? day(o.paidAt) : "When your order is delivered",
      },
    ];
  }
  return [
    placed,
    {
      label: "Payment confirmed",
      done: o.paymentStatus === "paid",
      note:
        o.paymentStatus === "paid" && o.paidAt
          ? `${day(o.paidAt)} · KoraPay`
          : o.paymentStatus === "pending"
            ? "Waiting for your payment"
            : o.paymentStatus === "failed"
              ? "Payment not completed"
              : "Needs checking",
    },
  ];
}

function stepsFor(s: Shipment, state: string) {
  const current = STEPS.indexOf(s.status as (typeof STEPS)[number]);
  const at = (status: string) => s.timeline.find((t) => t.status === status)?.at;
  return STEPS.map((name, i) => {
    const phase = s.status === "delivered" || i < Math.max(current, 1) ? "done" : i === Math.max(current, 1) ? "now" : "todo";
    const note =
      phase === "done"
        ? at(name)
          ? shortDate(at(name)!)
          : ""
        : phase === "todo"
          ? "Waiting"
          : { confirmed: s.status === "placed" ? "Waiting for Square Market to confirm" : "Square Market has confirmed your order", packed: "Your items are being packed", shipped: `On its way to ${state}`, delivered: "Waiting" }[name as string] ?? "";
    return { name, phase, note, last: i === STEPS.length - 1 };
  });
}

export default function OrderView({ orderNumber }: { orderNumber: string }) {
  const { token, user, loading } = useAuth();
  const { refresh } = useCart();
  const justPlaced = useSearchParams().get("placed") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  // True once we have checked for a while and the payment is still not confirmed.
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // Asks the server to confirm the payment with KoraPay, then keeps checking for a short while
    // in case the customer came back before the payment finished.
    const check = async (attempt: number) => {
      try {
        const res = await api<{ order: Order }>(`/orders/${orderNumber}/verify`, { method: "POST", token });
        if (cancelled) return;
        setOrder(res.order);
        if (res.order.paymentStatus === "paid") refresh();
        else if (res.order.paymentStatus === "pending") {
          if (attempt < 8) timer = setTimeout(() => check(attempt + 1), 4000);
          else setStalled(true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this order");
      }
    };
    timer = setTimeout(() => check(0), 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, orderNumber, refresh]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!user) {
    return (
      <p>
        <Link href="/signin" className="font-semibold text-accent-ink underline">
          Sign in
        </Link>{" "}
        to see your order.
      </p>
    );
  }
  if (error) return <p role="alert" className="text-[#B42318]">{error}</p>;
  if (!order) return <p className="text-muted">Loading your order…</p>;

  const pill = orderPill(order);
  const vendors = new Set(order.shipments.map((s) => s.vendorName)).size;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
        <Link href="/orders" className="hover:text-foreground">
          My orders
        </Link>{" "}
        / <span className="text-foreground">Order {order.orderNumber}</span>
      </nav>

      {justPlaced && order.paymentMethod === "cod" && (
        <section role="status" className="mb-6 rounded-sm border border-[#16A34A] bg-[#F0FDF4] p-5">
          <p className="font-display text-xl font-semibold text-[#14532D]">Thank you, your order is placed</p>
          <p className="mt-1 text-[15px] text-[#14532D]">
            Your order number is <strong>{order.orderNumber}</strong>. We will confirm it and deliver it to you. You do not pay anything now: please have{" "}
            <strong>{formatNaira(order.total)}</strong> ready when it arrives. Follow each step below, and find this page again any time under{" "}
            <Link href="/orders" className="font-semibold underline">
              My orders
            </Link>
            .
          </p>
        </section>
      )}

      <section className={`${panel} mb-6 flex flex-col gap-2 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className={`self-start rounded-sm px-2.5 py-1 text-[13px] font-semibold ${pill.cls}`}>{pill.text}</span>
          {order.paymentStatus === "paid" && (
            <Link href={`/orders/${order.orderNumber}/invoice`} className="inline-flex min-h-11 items-center rounded-sm border border-foreground px-5 text-sm font-semibold text-foreground hover:bg-surface">
              View invoice
            </Link>
          )}
        </div>
        <h1 className="text-[32px] font-bold tracking-[-0.02em]">Order {order.orderNumber}</h1>
        <span className="text-[15px] text-[#45474B]">
          Placed on {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          {order.shipments.length > 0 &&
            ` · ${order.shipments.length} ${order.shipments.length === 1 ? "shipment" : "shipments"} from ${vendors} ${vendors === 1 ? "vendor" : "vendors"}`}
        </span>
        <ol className="m-0 mt-3 flex list-none flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
          {paymentSteps(order).map((st) => (
            <li key={st.label} className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center border-2 text-[13px] font-bold ${st.done ? "border-foreground bg-foreground text-white" : "border-[#C6C6CB] bg-white"}`}
              >
                {st.done ? "✓" : ""}
              </span>
              <span className="flex flex-col">
                <span className={`text-[15px] ${st.done ? "font-semibold" : "font-medium text-muted"}`}>{st.label}</span>
                <span className="text-[13px] text-muted">{st.note}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {order.paymentStatus === "pending" && (
        <p className={`${panel} mb-6 p-4 text-sm`}>
          {stalled ? (
            <>
              We have not received a payment for this order. If you cancelled, you have not been charged.{" "}
              <Link href="/checkout" className="font-semibold text-accent-ink underline">
                Back to your cart
              </Link>{" "}
              to try again. If you did pay, wait a minute and refresh this page, or contact support with your order number.
            </>
          ) : (
            "We are confirming your payment. This page updates by itself. If you have already paid, it can take a minute."
          )}
        </p>
      )}
      {order.paymentStatus === "cod" && (
        <p className={`${panel} mb-6 p-4 text-sm`}>
          <strong>Pay on delivery.</strong> Nothing to pay now. Please have <strong>{formatNaira(order.total)}</strong> ready when your order arrives.
        </p>
      )}
      {order.paymentStatus === "failed" && (
        <p className="mb-6 rounded-sm border border-[#B42318] bg-[#FEF3F2] p-4 text-sm text-[#B42318]">
          The payment was not completed, so you have not been charged for this order.{" "}
          <Link href="/checkout" className="font-semibold underline">
            Back to your cart
          </Link>
        </p>
      )}
      {order.paymentStatus === "mismatch" && (
        <p className="mb-6 rounded-sm border border-[#B42318] bg-[#FEF3F2] p-4 text-sm text-[#B42318]">
          We received a payment for this order that does not match the total. Please contact Square Market support with
          your order number.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          {order.shipments.map((s, n) => (
            <section key={s._id} className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] text-muted">
                    Shipment {n + 1} of {order.shipments.length} · Sold by
                  </span>
                  <h2 className="font-display text-[22px] font-semibold">{s.vendorName}</h2>
                </div>
                {s.estimatedDelivery && s.status !== "delivered" && s.status !== "cancelled" && (
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[13px] text-muted">Estimated delivery</span>
                    <strong className="text-[15px]">
                      {new Date(s.estimatedDelivery).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                    </strong>
                  </div>
                )}
              </div>

              {s.status === "cancelled" ? (
                <p className="p-6 text-[15px] font-semibold text-[#B42318]">This shipment was cancelled.</p>
              ) : (
                <ol className="m-0 flex list-none flex-col p-6">
                  {stepsFor(s, order.address.state).map((st) => (
                    <li key={st.name} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center border-2 text-sm font-bold text-white ${
                            st.phase === "done"
                              ? "border-foreground bg-foreground"
                              : st.phase === "now"
                                ? "border-accent bg-accent"
                                : "border-[#C6C6CB] bg-white"
                          }`}
                        >
                          {st.phase === "done" ? "✓" : ""}
                        </span>
                        <span
                          className={`min-h-6 w-0.5 grow ${st.last ? "bg-transparent" : st.phase === "done" ? "bg-foreground" : "bg-line"}`}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 pb-5">
                        <span className={`text-base ${st.phase === "todo" ? "font-medium text-muted" : "font-semibold"}`}>
                          {STEP_LABEL[st.name]}
                        </span>
                        <span className="text-[13px] text-muted">{st.note}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <ul className="m-0 list-none divide-y divide-line border-t border-line bg-background p-0">
                {s.items.map((i, k) => (
                  <li key={k} className="flex items-center gap-4 px-6 py-4">
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-line bg-surface">
                      {i.image && <Image src={i.image} alt={i.title} fill sizes="64px" className="object-cover" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{i.title}</span>
                      {i.options && i.options.length > 0 && (
                        <span className="text-[13px] text-muted">{i.options.map((o) => `${o.name}: ${o.value}`).join(", ")}</span>
                      )}
                      <span className="text-[13px] text-muted">Qty {i.quantity}</span>
                    </span>
                    {i.price !== undefined && <span className="shrink-0 text-[15px] font-semibold">{formatNaira(i.price * i.quantity)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <section className={`${panel} flex flex-col gap-2 p-6`}>
            <h2 className={`${h2} mb-1`}>Delivery address</h2>
            <span className="text-[15px] font-semibold">{order.address.fullName}</span>
            <span className="text-[15px] leading-normal text-[#45474B]">
              {order.address.street}, {order.address.city}
              <br />
              {order.address.state}
              {order.address.landmark && (
                <>
                  <br />
                  Near {order.address.landmark}
                </>
              )}
            </span>
            <span className="text-[15px] text-[#45474B]">{order.address.phone}</span>
          </section>

          <section className={`${panel} flex flex-col gap-2.5 p-6`}>
            <h2 className={`${h2} mb-1`}>Payment</h2>
            <p className="flex justify-between text-[15px]">
              <span className="text-[#45474B]">Items</span>
              <span>{formatNaira(order.subtotal)}</span>
            </p>
            <p className="flex justify-between text-[15px]">
              <span className="text-[#45474B]">Delivery</span>
              <span>{formatNaira(order.deliveryTotal)}</span>
            </p>
            <p className="flex justify-between border-t border-line pt-3 text-[17px] font-bold">
              <span>{order.paymentStatus === "paid" ? "Total paid" : order.paymentStatus === "cod" ? "To pay on delivery" : "Total"}</span>
              <span className="font-display">{formatNaira(order.total)}</span>
            </p>
            {order.paymentStatus === "paid" && (
              <span className="text-[13px] font-semibold text-[#166534]">{order.paymentMethod === "cod" ? "Paid on delivery" : "Paid with KoraPay"}</span>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
