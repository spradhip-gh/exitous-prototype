
'use client';
import Header from '@/components/common/Header';
import DashboardNav from '@/components/dashboard/DashboardNav';
import Footer from '@/components/common/Footer';
import { FormStateProvider } from '@/hooks/use-form-state';
import { useUserData } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading: dataLoading } = useUserData();

  if (dataLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </aside>
          <main className="flex-1 p-4 md:p-8">
            <Skeleton className="h-full w-full" />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <FormStateProvider>
       <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
            <DashboardNav />
          </aside>
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </FormStateProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, loading: authLoading } = useAuth();
  
  if (authLoading || !auth) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Skeleton className="h-32 w-full max-w-lg" />
      </div>
    );
  }
  
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
