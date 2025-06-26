'use client';

import { useState } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
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

export default function CompanyManagementPage() {
  const { toast } = useToast();
  const { 
    companyAssignments, 
    addCompanyAssignment, 
    deleteCompanyAssignment,
    getAllCompanyConfigs,
    assessmentCompletions 
  } = useUserData();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newHrEmail, setNewHrEmail] = useState('');

  const handleAddCompany = () => {
    if (!newCompanyName || !newHrEmail) {
      toast({ title: "All Fields Required", description: "Please enter a company name and an HR manager's email.", variant: "destructive" });
      return;
    }
    if (companyAssignments.some(a => a.companyName.toLowerCase() === newCompanyName.toLowerCase())) {
        toast({ title: "Company Exists", description: "A company with this name already exists.", variant: "destructive" });
        return;
    }
    if (companyAssignments.some(a => a.hrManagerEmail.toLowerCase() === newHrEmail.toLowerCase())) {
        toast({ title: "HR Manager Assigned", description: "This HR manager is already assigned to another company.", variant: "destructive" });
        return;
    }

    addCompanyAssignment({ companyName: newCompanyName, hrManagerEmail: newHrEmail });
    toast({ title: "Company Added", description: `${newCompanyName} has been created and assigned.` });
    setNewCompanyName('');
    setNewHrEmail('');
  };

  const handleDeleteCompany = (companyName: string) => {
    deleteCompanyAssignment(companyName);
    toast({ title: "Company Removed", description: `${companyName} and its assignment have been removed.` });
  };
  
  const allConfigs = getAllCompanyConfigs();
  const companyDataWithStats = companyAssignments.map(assignment => {
      const companyConfig = allConfigs[assignment.companyName];
      const users = companyConfig?.users || [];
      const usersAdded = users.length;
      const assessmentsCompleted = users.filter(u => assessmentCompletions?.[u.email]).length;
      return {
          ...assignment,
          usersAdded,
          assessmentsCompleted
      };
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">Company Management</h1>
            <p className="text-muted-foreground">
                Create companies and assign HR Managers to them.
            </p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Add New Company</CardTitle>
                <CardDescription>Create a new company profile and assign its HR manager.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="newCompanyName">Company Name</Label>
                        <Input id="newCompanyName" placeholder="e.g., Globex Corp" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newHrEmail">HR Manager Email</Label>
                        <Input id="newHrEmail" placeholder="hr@globex.com" value={newHrEmail} onChange={e => setNewHrEmail(e.target.value)} />
                    </div>
                    <Button onClick={handleAddCompany} className="self-end">
                        <PlusCircle className="mr-2" /> Add Company
                    </Button>
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Assigned Companies</CardTitle>
                <CardDescription>List of all companies and their designated HR managers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>HR Manager Email</TableHead>
                            <TableHead>Users Added</TableHead>
                            <TableHead>Assessments Completed</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companyDataWithStats.length > 0 ? companyDataWithStats.map(assignment => (
                            <TableRow key={assignment.companyName}>
                                <TableCell className="font-medium">{assignment.companyName}</TableCell>
                                <TableCell>{assignment.hrManagerEmail}</TableCell>
                                <TableCell className="text-center">{assignment.usersAdded}</TableCell>
                                <TableCell className="text-center">{assignment.assessmentsCompleted}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will delete the company and its HR assignment. This action cannot be undone. User and form data for this company will remain but will be inaccessible.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteCompany(assignment.companyName)}>
                                                    Yes, Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">No companies have been created yet.</TableCell>
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
