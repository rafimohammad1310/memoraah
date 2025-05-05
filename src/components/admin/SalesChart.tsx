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
} from "chart.js";
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ReliableWebSocket } from '@/lib/websocket';

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
  const [wsInstance, setWsInstance] = useState<ReliableWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchSalesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/sales');
      
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

    // Initialize WebSocket only in browser environment
    if (typeof window !== 'undefined') {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/api/realtime-sales';
      const ws = new ReliableWebSocket(
        wsUrl,
        (newData) => {
          setChartData(prev => ({
            ...prev,
            amounts: [...prev.amounts.slice(1), newData.amount]
          }));
          setLastUpdated(new Date().toLocaleTimeString());
        },
        (error) => {
          setError(`Realtime update: ${error}`);
        },
        (connected) => {
          setIsConnected(connected);
          if (connected) setError(null);
        }
      );
      setWsInstance(ws);

      return () => {
        ws.close();
      };
    }
  }, [fetchSalesData]);

  const handleRefresh = () => {
    setError(null);
    fetchSalesData();
    wsInstance?.close();
    setWsInstance(null);
  };

  const data = {
    labels: chartData.months,
    datasets: [
      {
        label: "Sales Revenue (₹)",
        data: chartData.amounts,
        borderColor: isConnected ? "rgb(59, 130, 246)" : "rgb(239, 68, 68)",
        backgroundColor: isConnected ? "rgba(59, 130, 246, 0.1)" : "rgba(239, 68, 68, 0.1)",
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
          label: (context: any) => {
            return `₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `₹${value}`,
        },
      },
    },
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 flex items-center gap-3 z-10">
        <div className="flex items-center gap-1">
          <div 
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
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