'use client';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminUserManagement from "@/components/admin/users/AdminUserManagement";
import HrUserManagement from "@/components/admin/users/HrUserManagement";

export default function UserManagementPage() {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (auth?.role === 'admin') {
        return <AdminUserManagement />;
    }

    if (auth?.role === 'hr') {
        return <HrUserManagement />;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                 </Card>
            </div>
        </div>
    );
}
