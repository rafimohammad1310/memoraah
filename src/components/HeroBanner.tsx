// src/app/page.tsx

'use client';
import Link from 'next/link';
import Image from 'next/image';
import { products } from '@/data/products';

export default function Home() {
  return (
    <main className="p-4 space-y-8">
      
      {/* Hero Banner */}
      <section className="relative w-full h-[400px] bg-cover bg-center bg-[url('/images/banner.jpg')] text-white flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Find the Perfect Gift for Every Occasion</h1>
          <p className="mt-4 text-xl">Explore our wide collection of premium gifts and decor items.</p>
          <Link href="/shop">
            <button className="mt-6 bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
              Shop Now
            </button>
          </Link>
        </div>
      </section>

      {/* Highlight Categories */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CategoryCard name="Metal Cars" image="/images/category1.jpg" />
          <CategoryCard name="Parrots & Birds" image="/images/category2.jpg" />
          <CategoryCard name="Gift Sets" image="/images/category3.jpg" />
          <CategoryCard name="Custom Gifts" image="/images/category4.jpg" />
        </div>
      </section>

      {/* Best Sellers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Sellers</h2>
        <div className="flex overflow-x-auto gap-4">
          {products.slice(0, 5).map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[200px] border rounded-2xl shadow-md p-4">
              <Image src={product.images[0]} alt={product.name} width={200} height={200} className="rounded" />
              <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
              <p className="text-gray-600">₹{product.price}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

// Category Card Component
const CategoryCard = ({ name, image }: { name: string; image: string }) => (
  <div className="relative rounded-lg overflow-hidden cursor-pointer">
    <Image src={image} alt={name} width={150} height={150} className="object-cover w-full h-full" />
    <div className="absolute inset-0 bg-black opacity-50 flex justify-center items-center text-white">
      <h3 className="text-lg font-semibold">{name}</h3>
    </div>
  </div>
);
