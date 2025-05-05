// components/CategoryFilter.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";

export default function CategoryFilter({ currentCategory }: { currentCategory: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/products">
        <Button 
          variant={!currentCategory ? "default" : "outline"}
          size="sm"
        >
          All
        </Button>
      </Link>
      {categories.map((category) => (
        <Link key={category.id} href={`/products?category=${category.id}`}>
          <Button
            variant={currentCategory === category.id ? "default" : "outline"}
            size="sm"
          >
            {category.name}
          </Button>
        </Link>
      ))}
    </div>
  );
}