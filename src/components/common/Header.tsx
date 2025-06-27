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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data.tsx';
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

const roleNames = {
    'end-user': 'End User',
    'hr': 'HR Manager',
    'consultant': 'Consultant',
    'admin': 'Admin',
};

export default function Header() {
  const { auth, logout } = useAuth();
  const { clearData, companyAssignmentForHr } = useUserData();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  const handleStartOver = () => {
    clearData();
    window.location.reload(); // Reload to force state reset and redirect to progress tracker
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="ExitBetter Logo"
            width={120}
            height={31}
            priority
          />
        </Link>

        {auth?.role && <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                    {auth.role === 'end-user' ? auth.email : roleNames[auth.role as keyof typeof roleNames]}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{auth.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {roleNames[auth.role as keyof typeof roleNames]}
                      {auth.role === 'hr' && companyAssignmentForHr && ` (${(companyAssignmentForHr.version || 'basic').charAt(0).toUpperCase() + (companyAssignmentForHr.version || 'basic').slice(1)})`}
                    </p>
                  </div>
                </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 
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
                              This will permanently delete all your saved profile and assessment data. This action cannot be undone.
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

                 <DropdownMenuItem onClick={handleLogout}>
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>}

      </div>
    </header>
  );
}
