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
import { Building, ChevronsUpDown, User, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const roleNames = {
    'end-user': 'End User',
    'hr': 'HR Manager',
    'consultant': 'Consultant',
};

export default function Header() {
  const { role, setRole } = useAuth();
  const router = useRouter();

  const handleRoleChange = (newRole: 'end-user' | 'hr' | 'consultant' | null) => {
    setRole(newRole);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Exitous Logo"
            width={120}
            height={31}
            priority
          />
        </Link>

        {role && <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                    {roleNames[role]}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleChange('end-user')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>End User</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange('hr')}>
                    <Building className="mr-2 h-4 w-4" />
                    <span>HR Manager</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleRoleChange('consultant')}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>Consultant</span>
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => handleRoleChange(null)}>
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>}

      </div>
    </header>
  );
}
