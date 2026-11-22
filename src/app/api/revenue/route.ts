// src/app/api/revenue/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    // Count stored records; only aggregate sale/order data, never customer PII.
    const [completedOrders, customers] = await Promise.all([adminDb
      .collection('orders')
      .limit(5000)
      .get(), adminDb.collection('users').count().get()]);

    // 3. Process orders with validation
    let totalRevenue = 0;
    const validOrders: { id: string; amount: number; status: unknown; timestamp: Date | null }[] = [];

    completedOrders.forEach(doc => {
      const orderData = doc.data();
      if (orderData && typeof orderData.total !== 'undefined') {
        const amount = Number(orderData.total) || 0;
        totalRevenue += amount;
        validOrders.push({
          id: doc.id,
          amount,
          status: orderData.status,
          timestamp: orderData.timestamp?.toDate?.() || null
        });
      }
    });


    // 4. Calculate monthly revenue
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyRevenue = validOrders.reduce((sum, order) => {
      if (order.timestamp && order.timestamp > oneMonthAgo) {
        return sum + order.amount;
      }
      return sum;
    }, 0);

    return NextResponse.json({
      totalRevenue,
      monthlyRevenue,
      orderCount: validOrders.length,
      customerCount: customers.data().count,
      limited: completedOrders.size >= 5000
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Revenue calculation error:', {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'Revenue service unavailable',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 503 }
    );
  }
}
