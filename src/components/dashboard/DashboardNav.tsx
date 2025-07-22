
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, FileText, Library, Users2, HelpCircle } from 'lucide-react';

export default function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Edit Profile', icon: User },
    { href: '/dashboard/assessment', label: 'Edit Assessment', icon: FileText },
    { href: '/dashboard/resources', label: 'Company Resources', icon: Library },
    { href: '/dashboard/external-resources', label: 'External Resources', icon: Users2 },
  ];

  return (
    <nav className="grid items-start gap-2">
        {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
                <Button 
                    variant={pathname === href ? 'default' : 'ghost'} 
                    className="w-full justify-start"
                >
                    <Icon className="mr-2" />
                    {label}
                </Button>
            </Link>
        ))}
        <Link href="/help/user-guide" target="_blank" rel="noopener noreferrer">
             <Button variant='ghost' className="w-full justify-start mt-4">
                <HelpCircle className="mr-2" />
                Help & Guide
            </Button>
        </Link>
    </nav>
  )
}
