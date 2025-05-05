// app/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string; // Ensure this matches admin form values
}

export default function ProductsPage() {
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
        
        // Add category to API request if specified
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
  }, [category]); // Re-fetch when category changes

  // Category mapping - must match admin form values exactly
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      "for-him": "For Him",
      "for-her": "For Her",
      "for-kids": "For Kid",
      "special-occasions": "Special Occasions"
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />
      
      <section className="px-4 py-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          {category ? getCategoryName(category) : "All Products"}
        </h1>
        
        {/* Category Filter Links */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <Link 
            href="/products" 
            className={`px-4 py-2 rounded ${
              !category ? 'bg-pink-500 text-white' : 'bg-gray-200'
            }`}
          >
            All
          </Link>
          <Link 
            href="/products?category=for-him" 
            className={`px-4 py-2 rounded ${
              category === 'for-him' ? 'bg-pink-500 text-white' : 'bg-gray-200'
            }`}
          >
            For Him
          </Link>
          <Link 
            href="/products?category=for-her" 
            className={`px-4 py-2 rounded ${
              category === 'for-her' ? 'bg-pink-500 text-white' : 'bg-gray-200'
            }`}
          >
            For Her
          </Link>
          <Link 
            href="/products?category=for-kids" 
            className={`px-4 py-2 rounded ${
              category === 'for-kids' ? 'bg-pink-500 text-white' : 'bg-gray-200'
            }`}
          >
            For Kids
          </Link>
          <Link 
            href="/products?category=special-occasions" 
            className={`px-4 py-2 rounded ${
              category === 'special-occasions' ? 'bg-pink-500 text-white' : 'bg-gray-200'
            }`}
          >
            Special Occasions
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4">
              {category 
                ? `No products found in ${getCategoryName(category)} category` 
                : "No products available"}
            </p>
            {category && (
              <Link 
                href="/products" 
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
              >
                View All Products
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white shadow rounded-2xl overflow-hidden hover:shadow-lg transition"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="relative w-full h-56">
                    <Image
                      src={product.images[0] || "/placeholder-product.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                      {getCategoryName(product.category)}
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{product.name}</h2>
                  <p className="text-gray-600">₹{product.price}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <Link
                    href={`/product/${product.id}`}
                    className="mt-3 inline-block px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}