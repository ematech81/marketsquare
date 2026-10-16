"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";

type Row = { orderNumber: string; total: number; paymentStatus: string; paymentMethod?: string; progress?: string; createdAt: string; items: { title: string }[] };

const STATUS: Record<string, string> = { paid: "Paid", pending: "Awaiting payment", mismatch: "Needs attention", cod: "Pay on delivery" };

export default function OrdersPage() {
  const { token, user, loading } = useAuth();
  const [orders, setOrders] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!token) return;
    api<{ orders: Row[] }>("/orders", { token })
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, [token]);

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-8 pb-14">
      <h1 className="mb-6 text-[34px] font-bold tracking-[-0.02em]">My orders</h1>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : !user ? (
        <Link href="/signin" className="font-semibold text-accent-ink underline">
          Sign in to see your orders
        </Link>
      ) : orders === null ? (
        <p className="text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-sm border border-line bg-white p-6">
          You have no orders yet.{" "}
          <Link href="/products" className="font-semibold text-accent-ink underline">
            Start shopping
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-sm border border-line bg-white">
          {orders.map((o) => (
            <li key={o.orderNumber}>
              <Link href={`/orders/${o.orderNumber}`} className="flex flex-wrap justify-between gap-3 p-5 text-foreground hover:bg-background">
                <span className="min-w-0">
                  <span className="block font-semibold">{o.orderNumber}</span>
                  <span className="block truncate text-sm text-muted">{o.items.map((i) => i.title).join(", ")}</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-lg font-bold">{formatNaira(o.total)}</span>
                  <span className="block text-sm text-muted">
                    {o.progress ? `${o.progress} · ` : ""}
                    {STATUS[o.paymentStatus] ?? o.paymentStatus} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-accent-ink">Track order →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
