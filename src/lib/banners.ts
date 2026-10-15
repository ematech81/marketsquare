import { api } from "./api";

export type Banner = { id: string; image: string; width?: number; height?: number; mobileImage?: string; alt: string; link?: string };

// The banners the admin switched on, in order. If the API is down the home page simply has no banner.
export async function getBanners(): Promise<Banner[]> {
  try {
    return (await api<{ banners: Banner[] }>("/banners")).banners;
  } catch {
    return [];
  }
}
