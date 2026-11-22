import { adminFetch } from "@/lib/admin/client";

export async function getProducts() {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("Failed to load products");
  return response.json();
}

export async function getProductById(id: string) {
  const response = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error("Product not found");
  return response.json();
}

export async function saveProduct(data: Record<string, unknown>, id: string | null = null) {
  const response = await adminFetch(id ? `/api/products?id=${encodeURIComponent(id)}` : "/api/products", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to save product");
}
