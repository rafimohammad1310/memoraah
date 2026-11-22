import type { ReactNode } from "react";

// components/admin/StatsCard.tsx
interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: ReactNode;
  gradient?: string;
}

export function StatsCard({ title, value, change, icon, gradient = "from-gray-50 to-gray-100" }: StatsCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-xl shadow-sm border border-gray-200`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-white bg-opacity-50">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        <span className="text-green-600 font-medium">{change}</span>
      </p>
    </div>
  );
}
