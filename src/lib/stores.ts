import { api, ApiError } from "./api";

export type Store = { id: string; name: string; category: string; state: string; city: string; productCount: number };

// Approved vendors with at least one live product. Nothing private is included.
export async function getStores(): Promise<Store[]> {
  try {
    return (await api<{ stores: Store[] }>("/stores")).stores;
  } catch {
    return [];
  }
}

export async function getStore(id: string): Promise<Store | null> {
  try {
    return (await api<{ store: Store }>(`/stores/${encodeURIComponent(id)}`)).store;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
