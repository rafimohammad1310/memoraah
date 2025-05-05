"use client";  // Make sure it's a client-side component for dynamic rendering

import { useRouter } from 'next/router';  // Import router for dynamic URL handling
import { useState, useEffect } from 'react'; // For managing state and side effects
import Image from 'next/image';  // For optimized images

// This is a mock data array; you should replace it with data from a server or database
const products = [
  {
    id: 1,
    name: "Mini Metal Car",
    price: "₹299",
    description: "A miniature metal car perfect for collectors or kids.",
    images: [
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1616627459991-2aa4ef2203b2?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1602524205959-08d5b9f85f3f?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    id: 2,
    name: "Parrot Soft Toy",
    price: "₹499",
    description: "A cuddly parrot plush toy for kids of all ages.",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1623187933384-5f52f0a4d1e9?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=600&q=80",
    ],
  },
];

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;  // Get the product id from the URL
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (id) {
      const selectedProduct = products.find((prod) => prod.id.toString() === id);
      setProduct(selectedProduct);
    }
  }, [id]);

  if (!product) {
    return <div>Loading...</div>;  // Show loading state while the product data is being fetched
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="flex gap-10">
        <div className="w-1/2">
          <Image
            src={product.images[0]}
            alt={product.name}
            width={500}
            height={500}
            className="w-full h-auto object-cover"
          />
          <div className="flex gap-4 mt-4">
            {product.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Image ${index + 1}`}
                width={100}
                height={100}
                className="w-24 h-24 object-cover cursor-pointer"
              />
            ))}
          </div>
        </div>
        <div className="w-1/2">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-xl text-gray-600">{product.price}</p>
          <p className="mt-4">{product.description}</p>
          <button className="mt-6 px-6 py-3 bg-pink-500 text-white rounded hover:bg-pink-600">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
