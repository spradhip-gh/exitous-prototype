'use client';

import { useState } from 'react';
import { useUserData, CompanyAssignment } from '@/hooks/use-user-data.tsx';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CompanyManagementPage() {
  const { toast } = useToast();
  const { 
    companyAssignments, 
    addCompanyAssignment, 
    deleteCompanyAssignment,
    updateCompanyAssignment,
    getAllCompanyConfigs,
    assessmentCompletions 
  } = useUserData();
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newHrEmail, setNewHrEmail] = useState('');
  const [newCompanyVersion, setNewCompanyVersion] = useState<'basic' | 'pro'>('basic');
  const [newMaxUsers, setNewMaxUsers] = useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyAssignment | null>(null);
  const [editedMaxUsers, setEditedMaxUsers] = useState('');

  const handleAddCompany = () => {
    if (!newCompanyName || !newHrEmail || !newMaxUsers) {
      toast({ title: "All Fields Required", description: "Please fill out all fields.", variant: "destructive" });
      return;
    }
    const maxUsersNum = parseInt(newMaxUsers, 10);
    if (isNaN(maxUsersNum) || maxUsersNum <= 0) {
      toast({ title: "Invalid User Limit", description: "Maximum users must be a positive number.", variant: "destructive" });
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

    addCompanyAssignment({ 
        companyName: newCompanyName, 
        hrManagerEmail: newHrEmail,
        version: newCompanyVersion,
        maxUsers: maxUsersNum
    });
    toast({ title: "Company Added", description: `${newCompanyName} has been created and assigned.` });
    setNewCompanyName('');
    setNewHrEmail('');
    setNewMaxUsers('');
    setNewCompanyVersion('basic');
  };

  const handleDeleteCompany = (companyName: string) => {
    deleteCompanyAssignment(companyName);
    toast({ title: "Company Removed", description: `${companyName} and its assignment have been removed.` });
  };
  
  const handleEditClick = (company: CompanyAssignment) => {
    setEditingCompany(company);
    setEditedMaxUsers(company.maxUsers?.toString() ?? '');
    setIsEditDialogOpen(true);
  }

  const handleSaveChanges = () => {
    if (!editingCompany) return;
    
    const maxUsersNum = parseInt(editedMaxUsers, 10);
     if (isNaN(maxUsersNum) || maxUsersNum <= 0) {
      toast({ title: "Invalid User Limit", description: "Maximum users must be a positive number.", variant: "destructive" });
      return;
    }

    updateCompanyAssignment(editingCompany.companyName, { maxUsers: maxUsersNum });
    toast({ title: "Company Updated", description: "Changes have been saved." });
    setIsEditDialogOpen(false);
    setEditingCompany(null);
  }

  const handleUpgrade = (companyName: string) => {
    updateCompanyAssignment(companyName, { version: 'pro' });
    toast({ title: "Company Upgraded", description: `${companyName} is now on the Pro version.` });
    setIsEditDialogOpen(false);
    setEditingCompany(null);
  }

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
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">Company Management</h1>
            <p className="text-muted-foreground">
                Create companies, assign HR Managers, and manage subscription tiers.
            </p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Add New Company</CardTitle>
                <CardDescription>Create a new company profile and assign its HR manager.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="newCompanyName">Company Name</Label>
                        <Input id="newCompanyName" placeholder="e.g., Globex Corp" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
                    </div>
                     <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="newHrEmail">HR Manager Email</Label>
                        <Input id="newHrEmail" type="email" placeholder="hr@globex.com" value={newHrEmail} onChange={e => setNewHrEmail(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newCompanyVersion">Version</Label>
                        <Select value={newCompanyVersion} onValueChange={(v) => setNewCompanyVersion(v as any)}>
                            <SelectTrigger id="newCompanyVersion"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newMaxUsers">Max Users</Label>
                        <Input id="newMaxUsers" type="number" placeholder="e.g., 50" value={newMaxUsers} onChange={e => setNewMaxUsers(e.target.value)} />
                    </div>
                    <Button onClick={handleAddCompany} className="self-end lg:col-start-5">
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
                            <TableHead>Company</TableHead>
                            <TableHead>HR Manager</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Users Added</TableHead>
                            <TableHead>Max Users</TableHead>
                            <TableHead>Assessments Done</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companyDataWithStats.length > 0 ? companyDataWithStats.map(assignment => {
                            const version = assignment.version || 'basic';
                            return (
                                <TableRow key={assignment.companyName}>
                                    <TableCell className="font-medium">{assignment.companyName}</TableCell>
                                    <TableCell>{assignment.hrManagerEmail}</TableCell>
                                    <TableCell>
                                        <Badge variant={version === 'pro' ? 'default' : 'secondary'} className={version === 'pro' ? 'bg-green-600' : ''}>
                                            {version.charAt(0).toUpperCase() + version.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{assignment.usersAdded}</TableCell>
                                    <TableCell className="text-center">{assignment.maxUsers ?? '—'}</TableCell>
                                    <TableCell className="text-center">{assignment.assessmentsCompleted}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(assignment)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
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
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">No companies have been created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {editingCompany?.companyName}</DialogTitle>
                    <DialogDescription>
                        Update company settings. Changes will be applied immediately.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="max-users">Max Users</Label>
                        <Input 
                            id="max-users" 
                            type="number" 
                            value={editedMaxUsers} 
                            onChange={(e) => setEditedMaxUsers(e.target.value)} 
                        />
                    </div>
                    {(editingCompany?.version || 'basic') === 'basic' && (
                         <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-base">Upgrade to Pro</CardTitle>
                                <CardDescription className="text-xs">
                                    Unlock form editing capabilities for the HR Manager. This action cannot be undone.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button size="sm" onClick={() => handleUpgrade(editingCompany!.companyName)}>Upgrade to Pro</Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
