"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

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

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Partial<Promotion>>({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "promotions"));
      const promotionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      setPromotions(promotionsData);
    } catch (err) {
      setError("Failed to fetch promotions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setCurrentPromotion(prev => ({
      ...prev,
      [name]: name === "discountValue" || name === "minOrderAmount" || name === "maxDiscountAmount" 
        ? Number(val) 
        : val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        isActive: Boolean(currentPromotion.isActive)
      };

      await addDoc(collection(db, "promotions"), promotionData);
      await fetchPromotions();
      setIsAdding(false);
      setCurrentPromotion({
        code: "",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add promotion");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePromotionStatus = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "promotions", id), { isActive: !isActive });
      await fetchPromotions();
    } catch (err) {
      setError("Failed to update promotion status");
      console.error(err);
    }
  };

  const deletePromotion = async (id: string) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      try {
        await deleteDoc(doc(db, "promotions", id));
        await fetchPromotions();
      } catch (err) {
        setError("Failed to delete promotion");
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Promotions Management</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add New Promotion
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Promotion</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Promo Code*</label>
                <input
                  type="text"
                  name="code"
                  value={currentPromotion.code}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Discount Type*</label>
                <select
                  name="discountType"
                  value={currentPromotion.discountType}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={Boolean(currentPromotion.isActive)}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label>Active Promotion</label>
              </div>
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
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && promotions.length === 0 ? (
        <div className="text-center py-8">
          <p>Loading promotions...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{promo.code}</td>
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
      )}
    </div>
  );
}