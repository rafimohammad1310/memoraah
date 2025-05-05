// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from './lib/firebase-admin'; // You'll need to set up Firebase Admin SDK

export async function middleware(request) {
  const session = request.cookies.get('session');
  
  // Redirect to login page if no session exists
  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}