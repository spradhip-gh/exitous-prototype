

'use client';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserData, CompanyUser } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from "@/components/ui/skeleton";
import { format, parse, isValid } from 'date-fns';
import { supabase } from "@/lib/supabase-client";
import HrUserTable from "./HrUserTable";
import type { SortConfig } from './HrUserManagement';

export default function AdminUserManagement() {
    const { toast } = useToast();
    const { 
        companyAssignments, 
        isLoading: isUserDataLoading,
        companyConfigs,
        setCompanyConfigs,
    } = useUserData();

    const [selectedCompany, setSelectedCompany] = useState("");
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'notification_date', direction: 'asc' });
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [newNotificationDate, setNewNotificationDate] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedCompany && companyConfigs[selectedCompany]) {
            setIsLoading(true);
            const companyUsers = companyConfigs[selectedCompany]?.users || [];
            setUsers(companyUsers.sort((a,b) => (a.email > b.email) ? 1 : -1));
            setIsLoading(false);
        } else {
            setUsers([]);
        }
    }, [selectedCompany, companyConfigs]);

    const sortedUsers = useMemo(() => {
        const sorted = [...users].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof CompanyUser];
            const bValue = b[sortConfig.key as keyof CompanyUser];
            
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [users, sortConfig]);

    const requestSort = useCallback((key: SortConfig['key']) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);
    
    const handleAddUser = async () => {
        if (!newUserEmail || !newCompanyId || !newNotificationDate) {
            toast({ title: "All Fields Required", description: "Please enter email, Company ID, and notification date.", variant: "destructive" });
            return;
        }

        const assignment = companyAssignments?.find(a => a.companyName === selectedCompany);
        if (!assignment) {
            toast({ title: "Error", description: "Could not find company assignment.", variant: "destructive" });
            return;
        }

        if (assignment && users.length >= assignment.maxUsers) {
            toast({ title: "User Limit Reached", description: `You have reached the maximum of ${assignment.maxUsers} users for this company.`, variant: "destructive" });
            return;
        }

        if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
            toast({ title: "User Exists", description: "A user with this email address already exists for this company.", variant: "destructive" });
            return;
        }
        
        const newUser: Partial<CompanyUser> = {
            company_id: assignment.companyId,
            email: newUserEmail, 
            company_user_id: newCompanyId, 
            notification_date: newNotificationDate, 
            is_invited: false 
        };

        const { data, error } = await supabase
            .from('company_users')
            .insert(newUser)
            .select()
            .single();

        if (error || !data) {
            toast({ title: "Error Adding User", description: error?.message || "An unknown error occurred.", variant: "destructive" });
        } else {
            const addedUser = data as CompanyUser;
            setUsers(prev => [...prev, addedUser]);
            // Update the global state
            setCompanyConfigs(prev => ({
                ...prev,
                [selectedCompany]: {
                    ...prev[selectedCompany],
                    users: [...(prev[selectedCompany]?.users || []), addedUser]
                }
            }));
            setNewUserEmail("");
            setNewCompanyId("");
            setNewNotificationDate("");
            toast({ title: "User Added", description: `${newUserEmail} has been added.` });
        }
    };

    const handleDeleteUser = async (userToDelete: CompanyUser) => {
        const { error } = await supabase.from('company_users').delete().match({ id: userToDelete.id });
        if (error) {
            toast({ title: "Error Removing User", description: error.message, variant: "destructive" });
        } else {
            const newUsers = users.filter(u => u.id !== userToDelete.id);
            setUsers(newUsers);
            setCompanyConfigs(prev => ({
                ...prev,
                [selectedCompany]: {
                    ...prev[selectedCompany],
                    users: newUsers,
                }
            }));
            toast({ title: "User Removed", description: `${userToDelete.email} has been removed.` });
        }
    };

    const currentCompanyAssignment = companyAssignments?.find(a => a.companyName === selectedCompany);

    if (isUserDataLoading) {
        return (
             <div className="p-4 md:p-8 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                    Manage employee lists for all companies.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Select Company</CardTitle>
                    <CardDescription>Choose a company to manage its employee list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedCompany} value={selectedCompany}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a company..." />
                        </SelectTrigger>
                        <SelectContent>
                            {companyAssignments && companyAssignments.length > 0 ? companyAssignments.map(c => (
                                <SelectItem key={c.companyName} value={c.companyName}>{c.companyName}</SelectItem>
                            )) : <SelectItem value="none" disabled>No companies available</SelectItem>}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedCompany && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Add New User</CardTitle>
                        <CardDescription>
                            Add an employee to <span className="font-bold">{selectedCompany}</span>.
                            This company has {users.length} of {currentCompanyAssignment?.maxUsers ?? 'N/A'} users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="newUserEmail">Email Address</Label>
                                <Input id="newUserEmail" placeholder="employee@email.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newCompanyId">Company ID #</Label>
                                <Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="newNotificationDate">Notification Date</Label>
                                <Input id="newNotificationDate" type="date" value={newNotificationDate} onChange={e => setNewNotificationDate(e.target.value)} />
                            </div>
                            <Button onClick={handleAddUser} className="self-end">
                                <PlusCircle className="mr-2" /> Add User
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee List</CardTitle>
                        <CardDescription>Employees who can log in and complete the assessment for <span className="font-bold">{selectedCompany}</span>.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HrUserTable 
                            users={sortedUsers} 
                            onDeleteUser={handleDeleteUser}
                            selectedUsers={selectedUsers} 
                            setSelectedUsers={setSelectedUsers} 
                            sortConfig={sortConfig} 
                            requestSort={requestSort}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
                </>
            )}
        </div>
    );
}
