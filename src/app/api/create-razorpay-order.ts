// pages/api/create-razorpay-order.ts
import Razorpay from 'razorpay';
import type { NextApiRequest, NextApiResponse } from 'next';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, receipt, notes } = req.body;

    // Validate amount (minimum ₹1)
    if (amount < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: currency || 'INR',
      receipt,
      notes,
      payment_capture: 1
    });

    return res.status(200).json(order);
  } catch (error: any) {
    console.error('Razorpay error:', error.error || error);
    return res.status(500).json({ 
      error: 'Failed to create order',
      details: error.error?.description || error.message 
    });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};