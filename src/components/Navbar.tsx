// components/Navbar.tsx
"use client";

import { useState } from "react";
import { Menu, X, ShoppingCart, User, LogIn, LogOut, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { cartItems } = useCart();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  
  // This would come from your auth context/provider
  const handleLogout = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-pink-500"
          >
            <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
            <path d="M16.5 9.4 7.55 4.24" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
            <circle cx="18.5" cy="15.5" r="2.5" />
            <path d="M20.27 17.27 22 19" />
          </svg>
          <span className="font-bold text-xl">MEMORAAH</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
        <Link href="/" className="hover:text-pink-600">
            Home
          </Link>
          <Link href="/products" className="hover:text-pink-600">
            Products
          </Link>
          <Link href="/about" className="hover:text-pink-600">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-pink-600">
            Contact Us
          </Link>
          
          {/* Profile Button */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="text-gray-700 hover:text-pink-600 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200"
            >
              <User className="w-5 h-5" />
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {user ? (  // Changed from isLoggedIn to user
                  <>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </Link>
                    <Link 
                      href="/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Orders
                    </Link>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
          
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
          {/* Mobile Profile Icon */}
          <div className="relative mr-4">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="text-gray-700 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200"
            >
              <User className="w-5 h-5" />
            </button>
            
            {/* Mobile Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {user ? (  // Changed from isLoggedIn to user
                  <>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </Link>
                    <Link 
                      href="/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Orders
                    </Link>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Cart Icon */}
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
          
          {/* Hamburger Menu */}
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