'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Users, UserCheck, Wrench, Building, UserCog } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Footer from '@/components/common/Footer';

function AdminNav({ role, version }: { role: 'hr' | 'consultant' | 'admin', version?: 'basic' | 'pro' }) {
  const pathname = usePathname();
  const isFormEditorDisabled = role === 'hr' && version === 'basic';

  return (
    <nav className="grid items-start gap-2">
       {role === 'admin' && (
        <>
          <Link href="/admin/forms">
            <Button variant={pathname === '/admin/forms' ? 'default' : 'ghost'} className="w-full justify-start">
              <Wrench className="mr-2" />
              Master Form Editor
            </Button>
          </Link>
           <Link href="/admin/companies">
            <Button variant={pathname === '/admin/companies' ? 'default' : 'ghost'} className="w-full justify-start">
              <Building className="mr-2" />
              Company Management
            </Button>
          </Link>
           <Link href="/admin/platform-users">
            <Button variant={pathname === '/admin/platform-users' ? 'default' : 'ghost'} className="w-full justify-start">
              <UserCog className="mr-2" />
              Platform Users
            </Button>
          </Link>
        </>
      )}
      {role === 'hr' && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Link href="/admin/forms" aria-disabled={isFormEditorDisabled} className={cn(isFormEditorDisabled && 'pointer-events-none')}>
                    <Button variant={pathname === '/admin/forms' ? 'default' : 'ghost'} className="w-full justify-start" disabled={isFormEditorDisabled}>
                      <FileText className="mr-2" />
                      Form Editor
                    </Button>
                  </Link>
                </div>
              </TooltipTrigger>
              {isFormEditorDisabled && (
                <TooltipContent>
                  <p>Upgrade to Pro to edit assessment questions.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Link href="/admin/users">
            <Button variant={pathname === '/admin/users' ? 'default' : 'ghost'} className="w-full justify-start">
              <Users className="mr-2" />
              User Management
            </Button>
          </Link>
        </>
      )}
      {role === 'consultant' && (
        <Link href="/admin/review">
          <Button variant={pathname === '/admin/review' ? 'default' : 'ghost'} className="w-full justify-start">
            <UserCheck className="mr-2" />
            Review Queue
          </Button>
        </Link>
      )}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  const { companyAssignmentForHr } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && auth?.role !== 'hr' && auth?.role !== 'consultant' && auth?.role !== 'admin') {
      router.push('/');
    }
  }, [auth, loading, router]);

  if (loading || (auth?.role !== 'hr' && auth?.role !== 'consultant' && auth?.role !== 'admin')) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
          <AdminNav role={auth.role as any} version={companyAssignmentForHr?.version} />
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
