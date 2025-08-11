
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/auth/Login';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export default function HomePage() {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (auth?.role === 'admin' || auth?.role === 'consultant') {
        router.push('/admin/dashboard');
      } else if (auth?.role === 'hr') {
        router.push('/admin/users');
      } else if (auth?.role === 'end-user') {
        router.push('/dashboard');
      }
    }
  }, [auth, loading, router]);

  // Render nothing or a loading spinner while checking auth state
  if (loading || auth) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Image
            src="/logo.png"
            alt="ExitBetter Logo"
            width={240}
            height={62}
            priority
        />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted/40">
       <div className="absolute top-8 left-8">
         <Image
            src="/logo.png"
            alt="ExitBetter Logo"
            width={180}
            height={46}
            priority
        />
       </div>
      <Login />
    </main>
  );
}
