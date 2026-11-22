// src/components/admin/QuickAction.tsx
"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface QuickActionProps {
  icon: ReactNode;
  title: string;
  href: string;
  description?: string;
}

// Option 1: Named export (use with curly braces import)
export function QuickAction({ icon, title, href, description }: QuickActionProps) {
  return (
    <Link href={href} className="block h-full">
      <div className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md cursor-pointer h-full">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-200">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// OR Option 2: Default export (use without curly braces)
// export default function QuickAction({ icon, title, href, description }: QuickActionProps) {
//   ... same implementation
// }