
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import Login from '@/components/auth/Login';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

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
        case 'hr':
          // Redirect both admin and HR to the user management page by default
          router.push('/admin/users');
          break;
        case 'consultant':
          router.push('/admin/review');
          break;
        default:
          // Remain on the login page if the role is not recognized
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
        <Footer />
      </div>
    );
  }

  return (
     <div className="flex min-h-screen w-full flex-col">
       <Header />
       <main className="flex flex-1 items-center justify-center p-4">
         <Login />
       </main>
       <Footer />
     </div>
  );
}
