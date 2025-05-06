"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Gift, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";
import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";

// Define proper interface for Product
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
}

export default function Home() {
  const { cartItems, totalPrice, addToCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products?featured=true');
        const data = await response.json();
        setFeaturedProducts(data);
      } catch (error) {
        console.error("Error fetching featured products:", error);
        // Fallback to static products if API fails
        setFeaturedProducts(products.slice(0, 4) as unknown as Product[]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);
  
  const handleCheckout = () => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      const options = {
        key: "rzp_test_FOAiHIpRFqmi6t",
        amount: totalPrice * 100,
        currency: "INR",
        name: "My Gift Store",
        description: "A few gifts for you",
        image: "/logo.png",
        handler: function (response: any) {
          alert("Payment successful!");
          console.log(response);
        },
        prefill: {
          name: "John Doe",
          email: "johndoe@example.com",
          contact: "9999999999",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#FF5733",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } else {
      console.error("Razorpay SDK not loaded");
      alert("Payment gateway not available. Please try again later.");
    }
  };

  // Function to safely format price
  const formatPrice = (price: number) => {
    return isNaN(price) ? "0.00" : price.toFixed(2);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Enhanced Navbar */}
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-pink-400 to-purple-500 py-24 text-center text-white">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Perfect Gifts for Every Occasion
          </h1>
          <p className="text-xl mb-8">
            Handpicked collections that bring smiles to your loved ones
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-white text-pink-600 rounded-full font-medium hover:bg-gray-100 transition"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Shop By Category
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: "for-him",
                name: "For Him",
                icon: <Gift className="w-8 h-8 mb-3" />,
                description: "Thoughtful gifts for men",
              },
              {
                id: "for-her",
                name: "For Her",
                icon: <Heart className="w-8 h-8 mb-3" />,
                description: "Beautiful presents for women",
              },
              {
                id: "for-kids",
                name: "For Kids",
                icon: <Star className="w-8 h-8 mb-3" />,
                description: "Fun and playful items",
              },
              {
                id: "special-occasions",
                name: "Special Occasions",
                icon: <Gift className="w-8 h-8 mb-3" />,
                description: "Perfect for celebrations",
              },
            ].map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center"
              >
                <div className="text-pink-500 flex justify-center">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-500">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Gifts</h2>
            <Link
              href="/products"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              View All Products →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Use featuredProducts from state if available, otherwise use the static products */}
            {(featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4)).map((product) => (
              <div
                key={product.id}
                className="group relative bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square relative">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Gift className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => addToCart(product)} // Pass the entire product object
                    className="absolute bottom-4 right-4 bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition opacity-0 group-hover:opacity-100"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-pink-600 font-bold">
                      ₹{formatPrice(product.price)}
                    </span>
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-gray-600 text-sm">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "The perfect gift for my wife's birthday. She absolutely loved it!",
                author: "Rahul Sharma",
              },
              {
                quote:
                  "Fast delivery and excellent quality. Will definitely shop again!",
                author: "Priya Patel",
              },
              {
                quote:
                  "Great customer service and unique gift options. Highly recommend!",
                author: "Amit Singh",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <div className="text-yellow-400 flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                <p className="font-medium">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find the Perfect Gift?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of happy customers who found their ideal presents with
            us.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/products"
              className="px-8 py-3 bg-white text-pink-600 rounded-full font-medium hover:bg-gray-100 transition"
            >
              Browse Collection
            </Link>
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className={`px-8 py-3 rounded-full font-medium transition ${
                cartItems.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-pink-700 hover:bg-pink-800"
              }`}
            >
              Checkout (₹{formatPrice(totalPrice)})
            </button>
          </div>
        </div>
      </section>

      {/* Floating Cart Button (Mobile) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <button
            onClick={handleCheckout}
            className="bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-700 transition"
          >
            <div className="flex items-center">
              <ShoppingCart className="w-6 h-6" />
              <span className="ml-2 font-medium">₹{formatPrice(totalPrice)}</span>
            </div>
          </button>
        </div>
      )}
    </main>
  );
}