
'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Users, UserCheck, Wrench, Building, UserCog, ChevronRight, Menu, Download, TriangleAlert, Library, Settings, HelpCircle, BarChart, Handshake, CheckSquare, Briefcase, Users2, ListChecks, Lightbulb, Blocks, LayoutDashboard, Bug } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Footer from '@/components/common/Footer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function AdminNav({ role, companyName, version, companySettingsComplete }: { role: 'hr' | 'consultant' | 'admin', companyName?: string, version?: 'basic' | 'pro', companySettingsComplete: boolean }) {
  const pathname = usePathname();
  const { auth } = useAuth();
  const { reviewQueue } = useUserData();
  
  const isFormEditorDisabled = role === 'hr' && version === 'basic';
  
  const [isCustomerManagementOpen, setIsCustomerManagementOpen] = useState(
    pathname.startsWith('/admin/companies') || pathname.startsWith('/admin/users')
  );
  const [isContentManagementOpen, setIsContentManagementOpen] = useState(
    pathname.startsWith('/admin/tasks') || pathname.startsWith('/admin/tips') || pathname.startsWith('/admin/forms')
  );
  
  const getVariant = (path: string) => pathname === path ? 'secondary' : 'ghost';

  const getHelpLink = () => {
      switch (role) {
          case 'admin':
              return '/help/admin-guide';
          case 'hr':
              return '/help/hr-guide';
          default:
              return '/help/user-guide';
      }
  }

  const { companyAssignments } = useUserData();
  const isHrPrimaryOfAnyCompany = useMemo(() => {
    if (role !== 'hr' || !auth?.email || !companyAssignments) return false;
    return companyAssignments.some(c => c.hrManagers.some(hr => hr.email === auth.email && hr.isPrimary));
  }, [role, auth?.email, companyAssignments]);

  const pendingReviewCount = useMemo(() => {
    if (!reviewQueue) return 0;
    return reviewQueue.filter(item => item.status === 'pending').length;
  }, [reviewQueue]);

  const FormEditorLink = () => {
    const button = (
        <Button variant={getVariant('/admin/forms')} className="w-full justify-start" disabled={isFormEditorDisabled}>
            <FileText className="mr-2" />
            Form Editor
        </Button>
    );

    if (isFormEditorDisabled) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="w-full" tabIndex={0}>
                           {button}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Upgrade to Pro to edit assessment questions.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return <Link href="/admin/forms" className="w-full">{button}</Link>;
};

  return (
    <nav className="grid items-start gap-1 text-sm font-medium">
       {role === 'admin' && (
        <>
          <Link href="/admin/dashboard">
            <Button variant={getVariant('/admin/dashboard')} className="w-full justify-start">
              <LayoutDashboard className="mr-2" />
              Dashboard
            </Button>
          </Link>

          <Collapsible open={isCustomerManagementOpen} onOpenChange={setIsCustomerManagementOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between pr-2">
                    <span className="flex items-center gap-2"><Users className="mr-2"/> Customer Management</span>
                    <ChevronRight className={cn("transition-transform", isCustomerManagementOpen && "rotate-90")}/>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-1 py-1">
                <Link href="/admin/users">
                    <Button variant={getVariant('/admin/users')} className="w-full justify-start text-sm font-normal">
                        User Management
                    </Button>
                </Link>
                <Link href="/admin/companies">
                    <Button variant={getVariant('/admin/companies')} className="w-full justify-start text-sm font-normal">
                        Company Management
                    </Button>
                </Link>
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible open={isContentManagementOpen} onOpenChange={setIsContentManagementOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between pr-2">
                    <span className="flex items-center gap-2"><Blocks className="mr-2"/> Content Management</span>
                    <ChevronRight className={cn("transition-transform", isContentManagementOpen && "rotate-90")}/>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-1 py-1">
                <Link href="/admin/forms">
                    <Button variant={getVariant('/admin/forms')} className="w-full justify-start text-sm font-normal">
                        Master Form Editor
                    </Button>
                </Link>
                <Link href="/admin/tasks">
                    <Button variant={getVariant('/admin/tasks')} className="w-full justify-start text-sm font-normal">
                        Task Management
                    </Button>
                </Link>
                <Link href="/admin/tips">
                    <Button variant={getVariant('/admin/tips')} className="w-full justify-start text-sm font-normal">
                        Tips Management
                    </Button>
                </Link>
            </CollapsibleContent>
          </Collapsible>

          <Link href="/admin/review-queue">
            <Button variant={getVariant('/admin/review-queue')} className="w-full justify-start">
              <div className="flex items-center flex-1">
                <CheckSquare className="mr-2" />
                Guidance & Review
              </div>
              {pendingReviewCount > 0 && <Badge variant="destructive">{pendingReviewCount}</Badge>}
            </Button>
          </Link>
          <Link href="/admin/external-resources">
            <Button variant={getVariant('/admin/external-resources')} className="w-full justify-start">
              <Handshake className="mr-2" />
              External Resources
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant={getVariant('/admin/analytics')} className="w-full justify-start">
              <BarChart className="mr-2" />
              Analytics
            </Button>
          </Link>
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
          <Separator className="my-2" />
           <Link href={getHelpLink()} target="_blank" rel="noopener noreferrer">
            <Button variant='ghost' className="w-full justify-start">
                <HelpCircle className="mr-2" />
                Help & Guide
            </Button>
           </Link>
           <Link href="/admin/debug">
                <Button variant={getVariant('/admin/debug')} className="w-full justify-start text-destructive hover:text-destructive">
                    <Bug className="mr-2" />
                    Debug
                </Button>
            </Link>
        </>
      )}
      {role === 'hr' && (
        <>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {companyName}
            </h2>
            <div className="space-y-1">
               <Link href="/admin/settings">
                <Button variant={getVariant('/admin/settings')} className="w-full justify-start relative">
                  <Settings className="mr-2" />
                  Company Settings
                  {!companySettingsComplete && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant={getVariant('/admin/users')} className="w-full justify-start">
                  <Users className="mr-2" />
                  User Management
                </Button>
              </Link>
                <FormEditorLink />
              <Link href="/admin/resources">
                <Button variant={getVariant('/admin/resources')} className="w-full justify-start">
                  <Library className="mr-2" />
                  Resources
                </Button>
              </Link>
               <Link href="/admin/analytics">
                <Button variant={getVariant('/admin/analytics')} className="w-full justify-start">
                  <BarChart className="mr-2" />
                  Analytics
                </Button>
              </Link>
            </div>
          </div>
          <Separator />
           <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Global
              </h2>
              <div className="space-y-1">
                {isHrPrimaryOfAnyCompany && (
                 <Link href="/admin/hr-management">
                    <Button variant={getVariant('/admin/hr-management')} className="w-full justify-start">
                        <Users2 className="mr-2" />
                        HR Team Management
                    </Button>
                </Link>
                )}
                <Link href={getHelpLink()} target="_blank" rel="noopener noreferrer">
                  <Button variant='ghost' className="w-full justify-start">
                      <HelpCircle className="mr-2" />
                      Help & Guide
                  </Button>
                </Link>
              </div>
           </div>
        </>
      )}
      {role === 'consultant' && (
        <>
        <Link href="/admin/review-queue">
          <Button variant={getVariant('/admin/review-queue')} className="w-full justify-start">
            <CheckSquare className="mr-2" />
            Guidance & Review
          </Button>
        </Link>
        </>
      )}
    </nav>
  )
}

function AdminLayoutContent({ children, auth }: { children: React.ReactNode, auth: any }) {
    const { isLoading, companyAssignmentForHr, reviewQueue } = useUserData();

    const pendingReviewCount = useMemo(() => {
        if (!reviewQueue) return 0;
        return reviewQueue.filter(item => item.status === 'pending' && item.type === 'question_edit_suggestion').length;
    }, [reviewQueue]);

    if (isLoading) {
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

    const companySettingsComplete = !!(companyAssignmentForHr?.preEndDateContactAlias && companyAssignmentForHr?.postEndDateContactAlias);
    const navContent = <AdminNav role={auth.role} companyName={auth.companyName} version={companyAssignmentForHr?.version} companySettingsComplete={companySettingsComplete} />;

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
                <SheetContent side="left" className="p-0">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Admin Menu</SheetTitle>
                  </SheetHeader>
                  {navContent}
                </SheetContent>
              </Sheet>
            </div>
          </Header>
          <div className="flex flex-1">
            <aside className="hidden w-64 flex-col border-r bg-background md:flex">
              {navContent}
            </aside>
            <main className="flex-1">
               {auth.role === 'admin' && pendingReviewCount > 0 && (
                <div className="border-b border-blue-300 bg-blue-50 p-4">
                  <Alert variant="default" className="border-blue-300 bg-transparent">
                    <CheckSquare className="h-4 w-4 !text-blue-600" />
                    <AlertTitle className="text-blue-800">Action Required</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      There are {pendingReviewCount} new item(s) in the <Link href="/admin/review-queue" className="font-semibold underline">Guidance & Review</Link> queue that need your attention.
                    </AlertDescription>
                  </Alert>
                </div>
               )}
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
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && auth?.role !== 'hr' && auth?.role !== 'consultant' && auth?.role !== 'admin') {
      router.push('/');
    }
  }, [auth, loading, router]);
  
  if (loading || !auth) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Skeleton className="h-32 w-full max-w-lg" />
      </div>
    );
  }

  return <AdminLayoutContent auth={auth}>{children}</AdminLayoutContent>;
}
