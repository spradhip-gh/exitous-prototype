
'use client';

import { useAuth } from './use-auth';
import { EndUserProvider } from './use-end-user-data';
import { HrProvider } from './use-hr-data';
import { AdminProvider } from './use-admin-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Card className="w-1/2">
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-32 w-full" /></CardContent>
                </Card>
            </div>
        );
    }

    if (auth?.role === 'admin' || auth?.role === 'consultant') {
        return <AdminProvider>{children}</AdminProvider>;
    }

    if (auth?.role === 'hr') {
        return <HrProvider email={auth.email!}>{children}</HrProvider>;
    }

    if (auth?.role === 'end-user') {
        return <EndUserProvider>{children}</EndUserProvider>;
    }

    // For unauthenticated users (e.g., on the login page)
    return <>{children}</>;
}
