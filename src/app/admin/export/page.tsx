'use client';

import { useMemo } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';

interface ExportableUser {
  email: string;
  role: string;
  company: string;
  companyId?: string;
}

export default function ExportUsersPage() {
  const { platformUsers, companyAssignments, getAllCompanyConfigs } = useUserData();

  const allUsers = useMemo(() => {
    const users: ExportableUser[] = [];
    const allCompanyConfigs = getAllCompanyConfigs();

    // 1. Add Platform Users (Admins, Consultants)
    platformUsers.forEach(user => {
      users.push({
        email: user.email,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        company: 'Platform',
        companyId: 'N/A',
      });
    });

    // 2. Add HR Managers
    companyAssignments.forEach(assignment => {
      users.push({
        email: assignment.hrManagerEmail,
        role: 'HR Manager',
        company: assignment.companyName,
        companyId: 'N/A',
      });
    });

    // 3. Add End-Users
    Object.entries(allCompanyConfigs).forEach(([companyName, config]) => {
      config.users?.forEach(user => {
        // Avoid duplicating users who might have multiple roles, though the current data model makes this unlikely.
        if (!users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
          users.push({
            email: user.email,
            role: 'End-User',
            company: companyName,
            companyId: user.companyId,
          });
        }
      });
    });

    // Sort by company then role
    return users.sort((a, b) => {
        if (a.company < b.company) return -1;
        if (a.company > b.company) return 1;
        if (a.role < b.role) return -1;
        if (a.role > b.role) return 1;
        return a.email.localeCompare(b.email);
    });

  }, [platformUsers, companyAssignments, getAllCompanyConfigs]);

  const handleExportCSV = () => {
    const headers = ['Email Address', 'Role', 'Company', 'Company ID'];
    const csvRows = [
      headers.join(','),
      ...allUsers.map(user => 
        [
          `"${user.email}"`,
          `"${user.role}"`,
          `"${user.company}"`,
          `"${user.companyId || 'N/A'}"`
        ].join(',')
      )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'exitbetter_user_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">Export User Data</h1>
                <p className="text-muted-foreground">
                    View and export a list of all users across the platform.
                </p>
            </div>
            <Button onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A combined list of platform users, HR managers, and end-users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email Address</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Company ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allUsers.length > 0 ? allUsers.map((user, index) => (
                            <TableRow key={`${user.email}-${index}`}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.company}</TableCell>
                                <TableCell>{user.companyId || 'N/A'}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    