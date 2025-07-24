
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, CompanyAssignment, HrManager } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Crown, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';

export default function HrManagementPage() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const { companyAssignments, updateCompanyAssignment } = useUserData();

  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  
  const managedAssignments = useMemo(() => {
    if (!auth || auth.role !== 'hr') return [];
    return companyAssignments.filter(ca => 
      ca.hrManagers.some(hr => hr.email.toLowerCase() === auth.email?.toLowerCase() && hr.isPrimary)
    );
  }, [auth, companyAssignments]);

  const allHrEmails = useMemo(() => {
    const emails = new Set<string>();
    companyAssignments.forEach(ca => {
      ca.hrManagers.forEach(hr => emails.add(hr.email));
    });
    return Array.from(emails);
  }, [companyAssignments]);

  const handleAddHrManager = useCallback(() => {
    if (!newUserEmail || selectedCompanies.size === 0) {
      toast({ title: 'Missing Information', description: 'Please provide an email and select at least one company.', variant: 'destructive' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(newUserEmail)) {
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
        return;
    }
    
    selectedCompanies.forEach(companyName => {
        const assignment = companyAssignments.find(a => a.companyName === companyName);
        if (assignment && !assignment.hrManagers.some(hr => hr.email.toLowerCase() === newUserEmail.toLowerCase())) {
            const newHr: HrManager = { email: newUserEmail, isPrimary: false };
            updateCompanyAssignment(companyName, { hrManagers: [...assignment.hrManagers, newHr] });
        }
    });

    toast({ title: 'HR Manager Added', description: `${newUserEmail} has been added to the selected companies.` });
    setNewUserEmail('');
    setSelectedCompanies(new Set());
  }, [newUserEmail, selectedCompanies, companyAssignments, updateCompanyAssignment, toast]);

  const handleRemoveHrManager = useCallback((email: string, companyName: string) => {
    if (auth?.email && email.toLowerCase() === auth.email.toLowerCase()) {
        toast({ title: "Cannot Remove Self", description: "You cannot remove your own primary HR access.", variant: "destructive" });
        return;
    }
    const assignment = companyAssignments.find(a => a.companyName === companyName);
    if (assignment) {
        const updatedManagers = assignment.hrManagers.filter(hr => hr.email.toLowerCase() !== email.toLowerCase());
        updateCompanyAssignment(companyName, { hrManagers: updatedManagers });
        toast({ title: 'HR Manager Removed', description: `${email} has been removed from ${companyName}.` });
    }
  }, [auth, companyAssignments, updateCompanyAssignment, toast]);

  if (managedAssignments.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>HR Management</CardTitle>
                <CardDescription>You do not have primary management permissions for any companies.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">HR Team Management</h1>
            <p className="text-muted-foreground">
                As a Primary HR Manager, you can add or remove other HR managers for the companies you oversee.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Add New HR Manager</CardTitle>
                <CardDescription>Grant another user HR Manager access to one or more of your companies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="newUserEmail">New HR Manager's Email</Label>
                    <Input id="newUserEmail" placeholder="manager@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Assign to Companies</Label>
                    <div className="space-y-2 rounded-md border p-4">
                        {managedAssignments.map(ca => (
                            <div key={ca.companyName} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`company-${ca.companyName}`}
                                    checked={selectedCompanies.has(ca.companyName)}
                                    onCheckedChange={(checked) => {
                                        setSelectedCompanies(prev => {
                                            const next = new Set(prev);
                                            if (checked) next.add(ca.companyName);
                                            else next.delete(ca.companyName);
                                            return next;
                                        });
                                    }}
                                />
                                <Label htmlFor={`company-${ca.companyName}`} className="font-normal">{ca.companyName}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleAddHrManager}>
                    <PlusCircle className="mr-2" /> Add HR Manager
                </Button>
            </CardFooter>
        </Card>

        {managedAssignments.map(assignment => (
             <Card key={assignment.companyName}>
                <CardHeader>
                    <CardTitle>{assignment.companyName} HR Team</CardTitle>
                    <CardDescription>List of all HR managers with access to this company.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignment.hrManagers.map(hr => (
                                <TableRow key={hr.email}>
                                    <TableCell className="font-medium">{hr.email}</TableCell>
                                    <TableCell>
                                        {hr.isPrimary ? (
                                            <span className="flex items-center text-amber-600 font-semibold text-sm gap-2"><Crown className="h-4 w-4"/> Primary</span>
                                        ) : (
                                            <span className="flex items-center text-muted-foreground text-sm gap-2"><Shield className="h-4 w-4"/> Manager</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                         {!hr.isPrimary && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will revoke HR access for {hr.email} from {assignment.companyName}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemoveHrManager(hr.email, assignment.companyName)}>
                                                            Yes, Revoke Access
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                         )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
