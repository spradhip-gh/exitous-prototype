
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, FileText, Library, Users2, HelpCircle, Settings } from 'lucide-react';
import { useUserData } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useFormState } from '@/hooks/use-form-state';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function NavLink({ href, label, icon: Icon, disabled }: { href: string; label: string; icon: React.ElementType; disabled?: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isDirty, setIsDirty } = useFormState();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [nextPath, setNextPath] = useState('');

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isDirty) {
            e.preventDefault();
            setNextPath(href);
            setIsDialogOpen(true);
        }
    };
    
    const handleLeave = () => {
        setIsDirty(false); // Assume user wants to discard changes
        router.push(nextPath);
        setIsDialogOpen(false);
    };

    const button = (
        <Button 
            variant={pathname === href ? 'default' : 'ghost'} 
            className="w-full justify-start"
            disabled={disabled}
        >
            <Icon className="mr-2" />
            {label}
        </Button>
    );

    return (
        <>
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to leave this page? Any changes you made will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay on Page</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeave}>Leave without Saving</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className={cn(disabled && "pointer-events-none w-full")}>
                           <Link href={href} onClick={handleClick}>
                                {button}
                            </Link>
                        </span>
                    </TooltipTrigger>
                    {disabled && (
                        <TooltipContent>
                            <p>Please complete your profile first.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        </>
    )
}

export default function DashboardNav() {
  const { profileData } = useUserData();
  const isProfileComplete = !!profileData;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Edit Profile', icon: User },
    { href: '/dashboard/assessment', label: 'Edit Assessment', icon: FileText, disabled: !isProfileComplete },
    { href: '/dashboard/resources', label: 'Company Resources', icon: Library },
    { href: '/dashboard/external-resources', label: 'External Resources', icon: Users2 },
    { href: '/dashboard/account', label: 'Account Settings', icon: Settings },
  ];

  return (
    <nav className="grid items-start gap-2">
        {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        <Link href="/help/user-guide" target="_blank" rel="noopener noreferrer">
             <Button variant='ghost' className="w-full justify-start mt-4">
                <HelpCircle className="mr-2" />
                Help & Guide
            </Button>
        </Link>
    </nav>
  )
}
