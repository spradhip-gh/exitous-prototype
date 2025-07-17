'use client';
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import AdminFormEditor from "@/components/admin/forms/AdminFormEditor";
import HrFormEditor from "@/components/admin/forms/HrFormEditor";

export default function FormEditorSwitchPage() {
    const { auth } = useAuth();

    if (auth?.role === 'admin') {
        return <AdminFormEditor />;
    }

    if (auth?.role === 'hr') {
        return <HrFormEditor />;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                 <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
