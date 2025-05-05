// components/admin/RealTimeStats.tsx
"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function RealTimeStats() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    monthlySales: {}
  });

  useEffect(() => {
    const unsubscribeMetrics = onSnapshot(doc(db, "dashboard/metrics"), (doc) => {
      setStats(prev => ({ ...prev, ...doc.data() }));
    });

    const unsubscribeSales = onSnapshot(doc(db, "dashboard/sales"), (doc) => {
      setStats(prev => ({ ...prev, monthlySales: doc.data() || {} }));
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeSales();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-gray-500">Total Revenue</h3>
        <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-gray-500">Total Orders</h3>
        <p className="text-2xl font-bold">{stats.orders}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-gray-500">This Month</h3>
        <p className="text-2xl font-bold">
          ₹{Object.values(stats.monthlySales).reduce((a, b) => a + b, 0)}
        </p>
      </div>
    </div>
  );
}