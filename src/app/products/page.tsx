"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
}

function ProductsPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const url = category
          ? `/api/products?category=${encodeURIComponent(category)}`
          : "/api/products";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      "for-him": "For Him",
      "for-her": "For Her",
      "for-kids": "For Kids",
      "special-occasions": "Special Occasions",
    };
    return categories[category] || category;
  };

  const categories = [
    { key: "", label: "All" },
    { key: "for-him", label: "For Him" },
    { key: "for-her", label: "For Her" },
    { key: "for-kids", label: "For Kids" },
    { key: "special-occasions", label: "Special Occasions" },
  ];

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="px-4 py-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          {category ? getCategoryName(category) : "All Products"}
        </h1>

        {/* Category Filters */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {categories.map(({ key, label }) => (
            <Link
              key={key}
              href={key ? `/products?category=${key}` : "/products"}
              className={`px-4 py-2 rounded-lg transition-all ${
                category === key || (!category && key === "")
                  ? "bg-pink-500 text-white shadow-md"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Loading State (Skeletons) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-4 animate-pulse"
              >
                <div className="h-40 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-400"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {category
                ? `No products in ${getCategoryName(category)}`
                : "No products available"}
            </h3>
            <p className="text-gray-500 mb-4">
              {category
                ? "Check back later or browse other categories"
                : "Our inventory is currently empty. Please check back soon."}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={getCategoryName(product.category)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading products...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
