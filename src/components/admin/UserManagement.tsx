'use client';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyUser } from "@/hooks/use-user-data";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export default function UserManagement() {
    const { toast } = useToast();
    const { getAllCompanyConfigs, saveCompanyUsers } = useUserData();

    const [companyName, setCompanyName] = useState("");
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLoadCompany = () => {
        if (!companyName) {
            toast({ title: "Company Name Required", description: "Please enter a company name to load its user list.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const configs = getAllCompanyConfigs();
        const companyUsers = configs[companyName]?.users || [];
        setUsers(companyUsers);
        toast({ title: "User List Loaded", description: `Displaying users for ${companyName}.` });
        setIsLoading(false);
    };
    
    const handleAddUser = () => {
        if (!newUserEmail || !newCompanyId) {
            toast({ title: "All Fields Required", description: "Please enter both an email and a Company ID.", variant: "destructive" });
            return;
        }
        if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
            toast({ title: "User Exists", description: "A user with this email address already exists for this company.", variant: "destructive" });
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
        const newUsers = users.filter(u => u.email !== email);
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "User Removed", description: `${email} has been removed.` });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Select Company</CardTitle>
                    <CardDescription>Enter the company name to manage its employee list.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input placeholder="Enter Company Name (e.g., Acme Inc.)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    <Button onClick={handleLoadCompany} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Load"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>Add an employee who will need to access the assessment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newUserEmail">Email Address</Label>
                            <Input id="newUserEmail" placeholder="employee@email.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} disabled={!companyName}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="newCompanyId">Company ID #</Label>
                            <Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} disabled={!companyName}/>
                        </div>
                        <Button onClick={handleAddUser} disabled={!companyName} className="self-end">
                            <PlusCircle className="mr-2" /> Add User
                        </Button>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Employee List</CardTitle>
                    <CardDescription>Employees who can log in and complete the assessment for <span className="font-bold">{companyName || "the selected company"}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email Address</TableHead>
                                <TableHead>Company ID</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? users.map(user => (
                                <TableRow key={user.email}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.companyId}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.email)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
