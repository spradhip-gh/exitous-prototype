

'use client';
import Header from '@/components/common/Header';
import DashboardNav from '@/components/dashboard/DashboardNav';
import Footer from '@/components/common/Footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { FormStateProvider } from '@/hooks/use-form-state';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useUserData();

  if (isLoading) {
    return (
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
    );
  }

  return (
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
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FormStateProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <DashboardContent>{children}</DashboardContent>
        <Footer />
      </div>
    </FormStateProvider>
  );
}
