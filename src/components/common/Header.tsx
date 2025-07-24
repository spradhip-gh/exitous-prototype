

'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Trash2, Eye, ShieldCheck, Key, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';

const roleNames = {
    'end-user': 'End User',
    'hr': 'HR Manager',
    'consultant': 'Consultant',
    'admin': 'Admin',
};

const permissionLabels: Record<string, string> = {
    'read': 'Read',
    'write': 'Write',
    'write-upload': 'Write & Upload',
    'invite-only': 'Invite Only',
};

export default function Header({ children }: { children?: React.ReactNode }) {
  const { auth, logout, startUserView, stopUserView, switchCompany } = useAuth();
  const { clearData, companyAssignments } = useUserData();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  const handleStartOver = () => {
    clearData();
    window.location.reload(); // Reload to force state reset and redirect to progress tracker
  };

  const handleStartUserView = () => {
    startUserView();
    router.push('/dashboard');
  };

  const handleStopUserView = () => {
    stopUserView();
    router.push('/admin/users');
  };

  const handleCompanySwitch = (companyName: string) => {
    if (auth?.companyName !== companyName) {
      switchCompany(companyName);
    }
  }

  const companyAssignment = auth?.companyName ? companyAssignments.find(a => a.companyName === auth.companyName) : null;
  const primaryAssignments = auth?.email ? companyAssignments
    .filter(c => c.hrManagers.some(hr => hr.email.toLowerCase() === auth.email!.toLowerCase() && hr.isPrimary))
    .map(c => c.companyName) : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          {children}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ExitBetter Logo"
              width={120}
              height={31}
              priority
            />
          </Link>
        </div>

        {auth?.role && <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                    {auth.isPreview ? 'User Preview' : (auth.role === 'hr' ? auth.companyName : (auth.role === 'end-user' ? auth.email : roleNames[auth.role]))}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{auth.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      { auth.isPreview ? 'Previewing as End User' : roleNames[auth.role as keyof typeof roleNames] }
                      {auth.role === 'hr' && !auth.isPreview && companyAssignment && ` (${(companyAssignment.version || 'basic').charAt(0).toUpperCase() + (companyAssignment.version || 'basic').slice(1)})`}
                    </p>
                  </div>
                </DropdownMenuLabel>
                 <DropdownMenuSeparator />

                 {auth.role === 'hr' && !auth.isPreview && auth.assignedCompanyNames && auth.assignedCompanyNames.length > 1 && (
                  <>
                    <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={auth.companyName} onValueChange={handleCompanySwitch}>
                      {auth.assignedCompanyNames.map(name => {
                        const isPrimary = primaryAssignments.includes(name);
                        return (
                            <DropdownMenuRadioItem key={name} value={name} className="flex justify-between">
                                <span>{name}</span>
                                {isPrimary && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600">
                                        <Crown className="h-3 w-3" />
                                        <span>Primary</span>
                                    </div>
                                )}
                            </DropdownMenuRadioItem>
                        )
                      })}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                  </>
                 )}
                 
                 {auth.role === 'hr' && auth.permissions && !auth.isPreview && (
                    <>
                        <DropdownMenuLabel className="flex items-center gap-2"><Key className="h-3 w-3" /> Permissions</DropdownMenuLabel>
                        <div className="px-2 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">User Management:</span>
                                <Badge variant="secondary" className="font-normal">{permissionLabels[auth.permissions.userManagement] || 'N/A'}</Badge>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Form Editor:</span>
                                <Badge variant="secondary" className="font-normal">{permissionLabels[auth.permissions.formEditor] || 'N/A'}</Badge>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Resources:</span>
                                <Badge variant="secondary" className="font-normal">{permissionLabels[auth.permissions.resources] || 'N/A'}</Badge>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Company Settings:</span>
                                <Badge variant="secondary" className="font-normal">{permissionLabels[auth.permissions.companySettings] || 'N/A'}</Badge>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                    </>
                 )}


                 {auth.role === 'end-user' && (
                    <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2" />
                            <span>Start Over</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all your saved profile and assessment data for this view. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStartOver}>
                              Yes, Start Over
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <DropdownMenuSeparator />
                    </>
                 )}
                 
                 {auth.role === 'hr' && !auth.isPreview && (
                    <DropdownMenuItem onSelect={handleStartUserView}>
                        <Eye className="mr-2" />
                        <span>View as User</span>
                    </DropdownMenuItem>
                 )}

                 {auth.isPreview && (
                    <DropdownMenuItem onSelect={handleStopUserView}>
                        <ShieldCheck className="mr-2" />
                        <span>Return to HR View</span>
                    </DropdownMenuItem>
                 )}


                 <DropdownMenuItem onClick={handleLogout}>
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>}

      </div>
    </header>
  );
}
