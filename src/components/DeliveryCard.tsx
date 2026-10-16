"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/settings";

type Zone = { state: string; fee: number; estimatedDays: number };

const KEY = "sm_state";

const row = "flex items-start gap-3 border-t border-line px-4 py-3.5";

// "Delivery & Returns": choose your state, see the fee and the date it should arrive, and the return rule.
// The state is shared with the header's "Delivering to" picker.
export default function DeliveryCard() {
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [state, setState] = useState("");
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    api<StoreSettings>("/settings")
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
    api<{ zones: Zone[] }>("/delivery-zones")
      .then(({ zones: z }) => {
        setZones(z);
        let saved = "";
        try {
          saved = localStorage.getItem(KEY) ?? "";
        } catch {
          // storage can be blocked; the first state is a fine default
        }
        setState(z.find((x) => x.state === saved)?.state ?? z.find((x) => x.state === "Lagos")?.state ?? z[0]?.state ?? "");
      })
      .catch(() => setZones([]));
  }, []);

  // The header's "Delivering to" picker saves the choice and announces it.
  useEffect(() => {
    const follow = () => {
      try {
        setState(localStorage.getItem(KEY) ?? "");
      } catch {
        // storage can be blocked
      }
    };
    window.addEventListener("sm-state-change", follow);
    return () => window.removeEventListener("sm-state-change", follow);
  }, []);

  const zone = zones?.find((z) => z.state === state);

  function choose(value: string) {
    setState(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("sm-state-change"));
  }

  // "Mon 20 Oct": today plus the days the delivery takes. Worked out after the page loads, so the server and the
  // browser never disagree about what "today" is.
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setToday(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);
  const arrives =
    zone && today !== null
      ? new Date(today + zone.estimatedDays * 86400000).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })
      : "";

  return (
    <section className="rounded-sm border border-line bg-white" aria-labelledby="delivery-heading">
      <h2 id="delivery-heading" className="px-4 py-3 text-[12px] font-semibold tracking-[0.06em] uppercase">
        Delivery &amp; returns
      </h2>

      {zones !== null && zones.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line px-4 py-3.5">
          <label htmlFor="delivery-state" className="text-sm font-semibold">
            Choose your location
          </label>
          <select
            id="delivery-state"
            value={state}
            onChange={(e) => choose(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-sm border border-[#C6C6CB] bg-white px-3 text-[15px]"
          >
            {!zone && (
              <option value="" disabled>
                Choose a state
              </option>
            )}
            {zones.map((z) => (
              <option key={z.state} value={z.state}>
                {z.state}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={row}>
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface text-lg">
          🚚
        </span>
        <div className="flex flex-col gap-0.5 text-sm">
          <strong>Door delivery</strong>
          {zone ? (
            <>
              <span className="text-[#45474B]">Delivery fee {formatNaira(zone.fee)}</span>
              <span className="text-[13px] text-muted">
                Arrives in about {zone.estimatedDays} {zone.estimatedDays === 1 ? "day" : "days"}
                {arrives ? `, around ${arrives}` : ""}.
              </span>
            </>
          ) : (
            <span className="text-[#45474B]">{zones === null ? "Checking delivery…" : "Delivery fees are shown at checkout."}</span>
          )}
          {settings.codEnabled && <span className="text-[13px] text-muted">Pay on delivery available at checkout.</span>}
        </div>
      </div>

      <div className={row}>
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface text-lg">
          ↩
        </span>
        <div className="flex flex-col gap-0.5 text-sm">
          <strong>Return policy</strong>
          <span className="text-[#45474B]">Returns accepted within {settings.returnDays} days of delivery.</span>
          <span className="text-[13px] text-muted">Minimum order {formatNaira(settings.minOrderAmount)}.</span>
          <Link href="/delivery-and-returns" className="text-[13px] font-semibold text-accent-ink underline">
            Details
          </Link>
        </div>
      </div>
    </section>
  );
}
