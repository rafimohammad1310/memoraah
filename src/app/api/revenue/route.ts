// src/app/api/revenue/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log("Fetching revenue data...");
    
    // 1. First verify we can access any order data
    const testQuery = await adminDb
      .collection('orders')
      .limit(1)
      .get();

    if (testQuery.empty) {
      console.warn("No orders found in collection");
      return NextResponse.json({
        totalRevenue: 0,
        monthlyRevenue: 0,
        orderCount: 0
      });
    }

    const testDoc = testQuery.docs[0];
    console.log("Test document data structure:", {
      id: testDoc.id,
      exists: testDoc.exists,
      data: testDoc.data(),
      ref: testDoc.ref.path
    });

    // 2. Get completed orders with proper field checking
    const completedOrders = await adminDb
      .collection('orders')
      //.where('status', 'in', ['pending'])
      .get();

    // 3. Process orders with validation
    let totalRevenue = 0;
    const validOrders = [];

    completedOrders.forEach(doc => {
      const orderData = doc.data();
      console.log(`Processing order ${doc.id}:`, orderData);
      
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

    console.log(`Found ${validOrders.length} valid completed orders`);
    console.log("Sample valid order:", validOrders[0]);

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
      _debug: {
        sampleOrder: validOrders[0],
        totalOrdersProcessed: completedOrders.size,
        validOrdersCount: validOrders.length
      }
    });

  } catch (error: any) {
    console.error('Revenue calculation error:', {
      message: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error)
    });
    
    return NextResponse.json(
      { 
        error: 'Revenue service unavailable',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 503 }
    );
  }
}