// components/ProductCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiShoppingCart, FiHeart, FiStar, FiEye } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  description?: string;
  rating?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToCart = () => {
    // In a real app, you would use a state management solution
    // or context API to manage the cart globally
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.name} added to cart`);
    // Dispatch event to update cart count in navbar
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted 
        ? `Removed from wishlist` 
        : `Added to wishlist`
    );
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square">
        <Image
          src={product.images[0] || "/placeholder-product.jpg"}
          alt={product.name}
          fill
          className="object-cover transition-opacity duration-300"
          style={{ opacity: isHovered ? 0.9 : 1 }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Quick actions overlay */}
        <div className={`absolute inset-0 flex items-center justify-center gap-2 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isHovered ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <button 
            onClick={addToCart}
            className="p-3 bg-white rounded-full shadow-md hover:bg-pink-50 hover:text-pink-500 transition-colors"
            aria-label="Add to cart"
          >
            <FiShoppingCart className="w-5 h-5" />
          </button>
          <Link
            href={`/product/${product.id}`}
            className="p-3 bg-white rounded-full shadow-md hover:bg-pink-50 hover:text-pink-500 transition-colors"
            aria-label="View details"
          >
            <FiEye className="w-5 h-5" />
          </Link>
        </div>
        
        {/* Wishlist button */}
        <button 
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isWishlisted ? 'text-pink-500 bg-pink-50' : 'text-gray-400 bg-white'}`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FiHeart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        
        {/* Category badge */}
        <span className="absolute bottom-3 left-3 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
          {product.category.replace("-", " ")}
        </span>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <h2 className="font-medium text-gray-900 line-clamp-1">
            {product.name}
          </h2>
          <span className="font-medium text-gray-900 whitespace-nowrap">
            ${product.price.toFixed(2)}
          </span>
        </div>
        
        {product.rating && (
          <div className="flex items-center mt-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FiStar 
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
          </div>
        )}
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={addToCart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition text-sm"
          >
            <FiShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}