// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');

  try {
    let q = query(collection(db, 'products'));
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    // Add featured filter
    if (featured === 'true') {
      q = query(q, where('featured', '==', true));
    }

    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure featured is boolean
    const productData = {
      ...data,
      featured: Boolean(data.featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'products'), productData);
    return NextResponse.json({ 
      message: 'Product added', 
      id: docRef.id,
      featured: productData.featured // Return featured status for verification
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}