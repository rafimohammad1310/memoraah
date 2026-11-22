// components/admin/TrafficChart.tsx
"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function TrafficChart({ data }: { data?: TrafficSource[] }) {
  const chartData = data || [];

  if (!chartData.length) return <div className="flex h-full items-center justify-center text-sm text-gray-500">No visits recorded yet. Traffic tracking starts after deployment of this update.</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value} visits`, 'Visits']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

type TrafficSource = {
  name: string;
  value: number;
  percentage?: number;
};
