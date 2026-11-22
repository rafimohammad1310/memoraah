"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Gift, Heart, Check, Sparkles, Shield, ChevronRight, Clock, Truck, Smile, Instagram, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import { useSiteSettings } from "@/lib/useSiteSettings";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  material?: string;
  rating?: number;
  featured: boolean;
  stock?: number;
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  handler: (response: { razorpay_payment_id?: string }) => void;
  theme: { color: string };
};

const PLACEHOLDER_IMAGES = {
  CATEGORY_HIM: "/image1.png",
  CATEGORY_HER: "/image2.png",
  CATEGORY_KIDS: "/bgwpolraids.png",
  CATEGORY_OCCASIONS: "/about-image.png",
  CUSTOM_GIFT: "/image2.png",
  CUSTOMER_1: "/team1.jpeg",
  CUSTOMER_2: "/team11.jpeg",
  CUSTOMER_3: "/team21.jpeg",
  INSTAGRAM: "/image1.png",
  VIDEO_POSTER: "/about-image.png",
  HERO_1: "/bgwpolraids.png",
  HERO_2: "/bgwpolraids.png",
  HERO_3: "/bgwpolraids.png",
  HERO_4: "/bgwpolraids.png",
};

export default function Home() {
  const { cartItems, totalPrice, addToCart } = useCart();
  const siteSettings = useSiteSettings();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [inViewSections, setInViewSections] = useState<Record<string, boolean>>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const heroSliderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trustBadgesRef = useRef<HTMLDivElement>(null);

  const configuredHeroImages = siteSettings.heroImages.filter(Boolean);
  const heroImages = configuredHeroImages.length ? configuredHeroImages : [PLACEHOLDER_IMAGES.HERO_1];

  // Auto-scroll hero slider with different buttons for each slide
  useEffect(() => {
    heroSliderRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length);
    }, 5000);

    return () => {
      if (heroSliderRef.current) {
        clearInterval(heroSliderRef.current);
      }
    };
  }, [heroImages.length]);

  // Infinite marquee for trust badges
  useEffect(() => {
    const trustBadges = trustBadgesRef.current;
    if (!trustBadges) return;

    const content = trustBadges.firstElementChild;
    if (!content) return;

    const clone = content.cloneNode(true);
    trustBadges.appendChild(clone);

    const animation = trustBadges.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-50%)' }
      ],
      {
        duration: 20000,
        iterations: Infinity
      }
    );

    return () => {
      animation.cancel();
      trustBadges.removeChild(clone);
    };
  }, []);

  // Custom intersection observer implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setInViewSections(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
  const fetchFeatured = async () => {
    try {
      setLoading(true);

      // Fetch featured first
      const res = await fetch('/api/products?featured=true');
      const featured = await res.json();

      setBestSellers(featured.slice(0, 4));
    } catch (err) {
      console.error("Error loading featured products:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchFeatured();
}, []);


  const handleCheckout = () => {
    if (window.Razorpay) {
      const options: RazorpayOptions = {
        key: "rzp_test_FOAiHIpRFqmi6t",
        amount: totalPrice * 100,
        currency: "INR",
        name: "Memorahh",
        description: "Unique handcrafted gifts",
        image: "/logo.png",
        handler: function (response) {
          alert("Payment successful!");
          console.log(response);
        },
        theme: {
          color: "#FF5733",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } else {
      console.error("Razorpay SDK not loaded");
      alert("Payment gateway not available. Please try again later.");
    }
  };

  const formatPrice = (price: number) => {
    return isNaN(price) ? "0.00" : price.toFixed(2);
  };

  const isInView = (sectionId: string) => inViewSections[sectionId] || false;

  return (
    <main className="storefront min-h-screen bg-gray-50">
      <Navbar />

      {/* 1. Hero Banner with Carousel */}
      <section 
        id="hero"
        ref={el => { sectionRefs.current['hero'] = el; }}
        className="relative flex min-h-[600px] h-[calc(100svh-72px)] max-h-[900px] items-center justify-center overflow-hidden text-center text-white"
      >
        {/* Carousel Background */}
    <div className="absolute inset-0 overflow-hidden">
  {heroImages.map((image, index) => (
    <div 
      key={index}
      className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
    >
      <Image
        src={image}
        alt={`Hero Slide ${index + 1}`}
        fill
        className="object-cover"
        priority={index === 0}
      />
      <div className="absolute inset-0 bg-black/35" />
    </div>
  ))}
</div>
{/* Hero Section Container */}
<div className="relative z-[1] flex w-full max-w-7xl flex-col items-center justify-center px-6 py-16 text-center md:flex-row md:items-center md:justify-start md:px-16 md:py-20 md:text-left lg:px-24">
{/* Floating decorative elements */} 
<div className={`absolute top-2 -left-10 md:top-3 md:-left-20 lg:top-4 lg:-left-24 animate-float transition-transform duration-1000 ${isInView('hero') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
  <Gift className="w-16 h-16 text-pink-200 drop-shadow-lg" />
</div>



<div className={`absolute bottom-16 right-16 animate-float-delay transition-transform duration-1000 ${isInView('hero') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
  <Heart className="w-14 h-14 text-red-200 drop-shadow-lg" />
</div>

<div className={`absolute top-6 right-4 md:top-12 md:right-8 animate-float-delay-2 transition-transform duration-1000 ${isInView('hero') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
  <Star className="w-12 h-12 text-yellow-200 drop-shadow-lg" />
</div>

  {/* Left: Text Section */}
{/* Left: Text Section */}
<div className="z-10 flex w-full flex-col items-center justify-center text-center md:w-1/2 md:items-start md:text-left">
  <h1 
    className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 transition-all duration-1000 ${isInView('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
  >
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
      {siteSettings.heroTitle.split(",")[0]}{siteSettings.heroTitle.includes(",") ? "," : ""}
    </span>
    <br />
    <span className="text-white">{siteSettings.heroTitle.split(",")[1]?.trim() || ""}</span>
  </h1>

  <p 
    className={`text-xl md:text-2xl mb-8 transition-all duration-1000 delay-150 ${isInView('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
  >
    {siteSettings.heroSubtitle}

  </p>

  {/* Buttons */}
  <div className={`transition-all duration-1000 delay-300 ${isInView('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
    {currentSlide === 2 ? (
      <Link
        href="/custom"
        className="px-8 py-4 border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-[#996fd6] transition-all transform hover:scale-105 hover:shadow-xl active:scale-95"
      >
        Customize Yours
      </Link>
    ) : (
      <Link
        href="/products"
        className="px-8 py-4 bg-white text-[#996fd6] rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
      >
        Shop Collection
      </Link>
    )}
  </div>
</div>


</div>


        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                if (heroSliderRef.current) {
                  clearInterval(heroSliderRef.current);
                }
                heroSliderRef.current = setInterval(() => {
                  setCurrentSlide(prev => (prev + 1) % heroImages.length);
                }, 5000);
              }}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

     {/* Trust Badges with marquee effect (right to left) - Fixed Version */}
<div 
  className="bg-white py-6 shadow-sm sticky top-0 z-40 transition-all duration-3000 overflow-hidden"
  style={{ top: isScrolled ? '10' : '10px' }}
>
  {/* Static background container */}
  <div className="relative h-full w-full">
    {/* Scrolling content */}
    <div 
      ref={trustBadgesRef}
      className="absolute top-0 left-0 w-[150%] h-full flex items-center animate-marquee whitespace-nowrap"
    >
      {[...Array(2)].map((_, iteration) => (
        <div key={iteration} className="flex items-center">
          {[
            { icon: <Truck className="w-6 h-6 mr-2 text-[#996fd6]" />, text: "Free Shipping Over ₹999" },
            { icon: <Clock className="w-6 h-6 mr-2 text-[#996fd6]" />, text: "Same Day Dispatch" },
            { icon: <Shield className="w-6 h-6 mr-2 text-[#996fd6]" />, text: "Secure Payments" },
            { icon: <Smile className="w-6 h-6 mr-2 text-[#996fd6]" />, text: "5000+ Happy Customers" }
          ].map((badge, i) => (
            <div key={`${iteration}-${i}`} className="flex items-center mx-8">
              {badge.icon}
              <span className="text-sm font-medium">
                {badge.text}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
</div>

      {/* 2. Best Sellers Section */}
      <section 
        id="best-sellers"
        ref={el => { sectionRefs.current['best-sellers'] = el; }}
        className="py-16 px-4 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#996fd6] rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#c4a8ff] rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-[#996fd6]/10 text-[#996fd6] rounded-full mb-4">
              Most Loved
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Best Sellers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Featured products loved by our customers
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#996fd6]"></div>
            </div>
          ) : (
            <>
              {/* Mobile View (2 columns) */}
              <div className="md:hidden grid grid-cols-2 gap-4 transition-opacity duration-1000">
                {bestSellers.map((product) => (
                  <div
                    key={product.id}
                    className="group relative bg-white rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-200"
                  >
                    <div className="relative aspect-square">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          onError={(event) => { event.currentTarget.src = "/image1.png"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Gift className="w-8 h-8 text-[#996fd6]" />
                        </div>
                      )}
                      {product.featured && (
                        <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                          <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                          Best
                        </div>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        className="absolute bottom-2 right-2 bg-[#996fd6] text-white p-2 rounded-full hover:bg-[#7d5cb3] transition-all shadow-md"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-1 text-gray-800 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[#996fd6] text-sm font-bold">
                          ₹{formatPrice(product.price)}
                        </span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="ml-0.5 text-gray-500 text-xs">
                            {product.rating?.toFixed(1) || '4.8'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View (4 columns) */}
              <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 transition-opacity duration-1000">
                {bestSellers.map((product, index) => (
                  <div
                    key={product.id}
                    className={`group relative bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 ${isInView('best-sellers') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="relative aspect-square">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(event) => { event.currentTarget.src = "/image1.png"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Gift className="w-12 h-12 text-[#996fd6]" />
                        </div>
                      )}
                      {product.featured && (
                        <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Best Seller
                        </div>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        className="absolute bottom-4 right-4 bg-[#996fd6] text-white p-3 rounded-full hover:bg-[#7d5cb3] transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-[#996fd6] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[#996fd6] font-bold">
                          ₹{formatPrice(product.price)}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < (product.rating || 4.8) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-1 text-gray-500 text-sm">
                            ({Math.floor(Math.random() * 100) + 50})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`text-center mt-12 transition-opacity duration-1000 delay-300 ${isInView('best-sellers') ? 'opacity-100' : 'opacity-0'}`}>
                <Link
                  href="/products?featured=true"
                  className="inline-flex items-center px-6 py-3 bg-[#996fd6] text-white rounded-full font-medium hover:bg-[#7d5cb3] transition-all transform hover:scale-105 shadow-lg hover:shadow-[#996fd6]/30"
                >
                  View All Featured Products <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. Find the Perfect Gift (Categories) */}
      <section 
        id="categories"
        ref={el => { sectionRefs.current['categories'] = el; }}
        className="py-16 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-12 transition-opacity duration-1000 ${isInView('categories') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find the Perfect Gift
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Carefully curated collections for every occasion
            </p>
          </div>
          
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-1000 ${isInView('categories') ? 'opacity-100' : 'opacity-0'}`}>
            {[
              {
                id: "for-him",
                name: "For Him",
                description: "Thoughtful gifts for men",
                image: siteSettings.categoryImages?.[0] || PLACEHOLDER_IMAGES.CATEGORY_HIM,
                color: "from-blue-500 to-blue-600"
              },
              {
                id: "for-her",
                name: "For Her",
                description: "Beautiful presents for women",
                image: siteSettings.categoryImages?.[1] || PLACEHOLDER_IMAGES.CATEGORY_HER,
                color: "from-pink-500 to-pink-600"
              },
              {
                id: "for-kids",
                name: "For Kids",
                description: "Fun and playful items",
                image: siteSettings.categoryImages?.[2] || PLACEHOLDER_IMAGES.CATEGORY_KIDS,
                color: "from-purple-500 to-purple-600"
              },
              {
                id: "special-occasions",
                name: "Special Occasions",
                description: "Perfect for celebrations",
                image: siteSettings.categoryImages?.[3] || PLACEHOLDER_IMAGES.CATEGORY_OCCASIONS,
                color: "from-yellow-500 to-yellow-600"
              },
            ].map((category, index) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className={`group relative h-64 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 ${isInView('categories') ? 'translate-y-0' : 'translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(event) => { event.currentTarget.src = "/image1.png"; }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-90`}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/90 mb-4">{category.description}</p>
                  <span className="text-white text-sm font-medium flex items-center">
                    Explore Now <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Customize Section */}
      <section 
        id="custom"
        ref={el => { sectionRefs.current['custom'] = el; }}
        className="py-16 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <div className={`relative rounded-2xl overflow-hidden shadow-xl transform transition-all duration-1000 ${isInView('custom') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Image
                src={siteSettings.customShowcaseImage || PLACEHOLDER_IMAGES.CUSTOM_GIFT}
                alt="Customized gift example"
                width={600}
                height={600}
                className="w-full h-auto object-cover"
                onError={(event) => { event.currentTarget.src = "/image2.png"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-white text-2xl font-bold mb-2">Make It Personal</h3>
                  <p className="text-white/90">Custom engraved metal art with your special message</p>
                </div>
              </div>
            </div>
          </div>
          <div className={`md:w-1/2 transition-opacity duration-1000 ${isInView('custom') ? 'opacity-100' : 'opacity-0'}`}>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-[#996fd6]/10 text-[#996fd6] rounded-full mb-4">
              Personalization
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Make It Uniquely Yours</h2>
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
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/custom"
              className="inline-flex items-center px-8 py-3 bg-[#996fd6] text-white rounded-full font-bold hover:bg-[#7d5cb3] transition-all transform hover:scale-105 shadow-lg hover:shadow-[#996fd6]/30"
            >
              Design Your Gift <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section 
        id="how-it-works"
        ref={el => { sectionRefs.current['how-it-works'] = el; }}
        className="py-16 px-4 bg-gray-50 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#996fd6] rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#c4a8ff] rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Memorahh Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to create and receive your perfect gift
            </p>
          </div>

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
              <div 
                key={index} 
                className={`bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 transform hover:-translate-y-2 text-center border border-gray-100 ${isInView('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="w-16 h-16 bg-[#996fd6]/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 bg-[#996fd6] text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold my-3 text-gray-800">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Story Section */}
      <section 
        id="story"
        ref={el => { sectionRefs.current['story'] = el; }}
        className="py-16 px-4 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className={`transition-opacity duration-1000 ${isInView('story') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              The Memorahh Story
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {siteSettings.aboutText}
            </p>
            <div className="space-y-4">
              {[
                "15,000+ gifts delivered",
                "4.9/5 average customer rating",
                "Handcrafted in our Mumbai studio",
                "Eco-friendly materials"
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-[#996fd6] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={`relative rounded-2xl overflow-hidden shadow-xl aspect-video transition-all duration-1000 ${isInView('story') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Image src={siteSettings.craftingImage || "/about-image.png"} alt="Our Crafting Process" fill className="object-cover" onError={(event) => { event.currentTarget.src = "/about-image.png"; }} />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-6 sm:p-8">
              <div><h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">Our Crafting Process</h3><p className="text-white/90">Each gift is carefully handcrafted with attention to detail</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section 
        id="testimonials"
        ref={el => { sectionRefs.current['testimonials'] = el; }}
        className="py-16 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-12 transition-opacity duration-1000 ${isInView('testimonials') ? 'opacity-100' : 'opacity-0'}`}>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-[#996fd6]/10 text-[#996fd6] rounded-full mb-4">
              Customer Love
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don&apos;t just take our word for it
            </p>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-1000 ${isInView('testimonials') ? 'opacity-100' : 'opacity-0'}`}>
            {[
              {
                quote: "The custom metal car I ordered was even better than I imagined! Perfect gift for my husband's anniversary.",
                author: "Priya M.",
                rating: 5,
                product: "Custom Metal Car",
                image: siteSettings.testimonialImages[0] || PLACEHOLDER_IMAGES.CUSTOMER_1
              },
              {
                quote: "My polaroid collection looks amazing in the acrylic frames. The quality is outstanding!",
                author: "Rahul S.",
                rating: 5,
                product: "Acrylic Photo Frames",
                image: siteSettings.testimonialImages[1] || PLACEHOLDER_IMAGES.CUSTOMER_2
              },
              {
                quote: "The 3D miniature of our home brought tears to my parents' eyes. Worth every penny!",
                author: "Ananya P.",
                rating: 5,
                product: "3D Home Miniature",
                image: siteSettings.testimonialImages[2] || PLACEHOLDER_IMAGES.CUSTOMER_3
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className={`bg-gray-50 p-6 rounded-xl border border-gray-200 transform hover:-translate-y-2 transition-all duration-300 ${isInView('testimonials') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 bg-gray-200 flex items-center justify-center">
                    {testimonial.image ? (
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <Smile className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.author}</h4>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="text-sm text-gray-500">
                  Purchased: {testimonial.product}
                </div>
              </div>
            ))}
          </div>

          <div className={`text-center mt-12 transition-opacity duration-1000 delay-300 ${isInView('testimonials') ? 'opacity-100' : 'opacity-0'}`}>
            <Link
              href="/testimonials"
              className="inline-flex items-center text-[#996fd6] font-medium hover:text-[#7d5cb3]"
            >
              Read more testimonials <ChevronRight className="ml-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Instagram Feed */}
      <section 
        id="instagram"
        ref={el => { sectionRefs.current['instagram'] = el; }}
        className="py-12 px-4 bg-pink-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white px-4 py-2 rounded-full mb-4">
              <Instagram className="w-5 h-5 mr-2" />
              <span>Follow Us</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">#MemorahhMoments</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how our customers are enjoying their Memorahh creations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {[...Array(6)].map((_, index) => (
              <div 
                key={index} 
                className="aspect-square relative group overflow-hidden rounded-lg transform hover:scale-[1.02] transition-all duration-500"
              >
                <Image src={siteSettings.instagramImages[index] || PLACEHOLDER_IMAGES.INSTAGRAM} alt={`Store gallery image ${index + 1}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" onError={(event) => { event.currentTarget.src = "/image1.png"; }} />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <a
              href="https://instagram.com/memorahh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-[#996fd6] text-[#996fd6] rounded-full font-medium hover:bg-[#996fd6]/10 transition-all transform hover:scale-105"
            >
              Follow Us @memorahh
            </a>
          </div>
        </div>
      </section>

      {/* 9. CTA Section */}
      <section 
        id="cta"
        ref={el => { sectionRefs.current['cta'] = el; }}
        className="py-16 px-4 bg-gradient-to-r from-[#996fd6] to-[#c4a8ff] text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Lasting Memories?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of happy customers who found their perfect keepsakes with us.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/products"
              className="px-8 py-3 bg-white text-[#996fd6] rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Shop Now
            </Link>
            <Link
              href="/custom"
              className="px-8 py-3 border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition-all transform hover:scale-105"
            >
              Start Customizing
            </Link>
          </div>
        </div>
      </section>

      {/* Only one Footer */}
     

      {/* Floating Cart Button (Mobile) */}
      {cartItems.length > 0 && (
        <div className={`fixed bottom-6 right-6 md:hidden z-50 transition-transform duration-300 ${isScrolled ? 'translate-y-0' : 'translate-y-20'}`}>
          <button
            onClick={handleCheckout}
            className="bg-[#996fd6] text-white p-4 rounded-full shadow-xl hover:bg-[#7d5cb3] transition-all transform hover:scale-110 flex items-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-medium">₹{formatPrice(totalPrice)}</span>
            <span className="absolute -top-2 -right-2 bg-white text-[#996fd6] w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
              {cartItems.length}
            </span>
          </button>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    animation: marquee 20s linear infinite;
  }
`}</style>
    </main>
  );
}
