import { api } from "./api";

export type StoreSettings = { minOrderAmount: number; returnDays: number };

// Used if the API cannot be reached, so the policy pages still read correctly.
export const DEFAULT_SETTINGS: StoreSettings = { minOrderAmount: 30000, returnDays: 30 };

export async function getSettings(): Promise<StoreSettings> {
  try {
    return await api<StoreSettings>("/settings");
  } catch {
    return DEFAULT_SETTINGS;
  }
}
