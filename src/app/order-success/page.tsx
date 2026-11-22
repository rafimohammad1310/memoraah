"use client";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import {
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingBag,
  FiTruck,
  FiPackage,
  FiUser,
  FiCalendar,
  FiDollarSign
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  phone?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
  size?: string;
  color?: string;
}

interface OrderData {
  orderNumber: string;
  items: CartItem[];
  total: number;
  shipping: ShippingInfo;
  timestamp: Date;
  status: string;
  paymentId?: string;
  coupon?: { code: string; discountAmount?: number };
  userId?: string;
}

function OrderSuccessContent() {
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const orderProcessed = useRef(false);
  const [activeStep] = useState(3);

  useEffect(() => {
    if (orderProcessed.current) return;
    orderProcessed.current = true;

    const processOrder = async () => {
      try {
        setLoading(true);
        setIsAdmin(localStorage.getItem("isAdmin") === "true");

        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            setError("You must be logged in to view order.");
            setLoading(false);
            return;
          }

          const paymentIdParam = searchParams.get("paymentId");
          if (paymentIdParam) {
            setPaymentId(paymentIdParam);
            const existingOrder = await checkExistingOrder(paymentIdParam);
            if (existingOrder) {
              setOrderDetails(existingOrder);
              setOrderId(existingOrder.orderNumber);
              clearCart();
              localStorage.removeItem("pendingOrder");
              setLoading(false);
              return;
            }
          }

          const pendingOrder = localStorage.getItem("pendingOrder");
          if (pendingOrder) {
            const orderData = JSON.parse(pendingOrder);
            const items: CartItem[] = Array.isArray(orderData.items) ? orderData.items : [];
            const total = orderData.total || 0;
            const shippingInfo = orderData.shippingInfo || {
              name: "",
              email: "",
              address: "",
              city: "",
              zip: "",
              phone: "",
            };

            const finalPaymentId = paymentIdParam || orderData.paymentId;
            if (finalPaymentId) setPaymentId(finalPaymentId);

            const orderNumber = await generateOrderNumber();
            const newOrderData = await createOrderInFirestore(
              orderNumber,
              shippingInfo,
              finalPaymentId,
              items,
              total,
              orderData.coupon
            );

            setOrderId(orderNumber);
            setOrderDetails(newOrderData);
            clearCart();
            localStorage.removeItem("pendingOrder");
            localStorage.setItem("currentOrderId", orderNumber);
            setLoading(false);
            return;
          }

          const lastOrderId = localStorage.getItem("currentOrderId");
          if (lastOrderId) {
            const q = query(collection(db, "orders"), where("orderNumber", "==", lastOrderId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const docData = snapshot.docs[0].data();
              const existingOrder = {
                ...docData,
                timestamp: docData.timestamp?.toDate() || new Date()
              } as OrderData;
              setOrderDetails(existingOrder);
              setOrderId(existingOrder.orderNumber);
              setPaymentId(existingOrder.paymentId || null);
              setLoading(false);
              return;
            }
          }

          setError("No order found to show.");
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Order processing error:", err);
        setError(err instanceof Error ? err.message : "Failed to process order");
        setLoading(false);
      }
    };

    processOrder();
  }, []);

  const checkExistingOrder = async (paymentId: string) => {
    try {
      const q = query(collection(db, "orders"), where("paymentId", "==", paymentId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        return {
          ...docData,
          timestamp: docData.timestamp?.toDate() || new Date()
        } as OrderData;
      }
      return null;
    } catch (err) {
      console.error("Error checking existing order:", err);
      return null;
    }
  };

  const generateOrderNumber = async () => {
    const today = new Date();
    const ddmmyy = `${today.getDate().toString().padStart(2, "0")}${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${today.getFullYear().toString().slice(2)}`;

    const q = query(
      collection(db, "orders"),
      where("orderNumber", ">=", ddmmyy),
      where("orderNumber", "<", ddmmyy + "z")
    );

    const snapshot = await getDocs(q);
    const orderCount = snapshot.size + 1;
    return `${ddmmyy}-${orderCount.toString().padStart(6, "0")}`;
  };

  const createOrderInFirestore = async (
    orderNumber: string,
    shippingInfo: ShippingInfo,
    paymentId: string | null,
    items: CartItem[],
    total: number,
    coupon?: OrderData["coupon"]
  ) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const orderData = {
        orderNumber,
        userId: user.uid,
        items,
        total,
        subtotal: Number(coupon?.discountAmount || 0) + Number(total),
        shipping: shippingInfo,
        timestamp: Timestamp.now(),
        status: "pending",
        ...(paymentId && { paymentId }),
        ...(coupon && { coupon }),
      };

      await addDoc(collection(db, "orders"), orderData);
      localStorage.setItem("currentOrderId", orderNumber);
      
      return {
        ...orderData,
        timestamp: orderData.timestamp.toDate()
      } as OrderData;
    } catch (err) {
      console.error("Error creating order:", err);
      throw new Error("Failed to create order in database");
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId || !isAdmin) return;
    try {
      const q = query(collection(db, "orders"), where("orderNumber", "==", orderId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = doc(db, "orders", snapshot.docs[0].id);
        await updateDoc(docRef, { status: newStatus });
        setOrderDetails((prev) =>
          prev ? { ...prev, status: newStatus } : prev
        );
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center 
                    ${activeStep >= step ? 'bg-purple-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>
                    {step === 1 ? (
                      <FiShoppingBag className="w-6 h-6" />
                    ) : step === 2 ? (
                      <FiTruck className="w-6 h-6" />
                    ) : (
                      <FiCheckCircle className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${activeStep >= step ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step === 1 ? 'Cart' : step === 2 ? 'Shipping' : 'Complete'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`w-12 h-12 flex items-center justify-center 
                  ${activeStep >= step ? 'bg-purple-700' : 'bg-gray-200'} 
                  ${step === 1 ? 'rounded-l-full' : step === 3 ? 'rounded-r-full' : ''}`}>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start"
            >
              <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0 text-lg" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <div className="w-14 h-14 border-[5px] border-gray-200 border-t-purple-700 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-medium text-gray-900">Processing Your Order</h3>
            <p className="text-gray-500 mt-2">We&apos;re preparing your confirmation</p>
          </div>
        ) : (
          <OrderSuccessCard
            orderDetails={orderDetails}
            orderId={orderId}
            paymentId={paymentId}
            isAdmin={isAdmin}
            updateOrderStatus={updateOrderStatus}
          />
        )}
      </div>
    </div>
  );
}

interface OrderDetailsProps {
  orderDetails: OrderData | null;
  orderId: string | null;
  paymentId: string | null;
  isAdmin: boolean;
  updateOrderStatus: (status: string) => void;
}

function OrderSuccessCard({
  orderDetails,
  orderId,
  paymentId,
  isAdmin,
  updateOrderStatus,
}: OrderDetailsProps) {
  const [showShipping, setShowShipping] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  if (!orderDetails) return null;

  const formatDate = (date: Date) => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Date not available';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date not available';
    }
  };

  const formattedDate = formatDate(orderDetails.timestamp);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
    >
      <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-3xl font-bold text-white">Order Confirmed</h2>
            <p className="text-purple-100 mt-2 text-lg">Thank you for shopping with MEMORAAH</p>
          </div>
          <div className="bg-white p-4 rounded-full shadow-lg transform hover:scale-105 transition-transform">
            <FiCheckCircle className="w-10 h-10 text-purple-700" />
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <FiPackage className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Number</h3>
                <p className="text-gray-900 font-medium text-lg">{orderId}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <FiCalendar className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                <p className="text-gray-900 font-medium text-lg">{formattedDate}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${
                    orderDetails.status === 'delivered' ? 'bg-green-500' :
                    orderDetails.status === 'shipped' ? 'bg-amber-400' : 'bg-purple-700'
                  }`} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="text-gray-900 font-medium text-lg capitalize">{orderDetails.status}</p>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="space-x-3">
            <button
              onClick={() => updateOrderStatus("shipped")}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center"
            >
              <FiTruck className="mr-2" />
              Mark as Shipped
            </button>
            <button
              onClick={() => updateOrderStatus("delivered")}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center"
            >
              <FiCheckCircle className="mr-2" />
              Mark as Delivered
            </button>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Order Summary
          </h3>
          <ul className="divide-y divide-gray-200">
            {orderDetails.items.map((item) => (
              <li key={item.id} className="py-5 flex flex-col sm:flex-row">
                <div className="flex items-start space-x-4 flex-1">
                  {item.images?.[0] && (
                    <div className="relative">
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200" 
                      />
                      <div className="absolute -top-2 -right-2 bg-purple-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{item.name}</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.size && (
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          Color: {item.color}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:text-right">
                  <p className="text-gray-600">
                    ₹{item.price.toLocaleString()} × {item.quantity}
                  </p>
                  <div className="text-gray-900 font-medium text-lg mt-1">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹{orderDetails.total.toLocaleString()}</span>
              </div>
              {orderDetails.coupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({orderDetails.coupon.code})</span>
                  <span>-₹{(orderDetails.coupon.discountAmount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>₹{orderDetails.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <button
              onClick={() => setShowShipping(!showShipping)}
              className="flex items-center text-purple-700 hover:text-purple-900 transition-colors w-full justify-between"
            >
              <div className="flex items-center">
                <FiUser className="mr-3 text-lg" />
                <span className="font-bold text-lg">Shipping Information</span>
              </div>
              <span className="text-sm font-medium">{showShipping ? 'Hide' : 'Show'}</span>
            </button>

            {showShipping && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="text-gray-500 font-medium">Contact Information</h4>
                    <p className="text-gray-800">{orderDetails.shipping.name}</p>
                    <p className="text-gray-800">{orderDetails.shipping.email}</p>
                    <p className="text-gray-800">{orderDetails.shipping.phone || 'No phone provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-500 font-medium">Shipping Address</h4>
                    <p className="text-gray-800">{orderDetails.shipping.address}</p>
                    <p className="text-gray-800">
                      {orderDetails.shipping.city}, {orderDetails.shipping.zip}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <button
              onClick={() => setShowPayment(!showPayment)}
              className="flex items-center text-purple-700 hover:text-purple-900 transition-colors w-full justify-between"
            >
              <div className="flex items-center">
                <FiDollarSign className="mr-3 text-lg" />
                <span className="font-bold text-lg">Payment Details</span>
              </div>
              <span className="text-sm font-medium">{showPayment ? 'Hide' : 'Show'}</span>
            </button>

            {showPayment && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <div className="space-y-3 text-sm">
                  {paymentId && (
                    <div>
                      <h4 className="text-gray-500 font-medium">Transaction ID</h4>
                      <p className="text-gray-800 font-mono">{paymentId}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-gray-500 font-medium">Amount Paid</h4>
                    <p className="text-gray-800 font-medium">₹{orderDetails.total.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
          <Link
            href="/products"
            className="px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          >
            Continue Shopping <FiArrowRight className="ml-2" />
          </Link>
          <Link
            href="/orders"
            className="px-8 py-3.5 bg-white hover:bg-gray-50 text-purple-700 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center border border-purple-700"
          >
            View Order History
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading order details...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
