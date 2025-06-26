'use client';
import Header from '@/components/common/Header';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
    </div>
  );
}
