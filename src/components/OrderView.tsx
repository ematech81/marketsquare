"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

// One package. A customer may buy from many vendors, but sees ONE order: packages are only numbered, and only shown when
// there is something to do with them (a delivery code, "I received it", "Report a problem").
type Pkg = {
  _id: string;
  package: number;
  status: "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  estimatedDelivery?: string;
  fulfilledBy?: "platform" | "vendor";
  delivery?: { courierName?: string; courierPhone?: string; note?: string };
  deliveryCode?: string;
  canConfirm?: boolean;
  canReport?: boolean;
  dispute?: { status: "open" | "released" | "refunded"; reason?: string };
  items: { title: string; quantity: number }[];
};

type Line = { title: string; quantity: number; image?: string; price?: number; ageRestricted?: boolean; options?: { name: string; value: string }[] };

type Progress = {
  stage: "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  cancelled: boolean;
  partial: boolean;
  packages: { total: number; live: number; onTheWay: number; delivered: number };
  steps: { name: string; label: string; done: boolean; partial: boolean; at: string | null; note: string }[];
};

type Order = {
  orderNumber: string;
  paymentStatus: "pending" | "paid" | "failed" | "mismatch" | "cod" | "cancelled";
  paymentMethod?: "online" | "cod";
  paidAt?: string;
  createdAt: string;
  address: { fullName: string; phone: string; street: string; city: string; state: string; landmark?: string };
  subtotal: number;
  deliveryTotal: number;
  total: number;
  items: Line[];
  progress: Progress;
  shipments: Pkg[];
  canCancel: boolean;
  cancelBlockedReason?: string;
  canDelete: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  refund?: { status: "due" | "done"; amount: number };
};

const CANCEL_REASONS = ["Changed my mind", "Ordered by mistake", "Found a better price", "Delivery would take too long", "Need to change the address or items", "Other"];

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
const panel = "rounded-sm border border-line bg-white";
const h2 = "font-display text-lg font-semibold";

function orderPill(o: Order): { text: string; cls: string } {
  if (o.paymentStatus === "cancelled" || o.progress.cancelled) return { text: "Cancelled", cls: "bg-surface text-[#45474B]" };
  if (o.paymentStatus === "pending") return { text: "Awaiting payment", cls: "bg-surface text-foreground" };
  if (o.paymentStatus === "failed") return { text: "Payment not completed", cls: "bg-[#FEF3F2] text-[#B42318]" };
  if (o.paymentStatus === "mismatch") return { text: "Needs attention", cls: "bg-[#FEF3F2] text-[#B42318]" };
  const p = o.progress;
  if (p.stage === "delivered") return { text: "Delivered", cls: "bg-[#DCFCE7] text-[#14532D]" };
  if (p.partial && p.stage !== "shipped") return { text: "Partly shipped", cls: "bg-[#FBEAE4] text-[#8A3219]" };
  if (p.stage === "shipped") return { text: "Shipped", cls: "bg-[#FBEAE4] text-[#8A3219]" };
  if (p.stage === "packed") return { text: "Packed", cls: "bg-[#FBEAE4] text-[#8A3219]" };
  if (p.stage === "confirmed") return { text: "Confirmed", cls: "bg-[#FBEAE4] text-[#8A3219]" };
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
              : o.paymentStatus === "cancelled"
                ? "Cancelled before payment"
                : "Needs checking",
    },
  ];
}

