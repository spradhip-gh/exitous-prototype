import UserManagement from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
                Add and manage employee access for company-specific assessments.
            </p>
        </div>
        <UserManagement />
      </div>
    </div>
  );
}
