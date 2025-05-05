// components/CategoryNav.tsx
"use client";

import Link from "next/link";

const categories = [
  { id: "for-him", name: "For Him" },
  { id: "for-her", name: "For Her" },
  { id: "for-kids", name: "For Kids" }
];

export default function CategoryNav() {
  return (
    <div className="flex justify-center gap-4 my-8">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.id}`}
          className="px-6 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}