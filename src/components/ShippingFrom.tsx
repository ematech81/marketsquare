"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/format";

type Zone = { state: string; fee: number; estimatedDays: number };

const KEY = "sm_state";

// "+ shipping from ₦2,000 to Lagos", under the price. It follows the state chosen in the header.
export default function ShippingFrom() {
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [state, setState] = useState("");

  useEffect(() => {
    api<{ zones: Zone[] }>("/delivery-zones")
      .then((r) => setZones(r.zones))
      .catch(() => setZones([]));
    const read = () => {
      try {
        setState(localStorage.getItem(KEY) ?? "");
      } catch {
        // storage can be blocked
      }
    };
    // Deferred one tick so nothing is set during the effect itself.
    const timer = setTimeout(read, 0);
    window.addEventListener("sm-state-change", read);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("sm-state-change", read);
    };
  }, []);

  if (!zones || zones.length === 0) return null;
  const zone = zones.find((z) => z.state === state);
  const lowest = Math.min(...zones.map((z) => z.fee));

  return (
    <p className="text-[13px] text-[#45474B]">
      + shipping from <strong>{formatNaira(zone ? zone.fee : lowest)}</strong>
      {zone ? ` to ${zone.state}` : ""}
    </p>
  );
}
