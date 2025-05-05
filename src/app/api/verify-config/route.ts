// src/app/api/verify-config/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test a simple Firestore operation
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    return NextResponse.json({
      success: true,
      config: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKeyPresent: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        privateKeyStart: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 20),
        privateKeyEnd: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.slice(-20)
      },
      firestoreConnection: testDoc.exists
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: process.env
    }, { status: 500 });
  }
}