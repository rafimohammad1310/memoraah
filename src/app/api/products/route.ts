import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const id = searchParams.get('id');

  try {
    // Single product
    if (id) {
      const docSnap = await adminDb.collection('products').doc(id).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    }

    // Multiple products
    let q: FirebaseFirestore.Query = adminDb.collection('products');
    if (category) q = q.where('category', '==', category);
    if (featured === 'true') q = q.where('featured', '==', true);
    const snapshot = await q.limit(100).get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(products, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const data = await request.json();
    const { name, price, category } = data;

    if (!name || !price || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProduct = {
      name,
      price: Number(price),
      category,
      description: data.description || '',
      images: data.images || [],
      stock: Number(data.stock) || 0,
      featured: Boolean(data.featured),
      material: data.material || '',
      rating: Number(data.rating) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('products').add(newProduct);

    return NextResponse.json({ success: true, id: docRef.id, ...newProduct }, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const updates = {
      ...data,
      price: data.price !== undefined ? Number(data.price) : undefined,
      stock: data.stock !== undefined ? Number(data.stock) : undefined,
      featured: data.featured !== undefined ? Boolean(data.featured) : undefined,
      rating: data.rating !== undefined ? Number(data.rating) : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    await adminDb.collection('products').doc(id).update(updates);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      id,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    await adminDb.collection('products').doc(id).delete();
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
