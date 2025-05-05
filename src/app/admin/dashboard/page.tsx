// src/app/admin/dashboard/page.tsx
"use client";
import { Card } from "@/components/admin/Card";
import { StatsCard } from "@/components/admin/StatsCard";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { SalesChart } from "@/components/admin/SalesChart";
import { TrafficChart } from "@/components/admin/TrafficChart";
import { QuickAction } from "@/components/admin/QuickAction";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    orderCount: 0,
    activeUsers: 845 // Default value
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [revenueRes] = await Promise.all([
          fetch('/api/revenue?_=' + Date.now()) // Cache busting
        ]);
        
        if (!revenueRes.ok) {
          throw new Error('Failed to fetch revenue data');
        }
        
        const revenueData = await revenueRes.json();
        
        setStats({
          totalRevenue: revenueData.totalRevenue || 0,
          monthlyRevenue: revenueData.monthlyRevenue || 0,
          orderCount: revenueData.orderCount || 0,
          activeUsers: 845 // You should fetch this from your API too
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate percentage change (you should fetch this from your API)
  const monthlyChange = 12;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* Header Loading */}
          <div className="flex justify-between items-center">
            <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-5 w-1/4 bg-gray-200 rounded"></div>
          </div>
          
          {/* Stats Cards Loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          
          {/* Charts Loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Recent Orders Loading */}
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          change={`+${monthlyChange}% from last month`} 
          icon="revenue"
        />
        <StatsCard
          title="New Orders"
          value={stats.orderCount.toLocaleString()}
          change={`+${monthlyChange}% from last month`}
          icon="orders"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          change={`+${monthlyChange}% from last month`}
          icon="trending"
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          change="+8% from last month"
          icon="users"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sales Overview">
          <SalesChart />
        </Card>
        <Card title="Traffic Sources">
          <TrafficChart />
        </Card>
      </div>

      {/* Recent Orders */}
      <Card title="Recent Orders" className="mt-6">
        <RecentOrders limit={5} />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction 
          icon="products" 
          title="Add Product" 
          href="/admin/products" 
        />
        <QuickAction
          icon="promotions"
          title="Create Promotion"
          href="/admin/promotions"
        />
        <QuickAction
          icon="reports"
          title="Generate Report"
          href="/admin/reports"
        />
        <QuickAction
          icon="settings"
          title="Settings"
          href="/admin/settings"
        />
      </div>
    </div>
  );
}