

'use client';
import { useState, useEffect } from "react";
import { useUserData, CompanyUser } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import { format, parse } from 'date-fns';
import { supabase } from "@/lib/supabase-client";

const StatusBadge = ({ isComplete }: { isComplete: boolean }) => (
    isComplete ? (
        <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
    ) : (
        <Badge variant="outline">Pending</Badge>
    )
);


export default function AdminUserManagement() {
    const { toast } = useToast();
    const { 
        companyAssignments, 
        profileCompletions, 
        assessmentCompletions, 
        isLoading: isUserDataLoading,
        companyConfigs,
        setCompanyConfigs,
    } = useUserData();

    const [selectedCompany, setSelectedCompany] = useState("");
    const [users, setUsers] = useState<CompanyUser[]>([]);
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
            notified: false 
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
            setUsers(prev => [...prev, addedUser].sort((a,b) => (a.email > b.email) ? 1 : -1));
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email Address</TableHead>
                                    <TableHead>Company ID</TableHead>
                                    <TableHead>Notification Date</TableHead>
                                    <TableHead>Profile</TableHead>
                                    <TableHead>Assessment</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                                ) : users.length > 0 ? users.map(user => (
                                    <TableRow key={user.email}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.company_user_id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{user.notification_date ? format(parse(user.notification_date, 'yyyy-MM-dd', new Date()), 'PPP') : 'N/A'}</span>
                                                {user.is_invited ? (
                                                    <Badge className="bg-green-600 hover:bg-green-700 w-fit"><CheckCircle className="mr-1" /> Invited</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="w-fit">Pending</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge isComplete={!!profileCompletions[user.email]} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge isComplete={!!assessmentCompletions[user.email]} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                </>
            )}
        </div>
    );
}
