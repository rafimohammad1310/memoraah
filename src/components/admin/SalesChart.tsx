// src/components/admin/SalesChart.tsx
"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesData {
  months: string[];
  amounts: number[];
  totalOrders?: number;
  averageOrderValue?: number;
}

export function SalesChart() {
  const [chartData, setChartData] = useState<SalesData>({
    months: [],
    amounts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchSalesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminFetch('/api/sales');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SalesData = await response.json();
      
      if (!data.months || !data.amounts) {
        throw new Error('Invalid data format received');
      }
      
      setChartData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sales data';
      setError(errorMessage);
      console.error('Fetch error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
    const refreshTimer = window.setInterval(fetchSalesData, 60_000);
    return () => window.clearInterval(refreshTimer);
  }, [fetchSalesData]);

  const handleRefresh = () => {
    setError(null);
    fetchSalesData();
  };

  const data = {
    labels: chartData.months,
    datasets: [
      {
        label: "Sales Revenue (₹)",
        data: chartData.amounts,
        borderColor: "rgb(153, 111, 214)",
        backgroundColor: "rgba(153, 111, 214, 0.1)",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            return `₹${Number(context.raw).toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => `₹${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 flex items-center gap-3 z-10">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Auto refresh: 1 min</span>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated: {lastUpdated}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          disabled={isLoading}
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-1 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading sales data...</div>
        </div>
      ) : (
        <div className="h-64">
          <Line options={options} data={data} />
        </div>
      )}

      {chartData.totalOrders !== undefined && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-gray-500">Total Orders</p>
            <p className="text-xl font-semibold">{chartData.totalOrders}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-gray-500">Avg. Order Value</p>
            <p className="text-xl font-semibold">
              ₹{chartData.averageOrderValue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
