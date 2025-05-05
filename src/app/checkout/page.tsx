"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiLoader, FiArrowRight, FiX, FiTag } from "react-icons/fi";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Promotion {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function CheckoutPage() {
  const { cartItems, totalPrice } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Preload Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyCoupon = async () => {
    try {
      setCouponError("");
      if (!couponCode) {
        throw new Error("Please enter a coupon code");
      }

      const querySnapshot = await getDocs(
        query(
          collection(db, "promotions"),
          where("code", "==", couponCode),
          where("isActive", "==", true)
        )
      );

      if (querySnapshot.empty) {
        throw new Error("Invalid or expired coupon code");
      }

      const promo = querySnapshot.docs[0].data() as Promotion;
      const currentDate = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);

      if (currentDate < startDate || currentDate > endDate) {
        throw new Error("This coupon is not valid at this time");
      }

      if (promo.minOrderAmount && totalPrice < promo.minOrderAmount) {
        throw new Error(`Minimum order amount of ₹${promo.minOrderAmount} required`);
      }

      setAppliedCoupon(promo);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Failed to apply coupon");
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    let discount = 0;
    if (appliedCoupon.discountType === "percentage") {
      discount = totalPrice * (appliedCoupon.discountValue / 100);
      if (appliedCoupon.maxDiscountAmount && discount > appliedCoupon.maxDiscountAmount) {
        discount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discount = appliedCoupon.discountValue;
    }

    return discount;
  };

  const discountedTotal = totalPrice - calculateDiscount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.zip) {
        throw new Error("Please fill all required fields");
      }

      if (cartItems.length === 0) {
        throw new Error("Your cart is empty");
      }

      // Store cart data as backup
      localStorage.setItem('pendingOrder', JSON.stringify({
        items: cartItems,
        total: discountedTotal,
        shippingInfo: formData,
        coupon: appliedCoupon
      }));

      setActiveStep(2); // Move to payment step
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentInitiated(true);
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_FOAiHIpRFqmi6t",
      amount: Math.round(discountedTotal * 100),
      currency: "INR",
      name: "Nexus Store",
      description: `Order for ${formData.name}`,
      image: "/logo.png",
      handler: function (response: any) {
        if (response.razorpay_payment_id) {
          // Store payment ID temporarily
          const orderData = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
          orderData.paymentId = response.razorpay_payment_id;
          localStorage.setItem('pendingOrder', JSON.stringify(orderData));
          
          // Navigate to success page
          router.push('/order-success');
        } else {
          setError("Payment failed. Please try again.");
          setActiveStep(1);
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone || "9000000000"
      },
      notes: {
        address: formData.address
      },
      theme: {
        color: "#6366f1"
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
          setPaymentInitiated(false);
          setActiveStep(1);
        }
      }
    };

    try {
      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error("Payment gateway not loaded");
      }
    } catch (err) {
      setError("Failed to initialize payment. Please try again.");
      console.error("Payment initialization error:", err);
      setActiveStep(1);
      setPaymentInitiated(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Nexus</h1>
          <div className="flex items-center space-x-2">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${activeStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {step}
                </div>
                {step < 2 && (
                  <div className={`w-12 h-1 mx-1 ${activeStep > step ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start"
            >
              <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="md:col-span-2 space-y-6">
            <motion.div
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-xl shadow-sm p-6 ${activeStep !== 1 ? 'hidden' : ''}`}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                  onClick={handlePayment}
                    type="submit"
                    disabled={loading || cartItems.length === 0}
                    className="w-full flex justify-center items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue to Payment
                        <FiArrowRight className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Payment Step */}
            <motion.div
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-xl shadow-sm p-6 ${activeStep !== 2 ? 'hidden' : ''}`}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment</h2>
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <FiCheckCircle className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Shipping Information Verified</h3>
                      <p className="text-sm text-gray-500">Your details have been confirmed</p>
                    </div>
                  </div>
                </div>

                {paymentInitiated ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center mb-4">
                      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Redirecting to Payment Gateway</h3>
                    <p className="text-gray-500">Please complete your payment in the popup window</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    <button
                      onClick={() => setActiveStep(1)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <FiArrowRight className="transform rotate-180 mr-1" />
                      Back to shipping
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4">
                        {item.images?.[0] && (
                          <img 
                            src={item.images[0]} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              {/* Coupon Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="py-2">
                  {!appliedCoupon ? (
                    <div className="flex">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon code"
                        className="flex-1 p-2 border rounded-l focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-r transition"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <FiTag className="text-green-600 mr-2" />
                        <div>
                          <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                          <span className="text-green-600 ml-2">
                            ({appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}% off` 
                              : `₹${appliedCoupon.discountValue} off`})
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={removeCoupon}
                        className="text-gray-500 hover:text-red-500 transition"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-red-500 text-sm mt-1">{couponError}</p>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Discount</span>
                    <span>-₹{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">Free</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-bold text-indigo-600">
                    ₹{discountedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}