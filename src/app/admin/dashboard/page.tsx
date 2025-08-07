
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, CheckSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
    const { platformUsers, companyAssignments, reviewQueue } = useUserData();
    
    const stats = useMemo(() => {
        const totalCompanies = companyAssignments.length;
        const totalPlatformUsers = platformUsers.length;
        const pendingReviews = reviewQueue.filter(item => item.status === 'pending').length;
        
        return { totalCompanies, totalPlatformUsers, pendingReviews };
    }, [companyAssignments, platformUsers, reviewQueue]);
    
    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        A high-level overview of the ExitBetter platform.
                    </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                            <p className="text-xs text-muted-foreground">Suggestions awaiting your approval</p>
                             <Button asChild variant="link" className="p-0 h-auto mt-2">
                                <Link href="/admin/review-queue">Go to Review Queue</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                            <p className="text-xs text-muted-foreground">Client companies onboarded</p>
                             <Button asChild variant="link" className="p-0 h-auto mt-2">
                                <Link href="/admin/companies">Manage Companies</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalPlatformUsers}</div>
                            <p className="text-xs text-muted-foreground">Admins & Consultants with access</p>
                            <Button asChild variant="link" className="p-0 h-auto mt-2">
                                <Link href="/admin/platform-users">Manage Users</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
