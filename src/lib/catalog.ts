import { cache } from "react";
import { api, ApiError } from "./api";

export type Category = { _id: string; name: string; slug: string; image?: string };

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: { name: string; slug: string };
  price: number;
  compareAtPrice?: number;
  images: { url: string; publicId?: string }[];
  variants: { name: string; options: string[] }[];
  inStock: boolean;
  stock: number;
  ratingAverage: number;
  ratingCount: number;
  seller: { id: string | null; name: string };
};

export type ProductList = { products: Product[]; page: number; pages: number; total: number };

export type ProductQuery = {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  page?: string;
};

// Fetched at request time inside Suspense boundaries, so builds never depend on the API being up.
// getProduct is wrapped in cache() so the page and its metadata share one request.
export async function getCategories(): Promise<Category[]> {
  const res = await api<{ categories: Category[] }>("/categories");
  return res.categories;
}

export async function getProducts(query: ProductQuery & { limit?: number }): Promise<ProductList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return api<ProductList>(`/products?${params.toString()}`);
}

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const res = await api<{ product: Product }>(`/products/${encodeURIComponent(slug)}`);
    return res.product;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});
