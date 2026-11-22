// src/context/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useUser } from "./UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Product type
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  isCustom?: boolean;
  customOptions?: Record<string, string>;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: { id: string; quantity: number }[];
  cartItems: CartItem[];
  totalPrice: number;
  itemCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: userLoading } = useUser();
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});
  const [cartReady, setCartReady] = useState(false);

  // Keep guest and account carts separate. Merge the guest cart once on sign-in.
  useEffect(() => {
    if (userLoading) return;
    try {
      const key = user?.uid ? `cart:${user.uid}` : "cart";
      const raw = localStorage.getItem(key);
      const stored = raw ? JSON.parse(raw) : [];
      const accountCart = Array.isArray(profile?.cart) ? profile.cart : [];
      const base = user?.uid ? (raw !== null ? stored : accountCart) : stored;
      const guest = user?.uid ? JSON.parse(localStorage.getItem("cart") || "[]") : [];
      const merged = new Map<string, { id: string; quantity: number }>();
      for (const item of [...(Array.isArray(base) ? base : []), ...(Array.isArray(guest) ? guest : [])]) {
        if (item?.id && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0) {
          const previous = merged.get(item.id);
          merged.set(item.id, { id: item.id, quantity: (previous?.quantity || 0) + Number(item.quantity) });
        }
      }
      setCart([...merged.values()]);
      try {
        const storedCache = localStorage.getItem("productCache");
        const parsed = storedCache ? JSON.parse(storedCache) : {};
        setProductCache(parsed);
      } catch (error) {
        console.error("Failed to load product cache", error);
      }
      if (user?.uid) localStorage.removeItem("cart");
    } catch (error) {
      console.error("Failed to load cart", error);
      setCart([]);
    }
    setCartReady(true);
  }, [userLoading, user?.uid, profile]);

  // ✅ Save cart to localStorage on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!cartReady || userLoading) return;
      const key = user?.uid ? `cart:${user.uid}` : "cart";
      if (cart.length) localStorage.setItem(key, JSON.stringify(cart));
      else localStorage.removeItem(key);
    }, 300); // debounce by 300ms

    return () => clearTimeout(timeout);
  }, [cart, cartReady, userLoading, user?.uid]);

  // ✅ Save productCache to localStorage
  useEffect(() => {
    if (Object.keys(productCache).length > 0) {
      localStorage.setItem("productCache", JSON.stringify(productCache));
    }
  }, [productCache]);

  // ✅ Sync with Firestore (debounced)
  useEffect(() => {
    if (!user?.uid || !cartReady || userLoading) return;

    const timeout = setTimeout(async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          cart: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        });
      } catch (error) {
        console.error("Error syncing cart to Firestore:", error);
      }
    }, 800); // debounce by 800ms to reduce write frequency

    return () => clearTimeout(timeout);
  }, [cart, user?.uid, cartReady, userLoading]);

  useEffect(() => {
    const missingIds = cart.map((item) => item.id).filter((id) => !productCache[id]);
    if (!cartReady || missingIds.length === 0) return;
    let active = true;
    Promise.all(missingIds.map(async (id) => {
      const response = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
      if (!response.ok) return null;
      return await response.json() as Product;
    }))
      .then((products) => {
        if (!active) return;
        setProductCache((previous) => ({
          ...previous,
          ...Object.fromEntries(products.filter((product): product is Product => Boolean(product)).map((product) => [product.id, product])),
        }));
      })
      .catch((error) => console.error("Failed to restore cart products", error));
    return () => { active = false; };
  }, [cart, cartReady, productCache]);

  // ✅ Derive cartItems
  const cartItems = useMemo(() => {
    return cart.map(item => {
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

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const addToCart = useCallback((product: Product) => {
    setProductCache(prev => ({
      ...prev,
      [product.id]: product,
    }));

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      return existing
        ? prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { id: product.id, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const contextValue = useMemo(() => ({
    cart,
    cartItems,
    totalPrice,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }), [cart, cartItems, totalPrice, itemCount, addToCart, removeFromCart, updateQuantity, clearCart]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
