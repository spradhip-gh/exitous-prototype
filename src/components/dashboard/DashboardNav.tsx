
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, FileText, Library, Users2, HelpCircle } from 'lucide-react';
import { useUserData } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';

export default function DashboardNav() {
  const pathname = usePathname();
  const { profileData } = useUserData();

  const isProfileComplete = !!profileData;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Edit Profile', icon: User },
    { href: '/dashboard/assessment', label: 'Edit Assessment', icon: FileText, disabled: !isProfileComplete },
    { href: '/dashboard/resources', label: 'Company Resources', icon: Library },
    { href: '/dashboard/external-resources', label: 'External Resources', icon: Users2 },
  ];

  return (
    <nav className="grid items-start gap-2">
        <TooltipProvider>
            {navItems.map(({ href, label, icon: Icon, disabled }) => {
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

                if (disabled) {
                    return (
                        <Tooltip key={href}>
                            <TooltipTrigger asChild>
                                <div className="w-full">{button}</div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Please complete your profile first.</p>
                            </TooltipContent>
                        </Tooltip>
                    )
                }

                return (
                    <Link key={href} href={href} aria-disabled={disabled} className={cn(disabled && "pointer-events-none")}>
                       {button}
                    </Link>
                )
            })}
        </TooltipProvider>
        <Link href="/help/user-guide" target="_blank" rel="noopener noreferrer">
             <Button variant='ghost' className="w-full justify-start mt-4">
                <HelpCircle className="mr-2" />
                Help & Guide
            </Button>
        </Link>
    </nav>
  )
}
