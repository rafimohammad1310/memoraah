// src/app/api/admin/orders/route.ts
import { NextResponse } from 'next/server';
import { adminDb} from '@/lib/firebase-admin';

export async function GET() {
  try {
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customer: data.customerName || 'Unknown',
        date: data.createdAt?.toDate().toLocaleDateString() || 'Unknown date',
        amount: data.total || 0,
        status: data.status || 'Pending'
      };
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}