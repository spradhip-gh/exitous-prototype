

'use client';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserData, CompanyUser } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isToday, isPast } from 'date-fns';
import { cn } from "@/lib/utils";
import { Send, CheckCircle, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SortConfig } from './AdminUserManagement';

const StatusBadge = ({ isComplete }: { isComplete: boolean }) => (
    isComplete ? (
        <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
    ) : (
        <Badge variant="outline">Pending</Badge>
    )
);

const SortableHeader = ({
  children,
  sortKey,
  sortConfig,
  requestSort,
}: {
  children: React.ReactNode;
  sortKey: SortConfig['key'];
  sortConfig: SortConfig;
  requestSort: (key: SortConfig['key']) => void;
}) => {
  const isSorted = sortConfig.key === sortKey;

  return (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="px-2 py-1 h-auto">
        {children}
        <ArrowUpDown className={cn("ml-2 h-4 w-4", !isSorted && "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
};


export default function HrUserTable({ users, onDeleteUser, selectedUsers, setSelectedUsers, sortConfig, requestSort, isLoading }: {
    users: CompanyUser[];
    onDeleteUser: (user: CompanyUser) => void;
    selectedUsers: Set<string>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    sortConfig: SortConfig;
    requestSort: (key: SortConfig['key']) => void;
    isLoading: boolean;
}) {
    const { profileCompletions, assessmentCompletions } = useUserData();

    const handleToggleSelection = (email: string) => {
        setSelectedUsers(prev => {
            const newSelection = new Set(prev);
            const user = users.find(u => u.email === email);
            if (user?.is_invited) return newSelection;
            if (newSelection.has(email)) newSelection.delete(email);
            else newSelection.add(email);
            return newSelection;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedUsers(new Set(users.filter(u => !u.is_invited).map(u => u.email)));
        else setSelectedUsers(new Set());
    };
    
    const selectableUserCount = users.filter(u => !u.is_invited).length;
    const isAllSelected = selectableUserCount > 0 && selectedUsers.size === selectableUserCount;
    const isSomeSelected = selectedUsers.size > 0 && !isAllSelected;

    return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all" data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}/>
                        </TableHead>
                        <SortableHeader sortKey="email" sortConfig={sortConfig} requestSort={requestSort}>Email Address</SortableHeader>
                        <SortableHeader sortKey="company_user_id" sortConfig={sortConfig} requestSort={requestSort}>Company ID</SortableHeader>
                        <SortableHeader sortKey="notification_date" sortConfig={sortConfig} requestSort={requestSort}>Notification Date</SortableHeader>
                        <SortableHeader sortKey="profileStatus" sortConfig={sortConfig} requestSort={requestSort}>Profile</SortableHeader>
                        <SortableHeader sortKey="assessmentStatus" sortConfig={sortConfig} requestSort={requestSort}>Assessment</SortableHeader>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                           <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ))
                    ) : users.length > 0 ? users.map(user => {
                        const isSelectionDisabled = user.is_invited;
                        return (
                            <TableRow key={user.id} data-selected={selectedUsers.has(user.email)} className={cn(user.is_invited && "bg-muted/50 text-muted-foreground")}>
                                <TableCell><Checkbox checked={selectedUsers.has(user.email)} onCheckedChange={() => handleToggleSelection(user.email)} aria-label={`Select ${user.email}`} disabled={isSelectionDisabled}/></TableCell>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.company_user_id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{user.notification_date ? format(parse(user.notification_date, 'yyyy-MM-dd', new Date()), 'PPP') : 'N/A'}</span>
                                        {user.is_invited ? <Badge className="bg-green-600 hover:bg-green-700 w-fit"><CheckCircle className="mr-1" /> Invited</Badge> : <Badge variant="secondary" className="w-fit">Pending</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge isComplete={!!profileCompletions[user.email]} /></TableCell>
                                <TableCell><StatusBadge isComplete={!!assessmentCompletions[user.email]} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-1">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the user "{user.email}". This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteUser(user)}>Yes, Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No users added for this company yet.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
    );
}
