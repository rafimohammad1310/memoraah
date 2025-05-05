// src/components/admin/TrafficChart.tsx
"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export function TrafficChart() {
  const data = {
    labels: ['Direct', 'Organic', 'Referral', 'Social'],
    datasets: [
      {
        data: [30, 40, 20, 10],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderWidth: 0,
      },
    ],
  };

  return <Doughnut data={data} />;
}