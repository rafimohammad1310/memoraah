// components/Navbar.tsx
"use client";

import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { cartItems } = useCart();
  const router = useRouter();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo linking to Home */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png" // Your logo path
            alt="Gift Store Logo"
            width={40}
            height={40}
            className="mr-2"
          />
          <span className="text-xl font-bold text-pink-600">My Gift Store</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/products" className="hover:text-pink-600">
            Products
          </Link>
          <Link href="/about" className="hover:text-pink-600">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-pink-600">
            Contact Us
          </Link>
          
          {/* Cart Icon */}
          <button
            onClick={() => router.push("/cart")}
            className="relative ml-4"
          >
            <ShoppingCart className="w-6 h-6 text-pink-500" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => router.push("/cart")}
            className="relative mr-4"
          >
            <ShoppingCart className="w-6 h-6 text-pink-500" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            className="text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white px-4 pb-4 space-y-2">
          <Link 
            href="/products" 
            className="block hover:text-pink-600"
            onClick={() => setIsOpen(false)}
          >
            Products
          </Link>
          <Link 
            href="/about" 
            className="block hover:text-pink-600"
            onClick={() => setIsOpen(false)}
          >
            About Us
          </Link>
          <Link 
            href="/contact" 
            className="block hover:text-pink-600"
            onClick={() => setIsOpen(false)}
          >
            Contact Us
          </Link>
        </div>
      )}
    </nav>
  );
}