// src/app/product/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { products } from "@/data/products";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function ProductDetail() {
  const params = useParams();
  const { addToCart } = useCart();
  const product = products.find((p) => p.id === Number(params.id));

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4">
        <h1 className="text-2xl font-bold">Product Details</h1>
      </nav>

      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8 bg-white rounded-lg shadow-md p-6">
          <div className="md:w-1/2">
            <div className="relative w-full h-96">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div className="flex gap-2 mt-4">
              {product.images.map((image, index) => (
                <div key={index} className="relative w-16 h-16">
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover rounded border"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl text-pink-500 mt-2">₹{product.price}</p>
            
            <div className="mt-6 space-y-4">
              <button
                onClick={() => addToCart(product.id)}
                className="w-full px-6 py-3 bg-pink-500 text-white rounded hover:bg-pink-600"
              >
                Add to Cart
              </button>
              <Link
                href="/cart"
                className="block w-full px-6 py-3 text-center bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}