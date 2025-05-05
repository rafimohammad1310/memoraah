// src/context/CartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { products } from "@/data/products";

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: { id: number; quantity: number }[];
  cartItems: CartItem[];
  totalPrice: number;
  addToCart: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<{ id: number; quantity: number }[]>([]);

  // Initialize cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch (error) {
        console.error("Failed to parse cart data", error);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
  }, [cart]);

  // Memoized cart items calculation
  const cartItems = useMemo(() => {
    return cart.map((item) => {
      const product = products.find((p) => p.id === item.id);
      return product 
        ? { ...product, quantity: item.quantity }
        : {
            id: item.id,
            name: "Unknown Product",
            price: 0,
            images: [],
            quantity: item.quantity
          };
    });
  }, [cart]);

  // Memoized total price calculation
  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Stable callback for adding to cart
  const addToCart = useCallback((productId: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      return existingItem
        ? prevCart.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prevCart, { id: productId, quantity: 1 }];
    });
  }, []);

  // Stable callback for removing from cart
  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  // Stable callback for clearing cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    cart,
    cartItems,
    totalPrice,
    addToCart,
    removeFromCart,
    clearCart,
  }), [cart, cartItems, totalPrice, addToCart, removeFromCart, clearCart]);

  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}