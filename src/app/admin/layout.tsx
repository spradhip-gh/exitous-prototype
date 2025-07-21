
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Users, UserCheck, Wrench, Building, UserCog, ChevronRight, Menu, Download, TriangleAlert, Library, Settings, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Footer from '@/components/common/Footer';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

function AdminNav({ role, version, companySettingsComplete }: { role: 'hr' | 'consultant' | 'admin', version?: 'basic' | 'pro', companySettingsComplete: boolean }) {
  const pathname = usePathname();
  const isFormEditorDisabled = role === 'hr' && version === 'basic';
  const [isManagementOpen, setIsManagementOpen] = useState(pathname.startsWith('/admin/companies') || pathname.startsWith('/admin/users'));

  const getVariant = (path: string) => pathname === path ? 'secondary' : 'ghost';

  return (
    <nav className="grid items-start gap-2 text-sm font-medium">
       {role === 'admin' && (
        <>
          <Link href="/admin/forms">
            <Button variant={getVariant('/admin/forms')} className="w-full justify-start">
              <Wrench className="mr-2" />
              Master Form Editor
            </Button>
          </Link>
           <Collapsible open={isManagementOpen} onOpenChange={setIsManagementOpen} className="w-full">
              <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Building className="mr-2" />
                    Customers
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", isManagementOpen && 'rotate-90')} />
                  </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 py-1 pl-7">
                  <Link href="/admin/companies">
                    <Button variant={getVariant('/admin/companies')} className="w-full justify-start text-sm font-normal">
                        Company Management
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant={getVariant('/admin/users')} className="w-full justify-start text-sm font-normal">
                        User Management
                    </Button>
                  </Link>
              </CollapsibleContent>
            </Collapsible>
           <Link href="/admin/platform-users">
            <Button variant={getVariant('/admin/platform-users')} className="w-full justify-start">
              <UserCog className="mr-2" />
              Platform Users
            </Button>
          </Link>
          <Link href="/admin/export">
            <Button variant={getVariant('/admin/export')} className="w-full justify-start">
              <Download className="mr-2" />
              Export User Data
            </Button>
          </Link>
        </>
      )}
      {role === 'hr' && (
        <>
          <Link href="/admin/users">
            <Button variant={getVariant('/admin/users')} className="w-full justify-start">
              <Users className="mr-2" />
              User Management
            </Button>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Link href="/admin/forms" aria-disabled={isFormEditorDisabled} className={cn(isFormEditorDisabled && 'pointer-events-none')}>
                    <Button variant={getVariant('/admin/forms')} className="w-full justify-start" disabled={isFormEditorDisabled}>
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

          <Link href="/admin/resources">
            <Button variant={getVariant('/admin/resources')} className="w-full justify-start">
              <Library className="mr-2" />
              Resources
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant={getVariant('/admin/settings')} className="w-full justify-start relative">
              <Settings className="mr-2" />
              Company Settings
              {!companySettingsComplete && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
            </Button>
          </Link>
          <Separator className="my-2" />
           <Link href="/help/hr-guide" target="_blank" rel="noopener noreferrer">
            <Button variant='ghost' className="w-full justify-start">
                <HelpCircle className="mr-2" />
                Help & Guide
            </Button>
           </Link>
        </>
      )}
      {role === 'consultant' && (
        <Link href="/admin/review">
          <Button variant={getVariant('/admin/review')} className="w-full justify-start">
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
  const { companyAssignments } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && auth?.role !== 'hr' && auth?.role !== 'consultant' && auth?.role !== 'admin') {
      router.push('/');
    }
  }, [auth, loading, router]);

  if (loading || !auth || (auth.role !== 'hr' && auth.role !== 'consultant' && auth.role !== 'admin')) {
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
  
  const companyAssignment = auth.companyName ? companyAssignments.find(a => a.companyName === auth.companyName) : null;
  const companySettingsComplete = !!(companyAssignment?.preLayoffContactAlias && companyAssignment?.postLayoffContactAlias);
  
  const navContent = <AdminNav role={auth.role} version={companyAssignment?.version} companySettingsComplete={companySettingsComplete} />;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4 pt-12">
              {navContent}
            </SheetContent>
          </Sheet>
        </div>
      </Header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
          {navContent}
        </aside>
        <main className="flex-1">
           <div className="border-b border-orange-200 bg-orange-50 p-4">
            <Alert variant="default" className="border-orange-300 bg-transparent">
              <TriangleAlert className="h-4 w-4 !text-orange-600" />
              <AlertTitle className="text-orange-800">Exitous Prototype</AlertTitle>
              <AlertDescription className="text-orange-700">
                Please Note: Data and changes made may refresh to default state at anytime.
              </AlertDescription>
            </Alert>
          </div>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
