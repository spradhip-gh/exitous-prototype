'use client';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyUser } from "@/hooks/use-user-data";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Main switcher component
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


// ##################################
// #      ADMIN USER MANAGEMENT     #
// ##################################
function AdminUserManagement() {
    const { toast } = useToast();
    const { getAllCompanyConfigs, saveCompanyUsers, companyAssignments, assessmentCompletions } = useUserData();

    const [selectedCompany, setSelectedCompany] = useState("");
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedCompany) {
            setIsLoading(true);
            const configs = getAllCompanyConfigs();
            const companyUsers = configs[selectedCompany]?.users || [];
            setUsers(companyUsers);
            setIsLoading(false);
        } else {
            setUsers([]);
        }
    }, [selectedCompany, getAllCompanyConfigs]);
    
    const handleAddUser = () => {
        if (!newUserEmail || !newCompanyId) {
            toast({ title: "All Fields Required", description: "Please enter both an email and a Company ID.", variant: "destructive" });
            return;
        }

        const assignment = companyAssignments.find(a => a.companyName === selectedCompany);
        if (assignment && users.length >= assignment.maxUsers) {
            toast({ title: "User Limit Reached", description: `You have reached the maximum of ${assignment.maxUsers} users for this company.`, variant: "destructive" });
            return;
        }

        if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
            toast({ title: "User Exists", description: "A user with this email address already exists for this company.", variant: "destructive" });
            return;
        }
        const newUsers = [...users, { email: newUserEmail, companyId: newCompanyId }];
        setUsers(newUsers);
        saveCompanyUsers(selectedCompany, newUsers);
        setNewUserEmail("");
        setNewCompanyId("");
        toast({ title: "User Added", description: `${newUserEmail} has been added.` });
    };

    const handleDeleteUser = (email: string) => {
        const newUsers = users.filter(u => u.email !== email);
        setUsers(newUsers);
        saveCompanyUsers(selectedCompany, newUsers);
        toast({ title: "User Removed", description: `${email} has been removed.` });
    };

    const currentCompanyAssignment = companyAssignments.find(a => a.companyName === selectedCompany);

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
                            {companyAssignments.length > 0 ? companyAssignments.map(c => (
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
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newUserEmail">Email Address</Label>
                                <Input id="newUserEmail" placeholder="employee@email.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newCompanyId">Company ID #</Label>
                                <Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} />
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
                                    <TableHead>Assessment Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                                ) : users.length > 0 ? users.map(user => (
                                    <TableRow key={user.email}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.companyId}</TableCell>
                                        <TableCell>
                                            {assessmentCompletions?.[user.email] ? (
                                                <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
                                            ) : (
                                                <Badge variant="outline">Not Started</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.email)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
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

// ##################################
// #       HR USER MANAGEMENT       #
// ##################################
function HrUserManagement() {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { getAllCompanyConfigs, saveCompanyUsers, assessmentCompletions, companyAssignmentForHr } = useUserData();

    const companyName = auth?.companyName;
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (companyName) {
            setIsLoading(true);
            const configs = getAllCompanyConfigs();
            const companyUsers = configs[companyName]?.users || [];
            setUsers(companyUsers);
            setIsLoading(false);
        }
    }, [companyName, getAllCompanyConfigs]);

    const handleAddUser = () => {
        if (!newUserEmail || !newCompanyId) {
            toast({ title: "All Fields Required", description: "Please enter both an email and a Company ID.", variant: "destructive" });
            return;
        }

        if (companyAssignmentForHr && users.length >= companyAssignmentForHr.maxUsers) {
            toast({ title: "User Limit Reached", description: `You have reached the maximum of ${companyAssignmentForHr.maxUsers} users for your plan.`, variant: "destructive" });
            return;
        }

        if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
            toast({ title: "User Exists", description: "A user with this email address already exists for this company.", variant: "destructive" });
            return;
        }
        if (!companyName) {
            toast({ title: "Error", description: "Company not identified. Cannot add user.", variant: "destructive" });
            return;
        }
        const newUsers = [...users, { email: newUserEmail, companyId: newCompanyId }];
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        setNewUserEmail("");
        setNewCompanyId("");
        toast({ title: "User Added", description: `${newUserEmail} has been added.` });
    };

    const handleDeleteUser = (email: string) => {
        if (!companyName) return;
        const newUsers = users.filter(u => u.email !== email);
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "User Removed", description: `${email} has been removed.` });
    };
    
    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!companyName) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>No company is assigned to your HR account.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
             <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                    Manage the employee list for {companyName}.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>
                        Add an employee who will need to access the assessment for <span className="font-bold">{companyName}</span>.
                        You have added {users.length} of {companyAssignmentForHr?.maxUsers ?? 'N/A'} users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newUserEmail">Email Address</Label>
                            <Input id="newUserEmail" placeholder="employee@email.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="newCompanyId">Company ID #</Label>
                            <Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} />
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
                    <CardDescription>Employees who can log in and complete the assessment for <span className="font-bold">{companyName}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email Address</TableHead>
                                <TableHead>Company ID</TableHead>
                                <TableHead>Assessment Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? users.map(user => (
                                <TableRow key={user.email}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.companyId}</TableCell>
                                    <TableCell>
                                        {assessmentCompletions?.[user.email] ? (
                                            <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
                                        ) : (
                                            <Badge variant="outline">Not Started</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.email)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
