"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";

type Order = {
  orderNumber: string;
  paymentStatus: string;
  createdAt: string;
  paidAt?: string;
  items: { title: string; price: number; quantity: number; options: { name: string; value: string }[] }[];
  address: { fullName: string; phone: string; street: string; city: string; state: string; landmark?: string };
  subtotal: number;
  deliveryTotal: number;
  total: number;
};

const date = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

// A clean page to print or save as PDF. Browsers do this from the Print dialog ("Save as PDF").
export default function Invoice({ orderNumber }: { orderNumber: string }) {
  const { token, user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api<{ order: Order }>(`/orders/${orderNumber}`, { token })
      .then((r) => setOrder(r.order))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this invoice"));
  }, [token, orderNumber]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!user) {
    return (
      <p>
        <Link href="/signin" className="font-semibold text-accent-ink underline">
          Sign in
        </Link>{" "}
        to see your invoice.
      </p>
    );
  }
  if (error) return <p role="alert" className="text-[#B42318]">{error}</p>;
  if (!order) return <p className="text-muted">Loading…</p>;
  if (order.paymentStatus !== "paid") return <p className="text-[#45474B]">An invoice is available once the order is paid.</p>;

  return (
    <article className="mx-auto max-w-3xl rounded-sm border border-line bg-white p-8 print:border-0 print:p-0">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link href={`/orders/${order.orderNumber}`} className="text-sm font-semibold text-accent-ink hover:text-foreground">
          Back to order
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-sm bg-accent px-5 text-sm font-semibold text-foreground hover:opacity-90"
        >
          Print or save as PDF
        </button>
      </div>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b-2 border-foreground pb-5">
        <div>
          <p className="flex items-center gap-2.5 font-display text-2xl font-bold">
            <span className="inline-block size-4 bg-accent" aria-hidden />
            Square Market
          </p>
        </div>
        <div className="text-right text-sm">
          <h1 className="font-display text-2xl font-bold">Invoice</h1>
          <p>No. {order.orderNumber}</p>
          <p className="text-[#45474B]">{date(order.paidAt ?? order.createdAt)}</p>
        </div>
      </header>

      <section className="mb-8 text-sm">
        <h2 className="mb-1 font-display text-base font-semibold">Delivered to</h2>
        <p>{order.address.fullName}</p>
        <p className="text-[#45474B]">
          {order.address.street}, {order.address.city}, {order.address.state}
          {order.address.landmark ? ` (near ${order.address.landmark})` : ""}
        </p>
        <p className="text-[#45474B]">{order.address.phone}</p>
      </section>

      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-foreground text-left">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Price</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, n) => (
            <tr key={n} className="border-b border-line">
              <td className="py-2.5">
                {i.title}
                {i.options.length > 0 && <span className="text-muted"> ({i.options.map((o) => o.value).join(", ")})</span>}
              </td>
              <td className="py-2.5 text-right">{i.quantity}</td>
              <td className="py-2.5 text-right">{formatNaira(i.price)}</td>
              <td className="py-2.5 text-right">{formatNaira(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto flex max-w-xs flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-[#45474B]">Items</dt>
          <dd>{formatNaira(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#45474B]">Delivery</dt>
          <dd>{formatNaira(order.deliveryTotal)}</dd>
        </div>
        <div className="flex justify-between border-t-2 border-foreground pt-2 text-base font-bold">
          <dt>Total paid</dt>
          <dd className="font-display">{formatNaira(order.total)}</dd>
        </div>
      </dl>

      <p className="mt-8 text-[13px] text-muted">Paid with KoraPay. Thank you for shopping with Square Market.</p>
    </article>
  );
}
