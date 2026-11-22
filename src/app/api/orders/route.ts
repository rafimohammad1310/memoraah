// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin/requireAdmin';

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
  coupon?: { code?: string; discountAmount?: number; discountType?: string; discountValue?: number } | null;
  items?: unknown[];
  subtotal?: number;
  userId?: string;
  paymentId?: string;
  status?: string;
  createdAt?: unknown;
  timestamp?: unknown;
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const all = new URL(request.url).searchParams.get("all") === "true";
    const snapshot = await adminDb.collection('orders').orderBy('timestamp', 'desc').limit(all ? 1000 : 10).get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data() as FirestoreOrder & Record<string, unknown>;

      // Get customer name - check multiple possible fields
      const customerName = data.shipping?.name || 
                         data.customerName || 
                         'Unknown Customer';

      // Handle timestamp conversion
      const timestamp = asDate(data.timestamp || data.createdAt);

      // Format date for Indian locale
      const formattedDate = timestamp.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      return {
        ...data,
        id: doc.id,
        orderNumber: data.orderNumber || doc.id,
        customer: customerName,
        amount: data.total || 0,
        status: String(data.status || 'pending').toLowerCase(),
        date: formattedDate,
        rawTimestamp: timestamp.toISOString(),
        timestamp: { seconds: Math.floor(timestamp.getTime() / 1000) },
        items: data.items || [], coupon: data.coupon || null, subtotal: data.subtotal || null, userId: data.userId || null, paymentId: data.paymentId || null
      };
    });

    return NextResponse.json(orders);
  } catch (error: unknown) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const { orderId, status } = await request.json();
    if (typeof orderId !== "string" || !["pending", "processing", "shipped", "completed", "cancelled"].includes(status)) return NextResponse.json({ error: "Invalid order update" }, { status: 400 });
    await adminDb.collection("orders").doc(orderId).update({ status });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Could not update order" }, { status: 400 }); }
}
