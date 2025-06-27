// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleError = (error: Error) => {
      console.error('Authentication error:', error);
      router.refresh(); // Try refreshing on error
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [router]);

  return (
    <SessionProvider
      refetchInterval={300} // 5 minutes
      refetchOnWindowFocus={true}
      onError={(error) => {
        console.error('Session error:', error);
      }}
    >
      {children}
    </SessionProvider>
  );
}