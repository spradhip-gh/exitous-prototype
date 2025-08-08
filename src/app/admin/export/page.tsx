'use client';

import { useMemo } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { format, parse, isPast } from 'date-fns';
import * as XLSX from 'xlsx';


interface ExportableUser {
  email: string;
  role: string;
  company: string;
  companyId?: string;
  notificationDate?: string;
  notified?: string;
  profileStatus?: string;
  assessmentStatus?: string;
}

export default function ExportUsersPage() {
  const { platformUsers, companyAssignments, getAllCompanyConfigs, profileCompletions, assessmentCompletions } = useUserData();

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
        notificationDate: 'N/A',
        notified: 'N/A',
        profileStatus: 'N/A',
        assessmentStatus: 'N/A',
      });
    });

    // 2. Add HR Managers
    companyAssignments.forEach(assignment => {
      users.push({
        email: assignment.hrManagers[0]?.email,
        role: 'HR Manager',
        company: assignment.companyName,
        companyId: 'N/A',
        notificationDate: 'N/A',
        notified: 'N/A',
        profileStatus: 'N/A',
        assessmentStatus: 'N/A',
      });
    });

    // 3. Add End-Users
    Object.entries(allCompanyConfigs).forEach(([companyName, config]) => {
      config.users?.forEach(user => {
        // Avoid duplicating users who might have multiple roles, though the current data model makes this unlikely.
        if (!users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
          let notificationDateDisplay = 'N/A';
            if (user.notificationDate) {
                const date = parse(user.notificationDate, 'yyyy-MM-dd', new Date());
                notificationDateDisplay = isPast(date) ? 'Past' : 'Future';
            }
            
          users.push({
            email: user.email,
            role: 'End-User',
            company: companyName,
            companyId: user.company_user_id,
            notified: user.is_invited ? 'Invited' : 'Pending',
            profileStatus: profileCompletions[user.email] ? 'Completed' : 'Pending',
            assessmentStatus: assessmentCompletions[user.email] ? 'Completed' : 'Pending',
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

  }, [platformUsers, companyAssignments, getAllCompanyConfigs, profileCompletions, assessmentCompletions]);

  const handleExport = () => {
    const dataToExport = allUsers.map(user => ({
      'Email Address': user.email,
      'Role': user.role,
      'Company': user.company,
      'Company ID': user.companyId || 'N/A',
      'Invitation Status': user.notified || 'N/A',
      'Profile Status': user.profileStatus || 'N/A',
      'Assessment Status': user.assessmentStatus || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Users");
    XLSX.writeFile(workbook, "exitbetter_all_users_export.xlsx");
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status || status === 'N/A') return 'N/A';
    
    switch (status) {
        case 'Completed':
        case 'Invited':
            return <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">{status}</Badge>;
        case 'Pending':
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">Export User Data</h1>
                <p className="text-muted-foreground">
                    View and export a list of all users across the platform.
                </p>
            </div>
            <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export as Excel
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
                            <TableHead>Notification Date</TableHead>
                            <TableHead>Invited</TableHead>
                            <TableHead>Profile</TableHead>
                            <TableHead>Assessment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allUsers.length > 0 ? allUsers.map((user, index) => (
                            <TableRow key={`${user.email}-${index}`}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.company}</TableCell>
                                <TableCell>{user.notificationDate}</TableCell>
                                <TableCell>{getStatusBadge(user.notified)}</TableCell>
                                <TableCell>{getStatusBadge(user.profileStatus)}</TableCell>
                                <TableCell>{getStatusBadge(user.assessmentStatus)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">No users found.</TableCell>
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
