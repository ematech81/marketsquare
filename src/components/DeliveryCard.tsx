"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/settings";

type Zone = { state: string; fee: number; estimatedDays: number };

const KEY = "sm_state";

// "Delivery to Lagos: ₦2,500 · about 2 days", with a way to change the state.
export default function DeliveryCard() {
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [state, setState] = useState("");
  const [changing, setChanging] = useState(false);
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

  if (zones === null) return null;

  const zone = zones.find((z) => z.state === state);

  function choose(value: string) {
    setState(value);
    setChanging(false);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-sm border border-line bg-white p-4 text-sm">
      {zone ? (
        <>
          <strong>Delivery to {zone.state}</strong>
          <span className="text-[#45474B]">
            {formatNaira(zone.fee)} · about {zone.estimatedDays} {zone.estimatedDays === 1 ? "day" : "days"}
          </span>
          {changing ? (
            <select
              aria-label="Delivery state"
              value={state}
              onChange={(e) => choose(e.target.value)}
              className="mt-1 h-11 rounded-sm border border-[#C6C6CB] bg-white px-3"
            >
              {zones.map((z) => (
                <option key={z.state} value={z.state}>
                  {z.state}
                </option>
              ))}
            </select>
          ) : (
            zones.length > 1 && (
              <button
                type="button"
                onClick={() => setChanging(true)}
                className="self-start text-[13px] font-semibold text-accent-ink hover:text-foreground"
              >
                Change state
              </button>
            )
          )}
        </>
      ) : (
        <>
          <strong>Delivery</strong>
          <span className="text-[#45474B]">Delivery fees are shown at checkout.</span>
        </>
      )}
      {settings.minOrderAmount > 0 && (
        <span className="mt-1 border-t border-line pt-2 text-[13px] text-[#45474B]">
          Minimum order {formatNaira(settings.minOrderAmount)}. Returns accepted within {settings.returnDays} days of delivery.
        </span>
      )}
    </div>
  );
}
