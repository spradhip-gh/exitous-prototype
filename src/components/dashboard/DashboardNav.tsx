'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, FileText } from 'lucide-react';

export default function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Edit Profile', icon: User },
    { href: '/dashboard/assessment', label: 'Edit Assessment', icon: FileText },
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
    </nav>
  )
}
