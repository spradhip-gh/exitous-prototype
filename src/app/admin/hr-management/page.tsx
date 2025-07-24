

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, CompanyAssignment, HrManager, HrPermissions } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Crown, Shield, Pencil } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';


const defaultPermissions: HrPermissions = {
    userManagement: 'read',
    formEditor: 'read',
    resources: 'read',
    companySettings: 'read',
};

export default function HrManagementPage() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const { companyAssignments, updateCompanyAssignment, saveCompanyAssignments } = useUserData();

  const [newUserEmail, setNewUserEmail] = useState('');
  const [companyPermissions, setCompanyPermissions] = useState<Record<string, HrPermissions>>({});

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<{manager: HrManager, companyName: string} | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<HrPermissions>(defaultPermissions);
  
  const managedAssignments = useMemo(() => {
    if (!auth || auth.role !== 'hr') return [];
    return companyAssignments.filter(ca => 
      ca.hrManagers.some(hr => hr.email.toLowerCase() === auth.email?.toLowerCase() && hr.isPrimary)
    );
  }, [auth, companyAssignments]);

  const handlePermissionChange = (companyName: string, area: keyof HrPermissions, value: string) => {
    setCompanyPermissions(prev => ({
        ...prev,
        [companyName]: {
            ...(prev[companyName] || defaultPermissions),
            [area]: value
        }
    }));
  };

  const handleAddHrManager = useCallback(() => {
    if (!newUserEmail) {
      toast({ title: 'Email Required', description: 'Please provide an email for the new HR manager.', variant: 'destructive' });
      return;
    }
    const companiesToUpdate = Object.keys(companyPermissions);
    if (companiesToUpdate.length === 0) {
        toast({ title: 'No Companies Selected', description: 'Please assign the new manager to at least one company.', variant: 'destructive' });
        return;
    }

    if (!/\S+@\S+\.\S+/.test(newUserEmail)) {
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
        return;
    }

    // Create a new list of assignments with all updates applied
    const newAssignments = companyAssignments.map(assignment => {
        if (companiesToUpdate.includes(assignment.companyName)) {
             if (assignment.hrManagers.some(hr => hr.email.toLowerCase() === newUserEmail.toLowerCase())) {
                // User already exists in this company, skip
                return assignment;
            }
            const newHr: HrManager = { email: newUserEmail, isPrimary: false, permissions: companyPermissions[assignment.companyName] };
            return {
                ...assignment,
                hrManagers: [...assignment.hrManagers, newHr]
            };
        }
        return assignment;
    });

    saveCompanyAssignments(newAssignments);
    
    toast({ title: 'HR Manager Added', description: `${newUserEmail} has been added to the selected companies.` });
    setNewUserEmail('');
    setCompanyPermissions({});
  }, [newUserEmail, companyPermissions, companyAssignments, saveCompanyAssignments, toast]);
  
  const handleEditClick = (manager: HrManager, companyName: string) => {
    setEditingManager({ manager, companyName });
    setEditedPermissions(manager.permissions);
    setIsEditDialogOpen(true);
  }

  const handleSavePermissions = () => {
    if (!editingManager) return;
    
    const { manager, companyName } = editingManager;
    const assignment = companyAssignments.find(a => a.companyName === companyName);
    if (assignment) {
        const updatedManagers = assignment.hrManagers.map(hr => 
            hr.email.toLowerCase() === manager.email.toLowerCase()
                ? { ...hr, permissions: editedPermissions }
                : hr
        );
        updateCompanyAssignment(companyName, { hrManagers: updatedManagers });
        toast({ title: 'Permissions Updated', description: `Permissions for ${manager.email} have been updated.` });
        setIsEditDialogOpen(false);
        setEditingManager(null);
    }
  };

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
                As a Primary HR Manager, you can add or remove other HR managers for the companies you oversee and set their permissions.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Add New HR Manager</CardTitle>
                <CardDescription>Grant another user HR Manager access. Select companies and set permissions for each.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="newUserEmail">New HR Manager's Email</Label>
                    <Input id="newUserEmail" placeholder="manager@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Assign to Companies & Set Permissions</Label>
                    <div className="space-y-4 rounded-md border p-4">
                        {managedAssignments.map(ca => {
                            const isAssigned = !!companyPermissions[ca.companyName];
                            return (
                                <div key={ca.companyName} className="space-y-3 rounded-md border p-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`company-${ca.companyName}`}
                                            checked={isAssigned}
                                            onCheckedChange={(checked) => {
                                                setCompanyPermissions(prev => {
                                                    const next = { ...prev };
                                                    if (checked) next[ca.companyName] = defaultPermissions;
                                                    else delete next[ca.companyName];
                                                    return next;
                                                });
                                            }}
                                        />
                                        <Label htmlFor={`company-${ca.companyName}`} className="font-semibold text-base">{ca.companyName}</Label>
                                    </div>
                                    {isAssigned && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pl-6">
                                            <div className="space-y-1">
                                                <Label className="text-xs">User Management</Label>
                                                <Select value={companyPermissions[ca.companyName].userManagement} onValueChange={(v) => handlePermissionChange(ca.companyName, 'userManagement', v as any)}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="read">Read Only</SelectItem>
                                                        <SelectItem value="write">Write</SelectItem>
                                                        <SelectItem value="write-upload">Write & Upload</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Form Editor</Label>
                                                <Select value={companyPermissions[ca.companyName].formEditor} onValueChange={(v) => handlePermissionChange(ca.companyName, 'formEditor', v as any)}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="read">Read Only</SelectItem>
                                                        <SelectItem value="write">Write</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Resources</Label>
                                                <Select value={companyPermissions[ca.companyName].resources} onValueChange={(v) => handlePermissionChange(ca.companyName, 'resources', v as any)}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="read">Read Only</SelectItem>
                                                        <SelectItem value="write">Write</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
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
                                <TableHead>Permissions</TableHead>
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
                                     <TableCell>
                                        {!hr.isPrimary && (
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="outline">Users: {hr.permissions.userManagement}</Badge>
                                                <Badge variant="outline">Forms: {hr.permissions.formEditor}</Badge>
                                                <Badge variant="outline">Resources: {hr.permissions.resources}</Badge>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                         {!hr.isPrimary && (
                                            <div className="flex gap-1 justify-end">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(hr, assignment.companyName)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
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
                                            </div>
                                         )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {editingManager?.manager.email}</DialogTitle>
                    <DialogDescription>
                        You are changing permissions for {editingManager?.companyName}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>User Management</Label>
                        <Select value={editedPermissions.userManagement} onValueChange={(v) => setEditedPermissions(p => ({...p, userManagement: v as any}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="read">Read Only</SelectItem>
                                <SelectItem value="write">Write</SelectItem>
                                <SelectItem value="write-upload">Write & Upload</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Form Editor</Label>
                        <Select value={editedPermissions.formEditor} onValueChange={(v) => setEditedPermissions(p => ({...p, formEditor: v as any}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="read">Read Only</SelectItem>
                                <SelectItem value="write">Write</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Resources</Label>
                        <Select value={editedPermissions.resources} onValueChange={(v) => setEditedPermissions(p => ({...p, resources: v as any}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="read">Read Only</SelectItem>
                                <SelectItem value="write">Write</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSavePermissions}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
