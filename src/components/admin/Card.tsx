// src/components/admin/Card.tsx
"use client";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Card({ title, children, className = "", action }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>}
      {children}
    </div>
  );
}
