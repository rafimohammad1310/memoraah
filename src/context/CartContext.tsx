// src/context/CartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

// Updated interface to match your products page
interface Product {
  id: string; // Changed from number to string to match your products page
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: { id: string; quantity: number }[]; // Changed from number to string
  cartItems: CartItem[];
  totalPrice: number;
  itemCount: number; // Added to track total items in cart
  addToCart: (product: Product) => void; // Changed to accept full product
  removeFromCart: (productId: string) => void; // Changed from number to string
  updateQuantity: (productId: string, quantity: number) => void; // Added for adjusting quantities
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
  // Products will be stored in cart items
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  // Initialize cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      const savedProducts = localStorage.getItem("productCache");
      
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
      
      if (savedProducts) {
        try {
          const parsedProducts = JSON.parse(savedProducts);
          setProductCache(parsedProducts);
        } catch (error) {
          console.error("Failed to parse product cache", error);
          localStorage.removeItem("productCache");
        }
      }
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(cart));
      } else {
        localStorage.removeItem("cart");
      }
    }
  }, [cart]);

  // Persist product cache to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(productCache).length > 0) {
      localStorage.setItem("productCache", JSON.stringify(productCache));
    }
  }, [productCache]);

  // Memoized cart items calculation
  const cartItems = useMemo(() => {
    return cart.map((item) => {
      const product = productCache[item.id];
      return product
        ? { ...product, quantity: item.quantity }
        : {
            id: item.id,
            name: "Unknown Product",
            price: 0,
            images: [],
            description: "",
            category: "",
            quantity: item.quantity,
          };
    });
  }, [cart, productCache]);

  // Memoized total price calculation
  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  // Memoized total item count
  const itemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Updated to accept full product object
  const addToCart = useCallback((product: Product) => {
    // Store product in cache
    setProductCache((prev) => ({
      ...prev,
      [product.id]: product,
    }));

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      return existingItem
        ? prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prevCart, { id: product.id, quantity: 1 }];
    });
  }, []);

  // Updated to use string ID
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  // New function to update quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      cart,
      cartItems,
      totalPrice,
      itemCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [cart, cartItems, totalPrice, itemCount, addToCart, removeFromCart, updateQuantity, clearCart]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}