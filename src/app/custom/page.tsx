"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Upload, Check, X, Camera, Sparkles, Palette, Type, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CustomizationOption {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  options?: {
    name: string;
    values: Array<{
      id: string;
      name: string;
      priceModifier: number;
    }>;
  }[];
}

export default function CustomPage() {
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Sample customization products
  const customizationProducts: CustomizationOption[] = [
    {
      id: "custom-polaroid",
      name: "Custom Polaroid Set",
      description: "Set of 10 polaroid prints with your photos and custom text",
      basePrice: 599,
      image: "/products/polaroid-set.jpg",
      options: [
        {
          name: "Size",
          values: [
            { id: "standard", name: "Standard (3.5\" × 4.2\")", priceModifier: 0 },
            { id: "large", name: "Large (4\" × 5\")", priceModifier: 150 }
          ]
        },
        {
          name: "Finish",
          values: [
            { id: "matte", name: "Matte", priceModifier: 0 },
            { id: "glossy", name: "Glossy", priceModifier: 50 }
          ]
        }
      ]
    },
    {
      id: "metal-art",
      name: "Custom Metal Art",
      description: "Convert your photos into elegant metal wall art",
      basePrice: 1299,
      image: "/products/metal-art.jpg",
      options: [
        {
          name: "Size",
          values: [
            { id: "small", name: "Small (8\" × 10\")", priceModifier: 0 },
            { id: "medium", name: "Medium (12\" × 16\")", priceModifier: 500 },
            { id: "large", name: "Large (16\" × 20\")", priceModifier: 1000 }
          ]
        },
        {
          name: "Metal Type",
          values: [
            { id: "aluminum", name: "Aluminum", priceModifier: 0 },
            { id: "steel", name: "Stainless Steel", priceModifier: 300 }
          ]
        }
      ]
    },
    {
      id: "3d-miniature",
      name: "3D Photo Miniature",
      description: "Turn your favorite moments into a 3D miniature diorama",
      basePrice: 1599,
      image: "/products/3d-miniature.jpg",
      options: [
        {
          name: "Size",
          values: [
            { id: "small", name: "Small (4\" × 4\")", priceModifier: 0 },
            { id: "medium", name: "Medium (6\" × 6\")", priceModifier: 400 }
          ]
        },
        {
          name: "Base",
          values: [
            { id: "wood", name: "Wooden Base", priceModifier: 0 },
            { id: "acrylic", name: "Acrylic Base", priceModifier: 200 },
            { id: "led", name: "LED Light Base", priceModifier: 400 }
          ]
        }
      ]
    },
    {
      id: "acrylic-frame",
      name: "Custom Acrylic Frame",
      description: "Elegant acrylic frame with your photo and custom message",
      basePrice: 899,
      image: "/products/acrylic-frame.jpg",
      options: [
        {
          name: "Size",
          values: [
            { id: "small", name: "Small (5\" × 7\")", priceModifier: 0 },
            { id: "medium", name: "Medium (8\" × 10\")", priceModifier: 300 },
            { id: "large", name: "Large (11\" × 14\")", priceModifier: 600 }
          ]
        },
        {
          name: "Frame Style",
          values: [
            { id: "classic", name: "Classic Clear", priceModifier: 0 },
            { id: "frosted", name: "Frosted Edge", priceModifier: 150 },
            { id: "rgb", name: "RGB LED Edge", priceModifier: 350 }
          ]
        }
      ]
    }
  ];

  const findSelectedProduct = () => {
    return customizationProducts.find(product => product.id === selectedProduct) || null;
  };

  const calculateTotalPrice = () => {
    const product = findSelectedProduct();
    if (!product) return 0;

    let total = product.basePrice;
    
    if (product.options) {
      product.options.forEach(option => {
        const selectedOptionId = selectedOptions[option.name];
        if (selectedOptionId) {
          const selectedValue = option.values.find(value => value.id === selectedOptionId);
          if (selectedValue) {
            total += selectedValue.priceModifier;
          }
        }
      });
    }
    
    return total;
  };

  const handleOptionChange = (optionName: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: optionId
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setSelectedOptions({});
    setActiveStep(2);
    
    // Set default options
    const product = customizationProducts.find(p => p.id === productId);
    if (product && product.options) {
      const defaultOptions: Record<string, string> = {};
      product.options.forEach(option => {
        if (option.values.length > 0) {
          defaultOptions[option.name] = option.values[0].id;
        }
      });
      setSelectedOptions(defaultOptions);
    }
  };

  const handleAddToCart = () => {
    const product = findSelectedProduct();
    if (!product) return;
    
    setIsLoading(true);
    
    // Simulate processing time
    setTimeout(() => {
      addToCart({
        id: `custom-${product.id}-${Date.now()}`,
        name: `Custom ${product.name}`,
        price: calculateTotalPrice(),
        description: `${product.description}${customText ? ` with text: "${customText}"` : ''}`,
        images: uploadedImage ? [uploadedImage] : [product.image],
        category: "custom",
        isCustom: true,
        customOptions: selectedOptions
      });
      
      setIsLoading(false);
      setActiveStep(4);
    }, 1500);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedOptions({});
    setUploadedImage(null);
    setCustomText("");
    setActiveStep(1);
  };

  const canProceedToStep3 = () => {
    // Ensure all options are selected
    const product = findSelectedProduct();
    if (!product || !product.options) return true;
    
    return product.options.every(option => selectedOptions[option.name]);
  };

  const canProceedToStep4 = () => {
    return !!uploadedImage;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">1. Choose Your Item Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customizationProducts.map((product) => (
                <div 
                  key={product.id}
                  className={`relative bg-white border rounded-xl overflow-hidden cursor-pointer transition ${
                    selectedProduct === product.id ? 'ring-2 ring-pink-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleProductSelect(product.id)}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {selectedProduct === product.id && (
                    <div className="absolute top-4 right-4 bg-pink-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-gray-500 mt-1 mb-3">{product.description}</p>
                    <span className="text-pink-600 font-semibold">From ₹{product.basePrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 2:
        const product = findSelectedProduct();
        return product ? (
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveStep(1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">2. Customize Your {product.name}</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <div className="aspect-square relative bg-white rounded-xl overflow-hidden border">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              <div className="md:w-1/2 space-y-6">
                <div>
                  <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
                
                {product.options?.map((option) => (
                  <div key={option.name} className="space-y-3">
                    <label className="font-medium block">{option.name}</label>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((value) => (
                        <button
                          key={value.id}
                          onClick={() => handleOptionChange(option.name, value.id)}
                          className={`px-4 py-2 border rounded-lg transition ${
                            selectedOptions[option.name] === value.id
                              ? 'bg-pink-50 border-pink-500 text-pink-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {value.name}
                          {value.priceModifier > 0 && (
                            <span className="ml-1 text-sm text-gray-500">+₹{value.priceModifier}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <span className="text-lg font-semibold">Total: ₹{calculateTotalPrice()}</span>
                </div>
                
                <button
                  onClick={() => canProceedToStep3() && setActiveStep(3)}
                  disabled={!canProceedToStep3()}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    canProceedToStep3()
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue to Upload
                </button>
              </div>
            </div>
          </div>
        ) : null;
        
      case 3:
        return (
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveStep(2)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">3. Upload Your Photo</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2 space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <div className="aspect-square relative mx-auto">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded image"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 transition flex items-center justify-center gap-2 mx-auto"
                      >
                        <X className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-600">
                        Drag & drop your photo here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Support JPG, PNG files up to 10MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="font-medium block">Add Custom Text (Optional)</label>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Enter names, date, or a special message..."
                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    rows={3}
                    maxLength={100}
                  />
                  <p className="text-sm text-gray-500 text-right">
                    {customText.length}/100 characters
                  </p>
                </div>
              </div>
              
              <div className="md:w-1/2 p-6 bg-white rounded-xl border">
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Preview & Confirm</h3>
                  <div className="space-y-3">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Item:</span>
                      <span>{findSelectedProduct()?.name}</span>
                    </p>
                    
                    {Object.entries(selectedOptions).map(([optionName, optionId]) => {
                      const option = findSelectedProduct()?.options?.find(o => o.name === optionName);
                      const value = option?.values.find(v => v.id === optionId);
                      
                      return (
                        <p key={optionName} className="flex justify-between">
                          <span className="text-gray-600">{optionName}:</span>
                          <span>{value?.name}</span>
                        </p>
                      );
                    })}
                    
                    {customText && (
                      <p className="flex justify-between">
                        <span className="text-gray-600">Custom Text:</span>
                        <span className="text-right max-w-[70%] truncate">{customText}</span>
                      </p>
                    )}
                    
                    <div className="border-t pt-3 mt-3">
                      <p className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span className="text-pink-600">₹{calculateTotalPrice()}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={!canProceedToStep4() || isLoading}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      canProceedToStep4() && !isLoading
                        ? 'bg-pink-600 text-white hover:bg-pink-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="text-center max-w-lg mx-auto py-12 space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Added to Cart!</h2>
            <p className="text-gray-600">
              Your custom {findSelectedProduct()?.name} has been added to your cart.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/cart"
                className="px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                View Cart
              </Link>
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition flex-1"
              >
                Customize Another
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-500 to-pink-500 py-12 md:py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Create Your Unique Gift</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Personalize our products with your photos, messages, and preferences for a truly special keepsake
          </p>
        </div>
      </section>
      
      {/* Steps Indicator */}
      <div className="py-6 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between">
            {[
              { step: 1, label: "Choose Item" },
              { step: 2, label: "Customize" },
              { step: 3, label: "Upload Photo" },
              { step: 4, label: "Finished" }
            ].map((item) => (
              <div 
                key={item.step}
                className={`flex flex-col items-center ${item.step > 1 ? 'flex-1' : ''} relative`}
              >
                {item.step > 1 && (
                  <div className={`absolute top-4 w-full h-0.5 -left-1/2 ${
                    activeStep >= item.step ? 'bg-pink-500' : 'bg-gray-200'
                  }`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium z-10 ${
                  activeStep >= item.step
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {activeStep > item.step ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <span className={`mt-2 text-xs sm:text-sm ${
                  activeStep >= item.step ? 'text-pink-700 font-medium' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {renderStepContent()}
        </div>
      </section>
      
      {/* Features */}
      {activeStep === 1 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">Why Choose Custom Memorahh Gifts?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Sparkles className="w-8 h-8 text-pink-500" />,
                  title: "Premium Quality",
                  description: "Handcrafted with attention to detail using top-quality materials that last"
                },
                {
                  icon: <Palette className="w-8 h-8 text-pink-500" />,
                  title: "Endless Customization",
                  description: "Tailor every aspect to make a truly one-of-a-kind gift"
                },
                {
                  icon: <Type className="w-8 h-8 text-pink-500" />,
                  title: "Personalized Experience",
                  description: "Our designers review each order to ensure your vision comes to life perfectly"
                }
              ].map((feature, index) => (
                <div key={index} className="text-center p-6 rounded-xl">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      <Footer />
    </main>
  );
}