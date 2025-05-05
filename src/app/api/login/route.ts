// app/api/login/route.ts
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { idToken } = await request.json();
  
  // Set session expiration to 5 days
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  
  cookies().set('session', sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  
  return Response.json({ success: true });
}