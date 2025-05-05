// src/app/api/verify-firebase/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    return NextResponse.json({
      success: true,
      firestoreConnected: testDoc.exists,
      config: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKeyConfigured: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        privateKeyStart: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 30),
        privateKeyEnd: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.slice(-30)
      }
    }, { status: 500 });
  }
}