export default function OrderView({ orderNumber }: { orderNumber: string }) {
  const { token, user, loading } = useAuth();
  const { refresh } = useCart();
  const router = useRouter();
  const justPlaced = useSearchParams().get("placed") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  // True once we have checked for a while and the payment is still not confirmed.
  const [stalled, setStalled] = useState(false);
  // "I received my order" and "Report a problem" on one package at a time.
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [reporting, setReporting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  // Cancelling the whole order.
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

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

  async function packageAction(id: string, path: "confirm-delivery" | "report", body?: { reason: string }) {
    setActionBusy(id);
    setActionError("");
    try {
      const res = await api<{ order: Order }>(`/orders/${orderNumber}/shipments/${id}/${path}`, { method: "POST", token, body });
      setOrder(res.order);
      setReporting(null);
      setReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionBusy(null);
    }
  }

  async function cancelOrder(e: React.FormEvent) {
    e.preventDefault();
    setCancelBusy(true);
    setCancelError("");
    try {
      const res = await api<{ order: Order }>(`/orders/${orderNumber}/cancel`, { method: "POST", token, body: { reason: cancelReason, note: cancelNote || undefined } });
      setOrder(res.order);
      setCancelling(false);
      refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not cancel the order");
    } finally {
      setCancelBusy(false);
    }
  }

  async function deleteOrder() {
    if (!window.confirm("Delete this order from your list? You will not be able to see it again.")) return;
    setCancelBusy(true);
    setCancelError("");
    try {
      await api(`/orders/${orderNumber}`, { method: "DELETE", token });
      router.push("/orders");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not delete the order");
      setCancelBusy(false);
    }
  }

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
  const isCancelled = order.paymentStatus === "cancelled" || order.progress.cancelled;
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const steps = order.progress.steps;
  // The first step that is not done yet is the one in progress.
  const nowIndex = steps.findIndex((s) => !s.done);
  const stepNote = (name: string, note: string, done: boolean, at: string | null) => {
    if (done) return at ? shortDate(at) : "";
    if (note) return note;
    return (
      { confirmed: "Waiting for Square Market to confirm", packed: "Your items are being packed", shipped: `On its way to ${order.address.state} once packed`, delivered: "Waiting" }[name] ?? ""
    );
  };
  const etas = order.shipments.filter((p) => p.estimatedDelivery && p.status !== "delivered" && p.status !== "cancelled").map((p) => new Date(p.estimatedDelivery!).getTime());
  const eta = etas.length ? new Date(Math.max(...etas)) : null;
  // Packages are shown only when there is something for the customer to do with them.
  const actionable = order.shipments.filter((p) => p.status !== "cancelled" && ((p.fulfilledBy === "vendor" && p.status === "shipped") || p.canConfirm || p.canReport || p.dispute));
  const single = order.shipments.filter((p) => p.status !== "cancelled").length === 1;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
        <Link href="/orders" className="hover:text-foreground">
          My orders
        </Link>{" "}
        / <span className="text-foreground">Order {order.orderNumber}</span>
      </nav>

      {justPlaced && order.paymentMethod === "cod" && !isCancelled && (
        <section role="status" className="mb-6 rounded-sm border border-[#16A34A] bg-[#F0FDF4] p-5">
          <p className="font-display text-xl font-semibold text-[#14532D]">Thank you, your order is placed</p>
          <p className="mt-1 text-[15px] text-[#14532D]">
            Your order number is <strong>{order.orderNumber}</strong>. We will confirm it and deliver it to you. You do not pay anything now: please have{" "}
            <strong>{formatNaira(order.total)}</strong> ready when it arrives. Follow the steps below, and find this page again any time under{" "}
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
          {order.paymentStatus === "paid" && !isCancelled && (
            <Link href={`/orders/${order.orderNumber}/invoice`} className="inline-flex min-h-11 items-center rounded-sm border border-foreground px-5 text-sm font-semibold text-foreground hover:bg-surface">
              View invoice
            </Link>
          )}
        </div>
        <h1 className="text-[32px] font-bold tracking-[-0.02em]">Order {order.orderNumber}</h1>
        <span className="text-[15px] text-[#45474B]">
          Placed on {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"}
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
      {order.paymentStatus === "cod" && !isCancelled && (
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

      {isCancelled && (
        <section role="status" className="mb-6 rounded-sm border border-[#C6C6CB] bg-white p-5">
          <p className="font-display text-xl font-semibold">This order was cancelled</p>
          {order.cancelReason && <p className="mt-1 text-[15px] text-[#45474B]">Reason: {order.cancelReason}</p>}
          {order.refund?.status === "due" && (
            <p className="mt-2 text-[15px] text-[#45474B]">
              <strong>We will refund {formatNaira(order.refund.amount)}</strong> to your original payment method. It can take a few working days to show.
            </p>
          )}
          {order.refund?.status === "done" && (
            <p className="mt-2 text-[15px] font-semibold text-[#166534]">{formatNaira(order.refund.amount)} has been refunded to you.</p>
          )}
          {!order.refund && order.paymentStatus !== "paid" && <p className="mt-2 text-[15px] text-[#45474B]">You were not charged for this order.</p>}
        </section>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          {/* One tracking for the whole order */}
          {!isCancelled && steps.length > 0 && (
            <section className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
                <h2 className="font-display text-[22px] font-semibold">Order tracking</h2>
                {eta && order.progress.stage !== "delivered" && (
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[13px] text-muted">Estimated delivery</span>
                    <strong className="text-[15px]">{eta.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}</strong>
                  </div>
                )}
              </div>
              <ol className="m-0 flex list-none flex-col p-6">
                {steps.map((st, i) => {
                  const phase = st.done ? "done" : i === nowIndex || st.partial ? "now" : "todo";
                  const last = i === steps.length - 1;
                  return (
                    <li key={st.name} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center border-2 text-sm font-bold text-white ${
                            phase === "done" ? "border-foreground bg-foreground" : phase === "now" ? "border-accent bg-accent" : "border-[#C6C6CB] bg-white"
                          }`}
                        >
                          {phase === "done" ? "✓" : ""}
                        </span>
                        <span className={`min-h-6 w-0.5 grow ${last ? "bg-transparent" : phase === "done" ? "bg-foreground" : "bg-line"}`} />
                      </div>
                      <div className="flex flex-col gap-0.5 pb-5">
                        <span className={`text-base ${phase === "todo" ? "font-medium text-muted" : "font-semibold"}`}>{st.label}</span>
                        <span className="text-[13px] text-muted">{phase === "todo" ? "Waiting" : stepNote(st.name, st.note, st.done, st.at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* Only when there is something to do: a delivery code, "I received it", "Report a problem" */}
          {actionable.length > 0 && (
            <section className={panel}>
              <h2 className="border-b border-line px-6 py-5 font-display text-[22px] font-semibold">Delivery and help</h2>
              {actionable.map((p) => (
                <div key={p._id} className="flex flex-col gap-3 border-b border-line px-6 py-5 last:border-b-0">
                  <div>
                    {!single && <span className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Package {p.package}</span>}
                    <p className="text-[14px] text-[#45474B]">{p.items.map((i) => `${i.quantity} × ${i.title}`).join(", ")}</p>
                  </div>

                  {p.fulfilledBy === "vendor" && p.status === "shipped" && (
                    <div className="flex flex-col gap-3 rounded-sm bg-[#FFF8F5] p-4">
                      {p.delivery?.courierName && (
                        <p className="text-[15px]">
                          <strong>On its way with:</strong> {p.delivery.courierName}
                          {p.delivery.courierPhone && (
                            <>
                              {" "}
                              <a href={`tel:${p.delivery.courierPhone}`} className="font-semibold text-accent-ink underline">
                                {p.delivery.courierPhone}
                              </a>
                            </>
                          )}
                          {p.delivery.note ? ` (${p.delivery.note})` : ""}
                        </p>
                      )}
                      {p.deliveryCode && (
                        <div>
                          <p className="text-sm text-[#45474B]">Your delivery code. Give it to the person delivering only when you have received {single ? "your items" : "this package"}.</p>
                          <p aria-label={`Delivery code ${p.deliveryCode.split("").join(" ")}`} className="mt-1 font-mono text-[34px] font-bold tracking-[0.35em]">
                            {p.deliveryCode}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {p.dispute?.status === "open" && (
                    <p className="rounded-sm bg-[#FEF3F2] p-3 text-sm text-[#B42318]">
                      <strong>You reported a problem.</strong> Square Market is looking into it and will contact you.
                    </p>
                  )}
                  {p.dispute && p.dispute.status !== "open" && (
                    <p className="rounded-sm bg-background p-3 text-sm text-[#45474B]">
                      You reported a problem. Square Market reviewed it{p.dispute.status === "refunded" ? " and will refund you" : " and the order stands"}.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {p.canConfirm && p.fulfilledBy === "vendor" && (
                      <button
                        type="button"
                        disabled={actionBusy === p._id}
                        onClick={() => packageAction(p._id, "confirm-delivery")}
                        className="min-h-11 cursor-pointer rounded-sm bg-accent px-5 text-sm font-semibold text-foreground hover:brightness-95 disabled:opacity-60"
                      >
                        {actionBusy === p._id ? "Please wait…" : single ? "I received my order" : "I received this package"}
                      </button>
                    )}
                    {p.canReport && reporting !== p._id && (
                      <button
                        type="button"
                        onClick={() => {
                          setReporting(p._id);
                          setActionError("");
                        }}
                        className="min-h-11 cursor-pointer rounded-sm border border-[#C6C6CB] bg-white px-5 text-sm font-semibold hover:border-foreground"
                      >
                        Report a problem
                      </button>
                    )}
                  </div>
                  {reporting === p._id && (
                    <form
                      className="flex max-w-xl flex-col gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        packageAction(p._id, "report", { reason });
                      }}
                    >
                      <label htmlFor={`reason-${p._id}`} className="text-sm font-medium">
                        What is wrong?
                      </label>
                      <textarea
                        id={`reason-${p._id}`}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        minLength={10}
                        maxLength={500}
                        required
                        placeholder="For example: the delivery person has not come, or an item is missing or damaged."
                        className="rounded-sm border border-[#C6C6CB] bg-white p-3 text-[15px] outline-none focus:border-accent"
                      />
                      <p className="text-[13px] text-muted">We will hold the seller&apos;s payment until we have looked into it.</p>
                      <div className="flex gap-3">
                        <button type="submit" disabled={actionBusy === p._id} className="min-h-11 cursor-pointer rounded-sm bg-foreground px-5 text-sm font-semibold text-white disabled:opacity-60">
                          {actionBusy === p._id ? "Sending…" : "Send"}
                        </button>
                        <button type="button" onClick={() => setReporting(null)} className="min-h-11 cursor-pointer px-3 text-sm font-semibold text-[#45474B]">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  {actionError && (reporting === p._id || actionBusy === null) && (
                    <p role="alert" className="text-sm text-[#B42318]">
                      {actionError}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Everything in the order, in one list */}
          <section className={panel}>
            <h2 className="border-b border-line px-6 py-5 font-display text-[22px] font-semibold">Items in this order</h2>
            <ul className="m-0 list-none divide-y divide-line p-0">
              {order.items.map((i, k) => (
                <li key={k} className="flex items-center gap-4 px-6 py-4">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-line bg-surface">
                    {i.image && <Image src={i.image} alt={i.title} fill sizes="64px" className="object-cover" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">
                      {i.title}
                      {i.ageRestricted && <span className="ml-2 rounded-sm bg-[#B42318] px-1.5 py-0.5 text-[11px] font-bold text-white">18+ · ID may be checked</span>}
                    </span>
                    {i.options && i.options.length > 0 && <span className="text-[13px] text-muted">{i.options.map((o) => `${o.name}: ${o.value}`).join(", ")}</span>}
                    <span className="text-[13px] text-muted">Qty {i.quantity}</span>
                  </span>
                  {i.price !== undefined && <span className="shrink-0 text-[15px] font-semibold">{formatNaira(i.price * i.quantity)}</span>}
                </li>
              ))}
            </ul>
          </section>

          {/* Cancel, or delete a cancelled order */}
          {(order.canCancel || order.canDelete || (!isCancelled && order.cancelBlockedReason && order.paymentStatus !== "failed")) && (
            <section className={`${panel} p-6`}>
              {order.canCancel && !cancelling && (
                <div className="flex flex-col gap-2">
                  <h2 className={h2}>Need to cancel?</h2>
                  <p className="text-sm text-[#45474B]">
                    You can cancel until your items are packed.{" "}
                    {order.paymentStatus === "paid" ? "Because you paid online, we will refund you." : order.paymentStatus === "cod" ? "You have not paid anything." : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCancelling(true)}
                    className="mt-1 min-h-11 cursor-pointer self-start rounded-sm border border-[#B42318] bg-white px-5 text-sm font-semibold text-[#B42318] hover:bg-[#FEF3F2]"
                  >
                    Cancel order
                  </button>
                </div>
              )}
              {order.canCancel && cancelling && (
                <form onSubmit={cancelOrder} className="flex max-w-xl flex-col gap-3">
                  <h2 className={h2}>Cancel this order?</h2>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Why are you cancelling?
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="box-border h-12 w-full rounded-sm border border-[#C6C6CB] bg-white px-3 text-[15px] outline-none focus:border-accent"
                    >
                      {CANCEL_REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Anything else we should know? (optional)
                    <textarea
                      value={cancelNote}
                      onChange={(e) => setCancelNote(e.target.value)}
                      rows={2}
                      maxLength={300}
                      className="rounded-sm border border-[#C6C6CB] bg-white p-3 text-[15px] outline-none focus:border-accent"
                    />
                  </label>
                  <p className="text-[13px] text-muted">This cancels the whole order and cannot be undone.</p>
                  <div className="flex gap-3">
                    <button type="submit" disabled={cancelBusy} className="min-h-11 cursor-pointer rounded-sm bg-[#B42318] px-5 text-sm font-semibold text-white disabled:opacity-60">
                      {cancelBusy ? "Cancelling…" : "Yes, cancel my order"}
                    </button>
                    <button type="button" onClick={() => setCancelling(false)} className="min-h-11 cursor-pointer px-3 text-sm font-semibold text-[#45474B]">
                      Keep my order
                    </button>
                  </div>
                </form>
              )}
              {!order.canCancel && !isCancelled && order.cancelBlockedReason && order.paymentStatus !== "failed" && (
                <p className="text-sm text-[#45474B]">
                  <strong>Cancelling:</strong> {order.cancelBlockedReason}
                </p>
              )}
              {order.canDelete && (
                <div className="flex flex-col gap-2">
                  <h2 className={h2}>Remove this order</h2>
                  <p className="text-sm text-[#45474B]">You can take this order off your list. Square Market keeps its own record.</p>
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={deleteOrder}
                    className="mt-1 min-h-11 cursor-pointer self-start rounded-sm border border-[#C6C6CB] bg-white px-5 text-sm font-semibold hover:border-foreground disabled:opacity-60"
                  >
                    Delete order
                  </button>
                </div>
              )}
              {cancelError && (
                <p role="alert" className="mt-3 text-sm text-[#B42318]">
                  {cancelError}
                </p>
              )}
            </section>
          )}
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
