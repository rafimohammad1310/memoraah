// src/components/admin/QuickAction.tsx
"use client";
import Link from "next/link";
import { Icons, IconName } from "./Icons";

interface QuickActionProps {
  icon: IconName;
  title: string;
  href: string;
}

export function QuickAction({ icon, title, href }: QuickActionProps) {
  const IconComponent = Icons[icon];
  
  return (
    <Link href={href}>
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center">
        <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-2">
          <IconComponent className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
    </Link>
  );
}