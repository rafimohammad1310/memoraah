"use client";
import { Card } from "@/components/admin/Card";
import { StatsCard } from "@/components/admin/StatsCard";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { SalesChart } from "@/components/admin/SalesChart";
import { TrafficChart } from "@/components/admin/TrafficChart";
import { QuickAction } from "@/components/admin/QuickAction";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";
import { FiRefreshCw, FiAlertCircle, FiSettings, FiTrendingUp, FiUsers, FiShoppingCart, FiDollarSign } from "react-icons/fi";

interface TrafficSource { name: string; value: number; percentage: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    orderCount: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
const [trafficData, setTrafficData] = useState<TrafficSource[]>([]);
  
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const [revenueRes, trafficRes] = await Promise.all([
      adminFetch('/api/revenue'),
      adminFetch('/api/traffic')
    ]);
    
    if (!revenueRes.ok || !trafficRes.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    const revenueData = await revenueRes.json();
    const trafficResult = await trafficRes.json();
    
    setStats({
      totalRevenue: revenueData.totalRevenue || 0,
      monthlyRevenue: revenueData.monthlyRevenue || 0,
      orderCount: revenueData.orderCount || 0,
      activeUsers: revenueData.customerCount || 0
    });
    
    setTrafficData(trafficResult.sources || []);
    setLastUpdated(new Date());
  } catch (err) {
    console.error('Error fetching data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          {/* Header Loading */}
          <div className="flex justify-between items-center">
            <div className="h-9 w-64 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-48 bg-gray-200 rounded-full"></div>
          </div>
          
          {/* Stats Cards Loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-xl shadow-sm border border-gray-100"></div>
            ))}
          </div>
          
          {/* Charts Loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-100"></div>
            <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-100"></div>
          </div>
          
          {/* Recent Orders Loading */}
          <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <FiAlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading dashboard</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-md border border-gray-200">
              Last updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Revenue" 
            value={`₹${stats.totalRevenue.toLocaleString()}`} 
            change="All recorded orders"
            icon={<FiDollarSign className="h-6 w-6 text-indigo-500" />}
            gradient="from-indigo-50 to-indigo-100"
          />
          <StatsCard
            title="New Orders"
            value={stats.orderCount.toLocaleString()}
            change="All recorded orders"
            icon={<FiShoppingCart className="h-6 w-6 text-green-500" />}
            gradient="from-green-50 to-green-100"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`₹${stats.monthlyRevenue.toLocaleString()}`}
            change="Last 30 days"
            icon={<FiTrendingUp className="h-6 w-6 text-blue-500" />}
            gradient="from-blue-50 to-blue-100"
          />
          <StatsCard
            title="Customers"
            value={stats.activeUsers.toLocaleString()}
            change="Registered customers"
            icon={<FiUsers className="h-6 w-6 text-purple-500" />}
            gradient="from-purple-50 to-purple-100"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card 
            title="Sales Overview" 
            action={
              <select className="text-sm border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            }
          >
            <div className="h-80 -mx-6 -mb-6">
              <SalesChart />
            </div>
          </Card>
        <Card 
  title="Traffic Sources"
  action={
    <select 
      className="text-sm border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      onChange={() => {
        // Handle time period change
        fetchData();
      }}
    >
      <option value="this_month">This month</option>
      <option value="last_month">Last month</option>
      <option value="last_quarter">Last quarter</option>
    </select>
  }
>
  <div className="h-80 -mx-6 -mb-6">
    <TrafficChart data={trafficData} />
  </div>
</Card>

        </div>

        {/* Recent Orders */}
        <Card 
          title="Recent Orders"
          action={
            <a href="/admin/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </a>
          }
          className="mt-6"
        >
          <RecentOrders limit={5} />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction 
            icon={<FiShoppingCart className="h-6 w-6 text-indigo-600" />}
            title="Add Product" 
            href="/admin/products" 
            description="Create new product listing"
          />
          <QuickAction
            icon={<FiTrendingUp className="h-6 w-6 text-purple-600" />}
            title="Create Promotion"
            href="/admin/promotions"
            description="Setup discounts & offers"
          />
          <QuickAction
            icon={<FiDollarSign className="h-6 w-6 text-green-600" />}
            title="Generate Report"
            href="/admin/reports"
            description="Export sales data"
          />
          <QuickAction
            icon={<FiSettings className="h-6 w-6 text-gray-600" />}
            title="Settings"
            href="/admin/settings"
            description="Configure your store"
          />
        </div>
      </div>
    </div>
  );
}
