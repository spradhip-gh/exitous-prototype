'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import Login from '@/components/auth/Login';
import Header from '@/components/common/Header';

export default function Home() {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && auth?.role) {
      switch (auth.role) {
        case 'end-user':
          router.push('/dashboard');
          break;
        case 'admin':
          router.push('/admin/forms');
          break;
        case 'hr':
          router.push('/admin/forms');
          break;
        case 'consultant':
          router.push('/admin/review');
          break;
        default:
          break;
      }
    }
  }, [auth, loading, router]);

  if (loading || auth?.role) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </main>
      </div>
    );
  }

  return (
     <div className="flex min-h-screen w-full flex-col">
       <Header />
       <main className="flex flex-1 items-center justify-center p-4">
         <Login />
       </main>
     </div>
  );
}
