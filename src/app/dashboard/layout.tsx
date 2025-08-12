
'use client';
import Header from '@/components/common/Header';
import DashboardNav from '@/components/dashboard/DashboardNav';
import Footer from '@/components/common/Footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { FormStateProvider } from '@/hooks/use-form-state';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

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
            <div className="border-b border-orange-200 bg-orange-50 p-4">
              <Alert variant="default" className="border-orange-300 bg-transparent">
                <TriangleAlert className="h-4 w-4 !text-orange-600" />
                <AlertTitle className="text-orange-800">Exitous Prototype</AlertTitle>
              </Alert>
            </div>
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
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-64 w-full max-w-lg" />
        </div>
      </div>
    );
  }
  
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
