// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface FirestoreOrder {
  id?: string;
  orderNumber?: string;
  shipping?: {
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    zip?: string;
    phone?: string;
  };
  customerName?: string; // Some orders might have this directly
  total?: number;
  status?: string;
  createdAt?: any;
  timestamp?: any;
}

export async function GET() {
  try {
    console.log('Fetching orders from Firestore...');
    const snapshot = await adminDb
      .collection('orders')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    console.log(`Found ${snapshot.size} orders`);
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data() as FirestoreOrder;
      console.log('Raw order data:', data); // Debug log

      // Get customer name - check multiple possible fields
      const customerName = data.shipping?.name || 
                         data.customerName || 
                         'Unknown Customer';

      // Handle timestamp conversion
      const timestamp = data.timestamp?.toDate?.() || 
                       data.createdAt?.toDate?.() || 
                       data.timestamp || 
                       data.createdAt || 
                       new Date();

      // Format date for Indian locale
      const formattedDate = timestamp.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      return {
        id: data.orderNumber || doc.id,
        customer: customerName,
        amount: data.total || 0,
        status: data.status || 'Pending',
        date: formattedDate,
        rawTimestamp: timestamp.toISOString()
      };
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}