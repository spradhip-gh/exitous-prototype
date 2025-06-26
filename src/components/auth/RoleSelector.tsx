'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { User, Briefcase, UserCheck } from 'lucide-react';

export default function RoleSelector() {
  const { setRole } = useAuth();

  const handleSelectRole = (role: UserRole) => {
    setRole(role);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl">Select Your Role</CardTitle>
        <CardDescription className="text-center">Choose a persona to explore the application's features.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => handleSelectRole('end-user')} className="w-full" size="lg">
            <User className="mr-2 h-5 w-5" />
            End User
        </Button>
        <Button onClick={() => handleSelectRole('hr')} className="w-full" size="lg" variant="secondary">
            <Briefcase className="mr-2 h-5 w-5" />
            HR Manager
        </Button>
        <Button onClick={() => handleSelectRole('consultant')} className="w-full" size="lg" variant="secondary">
            <UserCheck className="mr-2 h-5 w-5" />
            Consultant
        </Button>
      </CardContent>
    </Card>
  );
}
