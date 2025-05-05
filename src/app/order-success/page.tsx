"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiCheckCircle, FiAlertCircle, FiLoader, FiShoppingBag, FiTruck, FiHome } from "react-icons/fi";

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
}

interface OrderData {
  orderNumber: string;
  items: CartItem[];
  total: number;
  shipping: ShippingInfo;
  timestamp: Date;
  status: string;
  paymentId?: string;
  coupon?: any;
}

export default function OrderSuccessPage() {
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const searchParams = useSearchParams();
  const [showShipping, setShowShipping] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(3);
  const orderProcessed = useRef(false);

  useEffect(() => {
    if (orderProcessed.current) return;
    orderProcessed.current = true;

    const processOrder = async () => {
      try {
        setLoading(true);
        setIsAdmin(localStorage.getItem('isAdmin') === 'true');

        // Get order data from localStorage
        const pendingOrder = localStorage.getItem('pendingOrder');
        const orderData = pendingOrder ? JSON.parse(pendingOrder) : null;
        
        if (!orderData) {
          throw new Error("Order data not found");
        }

        const items = orderData.items || [];
        const total = orderData.total || 0;
        const shippingInfo = orderData.shippingInfo || {
          name: '',
          email: '',
          address: '',
          city: '',
          zip: '',
          phone: ''
        };

        // Get payment ID from URL or order data
        const paymentIdParam = searchParams.get('paymentId') || orderData.paymentId;
        if (paymentIdParam) {
          setPaymentId(paymentIdParam);
        }

        // Check if order already exists
        if (paymentIdParam) {
          const existingOrder = await checkExistingOrder(paymentIdParam);
          if (existingOrder) {
            setOrderDetails(existingOrder);
            setOrderId(existingOrder.orderNumber);
            clearCart();
            localStorage.removeItem('pendingOrder');
            return;
          }
        }

        // Create new order
        const orderNumber = await generateOrderNumber();
        const newOrderData = await createOrderInFirestore(
          orderNumber,
          shippingInfo,
          paymentIdParam,
          items,
          total,
          orderData.coupon
        );

        setOrderId(orderNumber);
        setOrderDetails(newOrderData);
        clearCart();
        localStorage.removeItem('pendingOrder');
      } catch (err) {
        console.error("Order processing error:", err);
        setError(err instanceof Error ? err.message : "Failed to process order");
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, []);

  const checkExistingOrder = async (paymentId: string) => {
    try {
      const q = query(collection(db, "orders"), where("paymentId", "==", paymentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as OrderData;
      }
      return null;
    } catch (error) {
      console.error("Error checking existing order:", error);
      return null;
    }
  };

  const generateOrderNumber = async () => {
    try {
      const today = new Date();
      const ddmmyy = `${today.getDate().toString().padStart(2, "0")}${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${today.getFullYear().toString().slice(2)}`;

      const q = query(
        collection(db, "orders"),
        where("orderNumber", ">=", ddmmyy),
        where("orderNumber", "<", ddmmyy + "z")
      );

      const querySnapshot = await getDocs(q);
      const orderCount = querySnapshot.size + 1;

      return `${ddmmyy}-${orderCount.toString().padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating order number:", error);
      throw new Error("Failed to generate order number");
    }
  };

  const createOrderInFirestore = async (
    orderNumber: string,
    shippingInfo: ShippingInfo,
    paymentId: string | null,
    items: CartItem[],
    total: number,
    coupon?: any
  ) => {
    try {
      const orderData: OrderData = {
        orderNumber,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          images: item.images || []
        })),
        total: Number(total) || 0,
        shipping: shippingInfo,
        timestamp: new Date(), // This will store server timestamp
        status: "pending",
        ...(paymentId && { paymentId }),
        ...(coupon && { coupon })
      };
  
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        timestamp: new Date() // Firestore will convert this to a timestamp
      });
      
      localStorage.setItem('currentOrderId', docRef.id);
      
      return orderData;
    } catch (error) {
      console.error("Error creating order in Firestore:", error);
      throw new Error("Failed to create order in database");
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId || !isAdmin) return;
    
    try {
      const q = query(collection(db, "orders"), where("orderNumber", "==", orderId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, "orders", querySnapshot.docs[0].id);
        await updateDoc(docRef, { status: newStatus });
        
        if (orderDetails) {
          setOrderDetails({
            ...orderDetails,
            status: newStatus
          });
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
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
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${activeStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {step === 1 ? <FiShoppingBag className="w-4 h-4" /> : 
                   step === 2 ? <FiTruck className="w-4 h-4" /> : 
                   <FiCheckCircle className="w-4 h-4" />}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-1 ${activeStep > step ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
      <div>
  <p className="text-sm text-gray-500">Date</p>
  <p className="font-medium">
    {orderDetails?.timestamp ? 
      new Date(orderDetails.timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : 
      '--'}
  </p>
</div>
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

        <motion.div
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 md:p-8"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900">Processing Your Order</h3>
              <p className="text-gray-500 mt-1">Please wait while we confirm your purchase</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FiCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Thank you for your purchase. We've sent a confirmation email with your order details.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="md:col-span-2 text-left">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                      <div className="space-y-4">
                        {orderDetails?.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="flex items-center">
                              {item.images?.[0] && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4">
                                  <img 
                                    src={item.images[0]} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-900">₹{orderDetails?.total.toFixed(2)}</span>
                        </div>
                        {orderDetails?.coupon && (
                          <div className="flex justify-between py-2 text-green-600">
                            <span>Discount ({orderDetails.coupon.code})</span>
                            <span>-₹{(
                              orderDetails.coupon.discountType === 'percentage' 
                                ? orderDetails.total * (orderDetails.coupon.discountValue / 100)
                                : orderDetails.coupon.discountValue
                            ).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Shipping</span>
                          <span className="text-gray-900">Free</span>
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                          <span className="font-medium text-gray-900">Total</span>
                          <span className="font-bold text-indigo-600">
                            ₹{orderDetails?.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <button 
                        onClick={() => setShowShipping(!showShipping)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800"
                      >
                        {showShipping ? 'Hide' : 'View'} Shipping Details
                        <FiArrowRight className={`ml-1 transform ${showShipping ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {showShipping && orderDetails?.shipping && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <h4 className="font-medium text-gray-900 mb-3">Shipping Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium">{orderDetails.shipping.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium">{orderDetails.shipping.email}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="font-medium">{orderDetails.shipping.address}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">City</p>
                              <p className="font-medium">{orderDetails.shipping.city}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">ZIP Code</p>
                              <p className="font-medium">{orderDetails.shipping.zip}</p>
                            </div>
                            {orderDetails.shipping.phone && (
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{orderDetails.shipping.phone}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin: Update Status</label>
                        <select 
                          value={orderDetails?.status || 'pending'}
                          onChange={(e) => updateOrderStatus(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="font-medium">{orderId || '--'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">
                          {orderDetails?.timestamp ? new Date(orderDetails.timestamp).toLocaleDateString() : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${orderDetails?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              orderDetails?.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              orderDetails?.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              orderDetails?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                            {orderDetails?.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      {paymentId && (
                        <div>
                          <p className="text-sm text-gray-500">Payment ID</p>
                          <p className="font-medium">{paymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <FiCheckCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                          <p className="text-sm text-gray-500">We've received your order</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-5 w-5 border-2 border-indigo-300 rounded-full"></div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Processing</p>
                          <p className="text-sm text-gray-500">We're preparing your items</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-5 w-5 border-2 border-indigo-300 rounded-full"></div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Shipped</p>
                          <p className="text-sm text-gray-500">Your items are on the way</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/"
                    className="w-full flex justify-center items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                  >
                    <FiHome className="mr-2" />
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}