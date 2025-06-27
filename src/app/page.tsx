"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Gift, Heart, Check, Sparkles, Award, Shield, ChevronRight, Clock, Truck, Smile } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  material?: string;
  rating?: number;
}

export default function Home() {
  const { cartItems, totalPrice, addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products?featured=true');
        const data = await response.json();
        setFeaturedProducts(data);
      } catch (error) {
        console.error("Error fetching featured products:", error);
        setFeaturedProducts(products.slice(0, 8) as unknown as Product[]);
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
        name: "Memorahh",
        description: "Unique handcrafted gifts",
        image: "/logo.png",
        handler: function (response: any) {
          alert("Payment successful!");
          console.log(response);
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

  const formatPrice = (price: number) => {
    return isNaN(price) ? "0.00" : price.toFixed(2);
  };

  const filteredProducts = activeTab === "all" 
    ? featuredProducts 
    : featuredProducts.filter(product => product.category === activeTab);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#996fd6] via-[#c4a8ff] to-[#d0c9ea] py-32 text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 animate-float">
          <Gift className="w-12 h-12 text-pink-200" />
        </div>
        <div className="absolute bottom-16 right-16 animate-float-delay">
          <Heart className="w-10 h-10 text-red-200" />
        </div>
        <div className="absolute top-1/3 right-24 animate-float-delay-2">
          <Star className="w-8 h-8 text-yellow-200" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
              Thoughtful Gifts,
            </span>
            <br />
            <span className="text-white">Endless Smiles</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in-delay">
            Handcrafted polaroids, metal art, 3D miniatures and personalized gifts that tell your story
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-delay">
            <Link
              href="/products"
              className="px-8 py-4 bg-white text-[#996fd6] rounded-full font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
            >
              Shop Collection
            </Link>
            <Link
              href="/custom"
              className="px-8 py-4 border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-[#996fd6] transition transform hover:scale-105"
            >
              Customize Yours
            </Link>
          </div>
        </div>
      </section>
 {/* Trust Badges */}
      <div className="bg-white py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Truck className="w-8 h-8 mx-auto" />, text: "Free Shipping Over ₹999" },
              { icon: <Clock className="w-8 h-8 mx-auto" />, text: "Same Day Dispatch" },
              { icon: <Shield className="w-8 h-8 mx-auto" />, text: "Secure Payments" },
              { icon: <Smile className="w-8 h-8 mx-auto" />, text: "5000+ Happy Customers" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 justify-center p-2">
                <div className="text-[#996fd6]">{item.icon}</div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


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
          className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center transform hover:-translate-y-2 border border-[#d0c9ea]"
        >
          <div className="text-[#996fd6] flex justify-center">
            {category.icon}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">{category.name}</h3>
          <p className="text-gray-600">{category.description}</p>
        </Link>
      ))}
    </div>
  </div>
</section>

{/* Featured Products */}
<section className="py-16 px-4 bg-white">
  <div className="max-w-6xl mx-auto">
    <div className="flex justify-between items-center mb-12">
      <h2 className="text-3xl font-bold text-gray-800">Featured Gifts</h2>
      <Link
        href="/products"
        className="text-[#996fd6] hover:text-[#7d5cb3] font-medium"
      >
        View All Products →
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {(featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4)).map((product) => (
        <div
          key={product.id}
          className="group relative bg-white rounded-xl overflow-hidden hover:shadow-md transition transform hover:-translate-y-2 border border-[#d0c9ea]"
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
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Gift className="w-12 h-12 text-[#996fd6]" />
              </div>
            )}
            <button
              onClick={() => addToCart(product)}
              className="absolute bottom-4 right-4 bg-[#996fd6] text-white p-2 rounded-full hover:bg-[#7d5cb3] transition opacity-0 group-hover:opacity-100"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 text-gray-800">{product.name}</h3>
            <div className="flex justify-between items-center">
              <span className="text-[#996fd6] font-bold">
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

      {/* Personalized Gift Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition">
              <Image
                src="/custom-gift.jpg"
                alt="Customized gift example"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8">
                <h3 className="text-white text-2xl font-bold">Make It Personal</h3>
              </div>
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-6">Make It Uniquely Yours</h2>
            <p className="text-lg text-gray-600 mb-6">
              Our custom gifts let you add personal touches like names, special dates, 
              or custom artwork. Perfect for creating one-of-a-kind keepsakes.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Personalized polaroids with your photos",
                "Custom engraved metal art",
                "3D miniatures of your pet or home",
                "Acrylic frames with special messages",
                "Hand-doodled portraits from your photos"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <Sparkles className="w-5 h-5 text-[#996fd6] mr-2 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/custom"
              className="inline-flex items-center px-8 py-3 bg-[#996fd6] text-white rounded-full font-medium hover:bg-[#7d5cb3] transition shadow-lg transform hover:scale-105"
            >
              Design Your Gift <ChevronRight className="ml-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Memorahh Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Browse or Customize",
                description: "Explore our collections or create your own custom design",
                icon: <Sparkles className="w-8 h-8 text-[#996fd6]" />
              },
              {
                step: "2",
                title: "Place Your Order",
                description: "Add to cart and complete your secure checkout",
                icon: <ShoppingCart className="w-8 h-8 text-[#996fd6]" />
              },
              {
                step: "3",
                title: "Receive & Cherish",
                description: "Get your handcrafted memory delivered to your doorstep",
                icon: <Gift className="w-8 h-8 text-[#996fd6]" />
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition transform hover:-translate-y-1 text-center">
                <div className="w-16 h-16 bg-[#996fd6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <span className="text-[#996fd6] font-bold">STEP {item.step}</span>
                <h3 className="text-xl font-semibold my-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
     
      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Loved By Our Customers</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "The custom metal car I ordered was even better than I imagined! Perfect gift for my husband's anniversary.",
                author: "Priya M.",
                rating: 5,
                product: "Custom Metal Car"
              },
              {
                quote: "My polaroid collection looks amazing in the acrylic frames. The quality is outstanding!",
                author: "Rahul S.",
                rating: 5,
                product: "Acrylic Photo Frames"
              },
              {
                quote: "The 3D miniature of our home brought tears to my parents' eyes. Worth every penny!",
                author: "Ananya P.",
                rating: 5,
                product: "3D Home Miniature"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200 transform hover:-translate-y-1 transition">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium">- {testimonial.author}</span>
                  <span className="text-sm text-gray-500">{testimonial.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-12 px-4 bg-pink-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">#MemorahhMoments</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8">
            See how our customers are enjoying their Memorahh creations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="aspect-square relative group overflow-hidden rounded-lg">
                <Image
                  src={`/instagram/ig-${index + 1}.jpg`}
                  alt="Customer photo"
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="text-white text-lg font-medium">View Post</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a
              href="https://instagram.com/memorahh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-[#996fd6] text-[#996fd6] rounded-full font-medium hover:bg-[#996fd6]/10 transition transform hover:scale-105"
            >
              Follow Us @memorahh
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#996fd6] to-[#c4a8ff] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Lasting Memories?</h2>
          <p className="text-xl mb-8">
            Join thousands of happy customers who found their perfect keepsakes with us.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/products"
              className="px-8 py-3 bg-white text-[#996fd6] rounded-full font-medium hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </Link>
            <Link
              href="/custom"
              className="px-8 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition transform hover:scale-105"
            >
              Start Customizing
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating Cart Button (Mobile) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <button
            onClick={handleCheckout}
            className="bg-[#996fd6] text-white p-4 rounded-full shadow-lg hover:bg-[#7d5cb3] transition transform hover:scale-110 flex items-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-medium">₹{formatPrice(totalPrice)}</span>
          </button>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float 6s ease-in-out infinite 2s; }
        .animate-float-delay-2 { animation: float 6s ease-in-out infinite 4s; }
        .animate-fade-in { animation: fadeIn 1s ease-out; }
        .animate-fade-in-delay { animation: fadeIn 1s ease-out 0.5s forwards; opacity: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}