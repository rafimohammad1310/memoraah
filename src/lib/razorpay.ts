// src/lib/razorpay.ts
"use client";

/**
 * Loads the Razorpay script dynamically
 */
export const loadRazorpay = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve();
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

/**
 * Initializes and launches Razorpay payment modal
 */
export const initiateRazorpayPayment = async (
  options: RazorpayOptions
): Promise<RazorpayPaymentResponse> => {
  await loadRazorpay();

  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK is unavailable'));
      return;
    }
    const rzp = new window.Razorpay({
      ...options,
      handler: (response: RazorpayPaymentResponse) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment closed by user'));
        },
      },
    });

    rzp.open();
  });
};
