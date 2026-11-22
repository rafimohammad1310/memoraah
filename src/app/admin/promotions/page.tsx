// Promotions
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { onSnapshot , collection, addDoc, getDocs, doc, updateDoc, deleteDoc, increment, writeBatch } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { FiX, FiEye, FiLoader } from "react-icons/fi";

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
  isAffiliateCode?: boolean;
  affiliateId?: string;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number;
  totalCommissionEarned: number;
  joinedDate: string;
  isActive: boolean;
  promoCode: string;
}

interface AffiliateCommission {
  id: string;
  affiliateId: string;
  orderId: string;
  orderAmount: number;
  commissionAmount: number;
  promotionCode: string;
  date: string;
  status: "pending" | "paid";
  paidAt?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  paymentId: string;
  total: number;
  createdAt: string;
  coupon?: {
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  };
  status: string;
  userId: string;
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    landmark?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
}
export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<(AffiliateCommission & { order?: Order })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);
  const [viewMode, setViewMode] = useState<"promotions" | "affiliates" | "commissions">("promotions");
  const [currentPromotion, setCurrentPromotion] = useState<Partial<Promotion>>({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    isAffiliateCode: false,
    affiliateId: ""
  });
  const [currentAffiliate, setCurrentAffiliate] = useState<Partial<Affiliate>>({
    name: "",
    email: "",
    phone: "",
    commissionRate: 10,
    totalCommissionEarned: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    isActive: true,
    promoCode: ""
  });
  const [affiliateFilter, setAffiliateFilter] = useState("");
  const [timePeriodFilter, setTimePeriodFilter] = useState("all");
  const [selectedCommissions, setSelectedCommissions] = useState<(AffiliateCommission & { order?: Order })[]>([]);
  const [isProcessingBulkPayment, setIsProcessingBulkPayment] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<(AffiliateCommission & { order?: Order }) | null>(null);
  const [isProcessingOrders, setIsProcessingOrders] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "orders"), () => {
    fetchData();
  });
  return () => unsubscribe();
}, []);
  const fetchData = async () => {
  try {
    setLoading(true);
    setError("");
    
    // Fetch all data with fresh queries
    const [promotionsSnapshot, affiliatesSnapshot, commissionsSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(collection(db, "promotions")),
      getDocs(collection(db, "affiliates")),
      getDocs(collection(db, "commissions")),
      getDocs(collection(db, "orders"))
    ]);

    const ordersData = ordersSnapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    couponCode: data.coupon?.code || null,
    createdAt:
      (data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.timestamp?.toDate().toISOString()) || null
  };
    }) as unknown as Order[];
    const eligibleOrders = ordersData.filter(order => order.status === "completed" || Boolean(order.paymentId));


    setPromotions(promotionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Promotion[]);

    setAffiliates(affiliatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Affiliate[]);

    const commissionsData = commissionsSnapshot.docs.map(doc => {
      const commission = doc.data() as AffiliateCommission;
      return {
        ...commission,
        id: doc.id,
        order: eligibleOrders.find(o => o.id === commission.orderId)
      };
    }) as (AffiliateCommission & { order?: Order })[];

    setCommissions(commissionsData);
    setSelectedCommissions([]);
  } catch (err) {
    setError("Failed to fetch data");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

 const processAffiliateOrders = async () => {
  try {
    setIsProcessingOrders(true);
    setError("");

    // Fetch fresh data in a single transaction-like operation
   const [ordersSnapshot, promotionsSnapshot, affiliatesSnapshot, commissionsSnapshot] = await Promise.all([
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "promotions")),
      getDocs(collection(db, "affiliates")),
      getDocs(collection(db, "commissions"))
    ]);

    // Convert snapshots to data
    const freshOrders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || doc.data().timestamp?.toDate().toISOString(),
      coupon: doc.data().coupon || null
    })) as unknown as Order[];
    const paidOrders = freshOrders.filter(order => order.status === "completed" || Boolean(order.paymentId));

    const freshPromotions = promotionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Promotion[];

    const freshAffiliates = affiliatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Affiliate[];

    const existingCommissions = commissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AffiliateCommission[];

    // Get all affiliate promo codes
    const affiliatePromoCodes = freshPromotions
      .filter(p => p.isAffiliateCode)
      .map(p => p.code);

    // Get all order IDs that already have commissions
    const existingCommissionOrderIds = existingCommissions.map(c => c.orderId);

    // Filter orders that:
    // 1. Have a coupon code
    // 2. The coupon code is an affiliate code
    // 3. Don't already have a commission
    const unprocessedOrders = paidOrders.filter(order => {
      const hasAffiliateCoupon = order.coupon?.code && 
                               affiliatePromoCodes.includes(order.coupon.code);
      const alreadyProcessed = existingCommissionOrderIds.includes(order.id);
      return hasAffiliateCoupon && !alreadyProcessed;
    });

    if (unprocessedOrders.length === 0) {
      setError("No new affiliate orders to process");
      return;
    }

    // Create a batch for all writes
    const batch = writeBatch(db);
    const newCommissions: (AffiliateCommission & { order?: Order })[] = [];

    // Process each eligible order
    for (const order of unprocessedOrders) {
      try {
        const promotion = freshPromotions.find(p => 
          p.code === order.coupon?.code && 
          p.isAffiliateCode
        );

        if (!promotion?.affiliateId) continue;

        const affiliate = freshAffiliates.find(a => a.id === promotion.affiliateId);
        if (!affiliate) continue;

        // Calculate commission
        const commissionAmount = (order.total * (affiliate.commissionRate || 10)) / 100;
        
        // Create commission data
        const commissionData: AffiliateCommission = {
          id: uuidv4(),
          affiliateId: affiliate.id,
          orderId: order.id,
          orderAmount: order.total,
          commissionAmount,
          promotionCode: order.coupon!.code,
          date: order.createdAt,
          status: "pending"
        };

        // Add to batch
        const commissionRef = doc(db, "commissions", commissionData.id);
        batch.set(commissionRef, commissionData);
        
        // Store for UI update
        newCommissions.push({
          ...commissionData,
          order
        });
      } catch (err) {
        console.error(`Error processing order ${order.id}:`, err);
      }
    }

    // Commit all changes at once
    if (newCommissions.length > 0) {
      await batch.commit();
      
      // Update local state
      setCommissions(prev => [...prev, ...newCommissions]);
      setSelectedCommissions([]);
      
      // Show success message
      alert(`Successfully created ${newCommissions.length} commissions`);
    } else {
      setError("No valid affiliate commissions were created");
    }
  } catch (err) {
    console.error("Process affiliate orders error:", err);
    setError("Failed to process orders: " + (err instanceof Error ? err.message : String(err)));
  } finally {
    setIsProcessingOrders(false);
  }
};
  const markCommissionAsPaid = async (commissionId: string) => {
    try {
      await updateDoc(doc(db, "commissions", commissionId), {
        status: "paid",
        paidAt: new Date().toISOString()
      });
      
      // Update affiliate's total earnings
      const commission = commissions.find(c => c.id === commissionId);
      if (commission) {
        const affiliateRef = doc(db, "affiliates", commission.affiliateId);
        await updateDoc(affiliateRef, {
          totalCommissionEarned: increment(commission.commissionAmount)
        });
      }
      
      await fetchData();
    } catch (err) {
      setError("Failed to update commission status");
      console.error(err);
    }
  };

  const paySelectedCommissions = async () => {
    if (selectedCommissions.length === 0) return;
    
    try {
      setIsProcessingBulkPayment(true);
      const batch = writeBatch(db);
      
      // Group commissions by affiliate for efficient updates
      const commissionsByAffiliate: Record<string, number> = {};
      
      selectedCommissions.forEach(commission => {
        const commissionRef = doc(db, "commissions", commission.id);
        batch.update(commissionRef, {
          status: "paid",
          paidAt: new Date().toISOString()
        });
        
        // Sum commissions by affiliate
        if (!commissionsByAffiliate[commission.affiliateId]) {
          commissionsByAffiliate[commission.affiliateId] = 0;
        }
        commissionsByAffiliate[commission.affiliateId] += commission.commissionAmount;
      });
      
      // Update affiliate totals
      Object.entries(commissionsByAffiliate).forEach(([affiliateId, amount]) => {
        const affiliateRef = doc(db, "affiliates", affiliateId);
        batch.update(affiliateRef, {
          totalCommissionEarned: increment(amount)
        });
      });
      
      await batch.commit();
      await fetchData();
    } catch (err) {
      setError("Failed to pay commissions");
      console.error(err);
    } finally {
      setIsProcessingBulkPayment(false);
    }
  };

  const generatePromoCode = (affiliateName: string) => {
    const namePart = affiliateName.substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${namePart}${randomPart}`;
  };

  const handlePromotionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setCurrentPromotion(prev => ({
      ...prev,
      [name]: name === "discountValue" || name === "minOrderAmount" || name === "maxDiscountAmount" 
        ? Number(val) 
        : val
    }));
  };

  const handleAffiliateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setCurrentAffiliate(prev => ({
      ...prev,
      [name]: name === "commissionRate" || name === "totalCommissionEarned" 
        ? Number(val) 
        : val
    }));
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!currentPromotion.code) {
        throw new Error("Promotion code is required");
      }

      const promotionData = {
        ...currentPromotion,
        discountValue: Number(currentPromotion.discountValue),
        minOrderAmount: Number(currentPromotion.minOrderAmount || 0),
        maxDiscountAmount: Number(currentPromotion.maxDiscountAmount || 0),
        isActive: Boolean(currentPromotion.isActive),
        isAffiliateCode: Boolean(currentPromotion.isAffiliateCode),
        affiliateId: currentPromotion.affiliateId || null
      };

      await addDoc(collection(db, "promotions"), promotionData);
      await fetchData();
      setIsAdding(false);
      resetPromotionForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add promotion");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAffiliateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!currentAffiliate.name || !currentAffiliate.email) {
        throw new Error("Name and email are required");
      }

      // Generate promo code
      const promoCode = generatePromoCode(currentAffiliate.name);

      const affiliateData = {
        ...currentAffiliate,
        commissionRate: Number(currentAffiliate.commissionRate),
        totalCommissionEarned: Number(currentAffiliate.totalCommissionEarned || 0),
        isActive: Boolean(currentAffiliate.isActive),
        joinedDate: currentAffiliate.joinedDate || new Date().toISOString().split('T')[0],
        promoCode: promoCode
      };

      // Create affiliate
      const affiliateRef = await addDoc(collection(db, "affiliates"), affiliateData);
      
      // Create associated promotion
      const promotionData = {
        code: promoCode,
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        isAffiliateCode: true,
        affiliateId: affiliateRef.id
      };

      await addDoc(collection(db, "promotions"), promotionData);
      
      await fetchData();
      setIsAddingAffiliate(false);
      resetAffiliateForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add affiliate");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetPromotionForm = () => {
    setCurrentPromotion({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      isAffiliateCode: false,
      affiliateId: ""
    });
  };

  const resetAffiliateForm = () => {
    setCurrentAffiliate({
      name: "",
      email: "",
      phone: "",
      commissionRate: 10,
      totalCommissionEarned: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      isActive: true,
      promoCode: ""
    });
  };

  const togglePromotionStatus = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "promotions", id), { isActive: !isActive });
      await fetchData();
    } catch (err) {
      setError("Failed to update promotion status");
      console.error(err);
    }
  };

  const toggleAffiliateStatus = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "affiliates", id), { isActive: !isActive });
      await fetchData();
    } catch (err) {
      setError("Failed to update affiliate status");
      console.error(err);
    }
  };

  const deletePromotion = async (id: string) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      try {
        await deleteDoc(doc(db, "promotions", id));
        await fetchData();
      } catch (err) {
        setError("Failed to delete promotion");
        console.error(err);
      }
    }
  };

  const deleteAffiliate = async (id: string) => {
    if (confirm("Are you sure you want to delete this affiliate? All associated promotions will be deactivated.")) {
      try {
        // Deactivate all promotions from this affiliate
        const affiliatePromotions = promotions.filter(p => p.affiliateId === id);
        const updatePromises = affiliatePromotions.map(p => 
          updateDoc(doc(db, "promotions", p.id), { isActive: false })
        );
        await Promise.all(updatePromises);
        
        // Delete the affiliate
        await deleteDoc(doc(db, "affiliates", id));
        await fetchData();
      } catch (err) {
        setError("Failed to delete affiliate");
        console.error(err);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard: ' + text);
  };

  const handleCommissionSelect = (commission: AffiliateCommission & { order?: Order }) => {
    setSelectedCommissions(prev => {
      const exists = prev.some(c => c.id === commission.id);
      if (exists) {
        return prev.filter(c => c.id !== commission.id);
      } else {
        return [...prev, commission];
      }
    });
  };

  const handleSelectAllCommissions = () => {
    if (selectedCommissions.length === filteredCommissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions([...filteredCommissions]);
    }
  };

  const viewCommissionDetails = (commission: AffiliateCommission & { order?: Order }) => {
    setSelectedCommission(commission);
  };

  const filteredCommissions = commissions.filter(commission => {
    // Filter by affiliate
    if (affiliateFilter && commission.affiliateId !== affiliateFilter) {
      return false;
    }
    
    // Filter by time period
    const commissionDate = new Date(commission.date);
    const now = new Date();
    
    switch (timePeriodFilter) {
      case "this_month":
        return commissionDate.getMonth() === now.getMonth() && 
               commissionDate.getFullYear() === now.getFullYear();
      case "last_month":
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return commissionDate.getMonth() === lastMonth.getMonth() && 
               commissionDate.getFullYear() === lastMonth.getFullYear();
      case "last_quarter":
        const quarterStart = new Date(now);
        quarterStart.setMonth(quarterStart.getMonth() - 3);
        return commissionDate >= quarterStart;
      default:
        return true;
    }
  });

  const areAllCommissionsSelected = filteredCommissions.length > 0 && 
    selectedCommissions.length === filteredCommissions.length;

  const selectedAffiliate = selectedCommission 
    ? affiliates.find(a => a.id === selectedCommission.affiliateId)
    : null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {viewMode === "promotions" ? "Promotions Management" : 
           viewMode === "affiliates" ? "Affiliates Management" : "Commissions Report"}
        </h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("promotions")}
            className={`px-4 py-2 rounded ${viewMode === "promotions" ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Promotions
          </button>
          <button
            onClick={() => setViewMode("affiliates")}
            className={`px-4 py-2 rounded ${viewMode === "affiliates" ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Affiliates
          </button>
          <button
            onClick={() => setViewMode("commissions")}
            className={`px-4 py-2 rounded ${viewMode === "commissions" ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Commissions
          </button>
          <button
  onClick={fetchData}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-2"
>
  Refresh Data
</button>
          
          {viewMode === "promotions" && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add New Promotion
            </button>
          )}
          
          {viewMode === "affiliates" && (
            <button
              onClick={() => setIsAddingAffiliate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add New Affiliate
            </button>
          )}

          {viewMode === "commissions" && (
           <button
  onClick={async () => {
    try {
      await processAffiliateOrders();
    } catch (error) {
      setError("Failed to process orders: " + (error as Error).message);
    }
  }}
  disabled={isProcessingOrders}
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
>
  {isProcessingOrders ? (
    <>
      <FiLoader className="animate-spin mr-1 inline" />
      Processing...
    </>
  ) : (
    'Process New Orders'
  )}
</button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Promotion</h2>
          <form onSubmit={handlePromotionSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Promo Code*</label>
                <input
                  type="text"
                  name="code"
                  value={currentPromotion.code}
                  onChange={handlePromotionInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Discount Type*</label>
                <select
                  name="discountType"
                  value={currentPromotion.discountType}
                  onChange={handlePromotionInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">
                  {currentPromotion.discountType === 'percentage' ? 'Discount Percentage*' : 'Discount Amount*'}
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={currentPromotion.discountValue}
                  onChange={handlePromotionInputChange}
                  className="w-full p-2 border rounded"
                  min="1"
                  max={currentPromotion.discountType === 'percentage' ? '100' : undefined}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Minimum Order Amount</label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={currentPromotion.minOrderAmount}
                  onChange={handlePromotionInputChange}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              {currentPromotion.discountType === 'percentage' && (
                <div>
                  <label className="block mb-1">Maximum Discount Amount</label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={currentPromotion.maxDiscountAmount}
                    onChange={handlePromotionInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              )}
              <div>
                <label className="block mb-1">Start Date*</label>
                <input
                  type="date"
                  name="startDate"
                  value={currentPromotion.startDate}
                  onChange={handlePromotionInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">End Date*</label>
                <input
                  type="date"
                  name="endDate"
                  value={currentPromotion.endDate}
                  onChange={handlePromotionInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={Boolean(currentPromotion.isActive)}
                  onChange={handlePromotionInputChange}
                  className="mr-2"
                />
                <label>Active Promotion</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAffiliateCode"
                  checked={Boolean(currentPromotion.isAffiliateCode)}
                  onChange={handlePromotionInputChange}
                  className="mr-2"
                />
                <label>Affiliate Promotion</label>
              </div>
              {currentPromotion.isAffiliateCode && (
                <div>
                  <label className="block mb-1">Affiliate*</label>
                  <select
                    name="affiliateId"
                    value={currentPromotion.affiliateId}
                    onChange={handlePromotionInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Affiliate</option>
                    {affiliates.filter(a => a.isActive).map(affiliate => (
                      <option key={affiliate.id} value={affiliate.id}>
                        {affiliate.name} ({affiliate.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Promotion'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  resetPromotionForm();
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddingAffiliate && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Affiliate</h2>
          <form onSubmit={handleAffiliateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Name*</label>
                <input
                  type="text"
                  name="name"
                  value={currentAffiliate.name}
                  onChange={handleAffiliateInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={currentAffiliate.email}
                  onChange={handleAffiliateInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={currentAffiliate.phone}
                  onChange={handleAffiliateInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Commission Rate (%)*</label>
                <input
                  type="number"
                  name="commissionRate"
                  value={currentAffiliate.commissionRate}
                  onChange={handleAffiliateInputChange}
                  className="w-full p-2 border rounded"
                  min="1"
                  max="50"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Joined Date*</label>
                <input
                  type="date"
                  name="joinedDate"
                  value={currentAffiliate.joinedDate}
                  onChange={handleAffiliateInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={Boolean(currentAffiliate.isActive)}
                  onChange={handleAffiliateInputChange}
                  className="mr-2"
                />
                <label>Active Affiliate</label>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Affiliate'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingAffiliate(false);
                  resetAffiliateForm();
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && promotions.length === 0 && viewMode === "promotions" ? (
        <div className="text-center py-8">
          <p>Loading promotions...</p>
        </div>
      ) : loading && affiliates.length === 0 && viewMode === "affiliates" ? (
        <div className="text-center py-8">
          <p>Loading affiliates...</p>
        </div>
      ) : loading && commissions.length === 0 && viewMode === "commissions" ? (
        <div className="text-center py-8">
          <p>Loading commissions...</p>
        </div>
      ) : viewMode === "promotions" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {promo.code}
                    {promo.isAffiliateCode && (
                      <span className="ml-1 text-xs text-blue-600">(Affiliate)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {promo.discountType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}%` 
                      : `₹${promo.discountValue}`}
                    {promo.maxDiscountAmount && promo.discountType === 'percentage' && (
                      <span className="text-xs text-gray-500 block">Max ₹{promo.maxDiscountAmount}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promo.minOrderAmount ? `₹${promo.minOrderAmount}` : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div>{new Date(promo.startDate).toLocaleDateString()}</div>
                      <div>to</div>
                      <div>{new Date(promo.endDate).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promo.affiliateId ? (
                      affiliates.find(a => a.id === promo.affiliateId)?.name || 'Unknown'
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promo.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => togglePromotionStatus(promo.id, promo.isActive)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deletePromotion(promo.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === "affiliates" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promo Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {affiliate.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                        {affiliate.promoCode}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(affiliate.promoCode)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{affiliate.email}</div>
                    <div className="text-sm text-gray-500">{affiliate.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {affiliate.commissionRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₹{affiliate.totalCommissionEarned.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(affiliate.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        affiliate.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {affiliate.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.isActive)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {affiliate.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAffiliate(affiliate.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === "commissions" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">Commissions Report</h2>
            <div className="flex space-x-4">
              <select
                className="border rounded px-3 py-1"
                value={affiliateFilter}
                onChange={(e) => setAffiliateFilter(e.target.value)}
              >
                <option value="">All Affiliates</option>
                {affiliates.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-1"
                value={timePeriodFilter}
                onChange={(e) => setTimePeriodFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_quarter">Last Quarter</option>
              </select>
              <button
                onClick={paySelectedCommissions}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={selectedCommissions.length === 0 || isProcessingBulkPayment}
              >
                {isProcessingBulkPayment ? (
                  <>
                    <FiLoader className="animate-spin mr-1 inline" />
                    Processing...
                  </>
                ) : (
                  `Pay Selected (${selectedCommissions.length})`
                )}
              </button>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={areAllCommissionsSelected}
                    onChange={handleSelectAllCommissions}
                    className="mr-2"
                  />
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promo Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
           <tbody className="bg-white divide-y divide-gray-200">
  {filteredCommissions.map((commission) => {
    const affiliate = affiliates.find(a => a.id === commission.affiliateId);
    const isSelected = selectedCommissions.some(c => c.id === commission.id);
    return (
      <tr key={commission.id} className={isSelected ? 'bg-blue-50' : ''}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCommissionSelect(commission)}
              className="mr-2"
            />
            {new Date(commission.date).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {affiliate?.name || 'Unknown'}
          <div className="text-xs text-gray-500">{affiliate?.promoCode}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap font-medium">
          #{commission.order?.orderNumber || commission.orderId.substring(0, 8)}
          {commission.order && (
            <button 
              onClick={() => viewCommissionDetails(commission)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <FiEye className="inline" />
            </button>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {commission.promotionCode}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          ₹{commission.orderAmount.toLocaleString()}
          {commission.order?.coupon?.discountAmount && (
            <div className="text-xs text-green-600">
              (Discount: ₹{commission.order.coupon.discountAmount.toFixed(2)})
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          ₹{commission.commissionAmount.toLocaleString()}
          {affiliate && (
            <div className="text-xs text-gray-500">
              ({affiliate.commissionRate}% rate)
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span 
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              commission.status === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {commission.status === 'paid' ? 'Paid' : 'Pending'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          {commission.status === 'pending' && (
            <button
              onClick={() => markCommissionAsPaid(commission.id)}
              className="text-green-600 hover:text-green-800"
            >
              Mark as Paid
            </button>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
          </table>
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {filteredCommissions.length} of {commissions.length} commissions
            </div>
            <div className="text-sm font-medium">
              Total Pending: ₹{filteredCommissions
                .filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + c.commissionAmount, 0)
                .toLocaleString()}
            </div>
            <div className="text-sm font-medium">
              Total Paid: ₹{filteredCommissions
                .filter(c => c.status === 'paid')
                .reduce((sum, c) => sum + c.commissionAmount, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      ) : null}

      {/* Commission Detail Modal */}
      {selectedCommission && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">Commission Details</h3>
          <button 
            onClick={() => setSelectedCommission(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Order Information</h4>
            <div className="space-y-2">
              <p><span className="font-medium">Order Number:</span> {selectedCommission.order?.orderNumber || 'N/A'}</p>
              <p><span className="font-medium">Order Date:</span> {new Date(selectedCommission.date).toLocaleString()}</p>
              <p><span className="font-medium">Order Amount:</span> ₹{selectedCommission.orderAmount.toLocaleString()}</p>
              <p><span className="font-medium">Promo Code:</span> {selectedCommission.promotionCode}</p>
              <p><span className="font-medium">Payment ID:</span> {selectedCommission.order?.paymentId || 'N/A'}</p>
              <p><span className="font-medium">Status:</span> {selectedCommission.order?.status || 'N/A'}</p>
            </div>
            
            {selectedCommission.order?.shipping && (
              <>
                <h4 className="font-medium text-gray-700 mt-4 mb-2">Shipping Information</h4>
                <div className="space-y-1">
                  <p>{selectedCommission.order.shipping.name}</p>
                  <p>{selectedCommission.order.shipping.address}</p>
                  <p>{selectedCommission.order.shipping.city}, {selectedCommission.order.shipping.zip}</p>
                  <p>Phone: {selectedCommission.order.shipping.phone}</p>
                  <p>Email: {selectedCommission.order.shipping.email}</p>
                </div>
              </>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Affiliate Information</h4>
            {selectedAffiliate ? (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {selectedAffiliate.name}</p>
                <p><span className="font-medium">Email:</span> {selectedAffiliate.email}</p>
                <p><span className="font-medium">Phone:</span> {selectedAffiliate.phone}</p>
                <p><span className="font-medium">Commission Rate:</span> {selectedAffiliate.commissionRate}%</p>
                <p><span className="font-medium">Total Earned:</span> ₹{selectedAffiliate.totalCommissionEarned.toLocaleString()}</p>
                <p><span className="font-medium">Joined Date:</span> {new Date(selectedAffiliate.joinedDate).toLocaleDateString()}</p>
                <p>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedAffiliate.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedAffiliate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            ) : (
              <p>Affiliate not found</p>
            )}
            
            <h4 className="font-medium text-gray-700 mt-4 mb-2">Items Ordered</h4>
            {selectedCommission.order?.items?.length ? (
              <div className="space-y-2">
                {selectedCommission.order.items.map((item, index) => (
                  <div key={index} className="border-b pb-2">
                    <p><span className="font-medium">Product:</span> {item.name}</p>
                    <p><span className="font-medium">Price:</span> ₹{item.price.toLocaleString()} x {item.quantity}</p>
                    <p><span className="font-medium">Category:</span> {item.category}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No items information available</p>
            )}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Commission Details</h4>
          <div className="space-y-2">
            <p><span className="font-medium">Commission Amount:</span> ₹{selectedCommission.commissionAmount.toLocaleString()}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                selectedCommission.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedCommission.status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </p>
            {selectedCommission.status === 'paid' && selectedCommission.paidAt && (
              <p><span className="font-medium">Paid On:</span> {new Date(selectedCommission.paidAt).toLocaleString()}</p>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setSelectedCommission(null)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          {selectedCommission.status === 'pending' && (
            <button
              onClick={() => {
                markCommissionAsPaid(selectedCommission.id);
                setSelectedCommission(null);
              }}
              className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
