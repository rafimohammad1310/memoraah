// app/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Image from "next/image";

const MAX_IMAGES = 5;

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  stock: number;
  featured: boolean;
  createdAt?: string;
};

type ViewMode = "add" | "list";

export default function AdminProducts() {
  const [viewMode, setViewMode] = useState<ViewMode>("add");
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Omit<Product, 'id'>>({
    name: "",
    price: 0,
    description: "",
    images: [""],
    category: "",
    stock: 0,
    featured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };

    if (viewMode === "list") {
      fetchProducts();
    }
  }, [viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const url = isEditing && currentProductId 
        ? `/api/products?id=${currentProductId}`
        : "/api/products";
      
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        toast.success(`Product ${isEditing ? 'updated' : 'added'} successfully!`);
        
        // Refresh product list if we're in list view
        if (viewMode === "list") {
          const updatedResponse = await fetch("/api/products");
          const updatedData = await updatedResponse.json();
          setProducts(updatedData);
        }
        
        // Reset form and switch to list view
        resetForm();
        setViewMode("list");
      } else {
        toast.error(responseData.error || `Failed to ${isEditing ? 'update' : 'add'} product`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      images: product.images,
      category: product.category,
      stock: product.stock,
      featured: product.featured
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
  };

  const handleDelete = async (id: string, images: string[]) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      // First delete images from storage
      await Promise.all(
        images.map(async (imageUrl) => {
          if (imageUrl.startsWith("https://firebasestorage.googleapis.com")) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          }
        })
      );
      
      // Then delete product from database
      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast.success("Product deleted successfully");
        setProducts(products.filter(p => p.id !== id));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setProduct({
      name: "",
      price: 0,
      description: "",
      images: [""],
      category: "",
      stock: 0,
      featured: false
    });
    setIsEditing(false);
    setCurrentProductId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create storage reference
      const storageRef = ref(storage, `products/${file.name}_${Date.now()}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the images array
      const newImages = [...product.images];
      newImages[index] = downloadURL;
      setProduct({...product, images: newImages});
      
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const addImageField = () => {
    if (product.images.length < MAX_IMAGES) {
      setProduct({...product, images: [...product.images, ""]});
    }
  };

  const removeImageField = (index: number) => {
    const newImages = [...product.images];
    newImages.splice(index, 1);
    setProduct({...product, images: newImages});
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${viewMode === "add" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => {
            resetForm();
            setViewMode("add");
          }}
        >
          Add New Product
        </button>
        <button
          className={`px-4 py-2 font-medium ${viewMode === "list" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setViewMode("list")}
        >
          Product List
        </button>
      </div>

      {viewMode === "add" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => setProduct({...product, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({...product, price: Number(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={product.stock}
                  onChange={(e) => setProduct({...product, stock: Number(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={product.category}
                  onChange={(e) => setProduct({...product, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="for-him">For Him</option>
                  <option value="for-her">For Her</option>
                  <option value="for-kids">For Kids</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={product.featured}
                  onChange={(e) => setProduct({...product, featured: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Featured Product
                </label>
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Product Images</h2>
              
              {product.images.map((image, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Image {index + 1} {index === 0 && "(Main Image)"}
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => {
                        const newImages = [...product.images];
                        newImages[index] = e.target.value;
                        setProduct({...product, images: newImages});
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Image URL"
                    />
                    <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, index)}
                        className="hidden"
                      />
                    </label>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {image && (
                    <div className="mt-1 border rounded-md overflow-hidden w-24 h-24">
                      <Image
                        src={image}
                        alt={`Preview ${index + 1}`}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-product.jpg";
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {product.images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={addImageField}
                  className="mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  + Add Another Image
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={product.description}
              onChange={(e) => setProduct({...product, description: e.target.value})}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode("list");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading 
                ? isEditing 
                  ? "Updating..." 
                  : "Saving..." 
                : isEditing 
                  ? "Update Product" 
                  : "Save Product"}
            </button>
          </div>
        </form>
      ) : (
        /* Product List View */
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Product List</h2>
            <div className="flex items-center space-x-4">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-2 top-3 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setViewMode("add");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add New Product
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found</p>
              <button
                onClick={() => {
                  resetForm();
                  setViewMode("add");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.images[0] && (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded-md object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder-product.jpg";
                                }}
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {product.category.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.featured ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            handleEdit(product);
                            setViewMode("add");
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.images)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}