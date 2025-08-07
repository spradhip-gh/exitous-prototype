
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import Login from '@/components/auth/Login';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function HomePage() {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && auth?.role) {
      if (auth.role === 'end-user') {
        router.push('/dashboard');
      } else {
        router.push('/admin/users');
      }
    }
  }, [auth, loading, router]);

  if (loading || auth) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Skeleton className="h-[480px] w-full max-w-md" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
        <Login />
      </main>
      <Footer />
    </div>
  );
}

