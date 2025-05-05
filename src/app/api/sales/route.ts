// src/app/api/sales/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { subMonths, format, eachMonthOfInterval } from 'date-fns';

export async function GET() {
  try {
    // Verify Firebase connection
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const currentDate = new Date();
    const sixMonthsAgo = subMonths(currentDate, 5);

    // Query with error handling for Firestore
    let ordersSnapshot;
    try {
      ordersSnapshot = await adminDb
        .collection('orders')
        
        .where('timestamp', '>=', sixMonthsAgo)
        .where('timestamp', '<=', currentDate)
        .orderBy('timestamp', 'asc')
        .get();
    } catch (firestoreError) {
      console.error('Firestore query error:', firestoreError);
      throw new Error('Failed to query orders data. Please check if Firestore indexes are created.');
    }

    // Verify we got data
    if (!ordersSnapshot) {
      throw new Error('No orders data received');
    }

    // Process data with validation
    const ordersData = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      if (!data.timestamp || !data.total) {
        console.warn('Invalid order document:', doc.id);
        return null;
      }
      return {
        total: Number(data.total) || 0,
        timestamp: data.timestamp.toDate()
      };
    }).filter(Boolean);

    // Create month range
    const monthsInRange = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: currentDate
    });

    // Initialize monthly data with proper typing
    const monthlyData: Record<string, { revenue: number; count: number }> = {};
    monthsInRange.forEach(month => {
      monthlyData[format(month, 'MMM')] = { revenue: 0, count: 0 };
    });

    // Aggregate data
    let totalRevenue = 0;
    ordersData.forEach(order => {
      const monthKey = format(order.timestamp, 'MMM');
      monthlyData[monthKey].revenue += order.total;
      monthlyData[monthKey].count += 1;
      totalRevenue += order.total;
    });

    // Prepare response
    const responseData = {
      months: monthsInRange.map(month => format(month, 'MMM')),
      amounts: monthsInRange.map(month => monthlyData[format(month, 'MMM')].revenue),
      totalOrders: ordersData.length,
      averageOrderValue: ordersData.length > 0 ? totalRevenue / ordersData.length : 0,
      status: 'success'
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30'
      }
    });

  } catch (error) {
    console.error('Sales API error:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Failed to process sales data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}