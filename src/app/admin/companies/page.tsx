

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useUserData, CompanyAssignment, HrManager, HrPermissions } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Pencil, Download, Check, ChevronsUpDown, Crown, UserPlus, Settings, Shield, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { timezones } from '@/lib/timezones';
import Papa from 'papaparse';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const defaultPermissions: HrPermissions = {
    userManagement: 'read',
    formEditor: 'read',
    resources: 'read',
    companySettings: 'read',
};

const fullPermissions: HrPermissions = {
    userManagement: 'write-upload',
    formEditor: 'write',
    resources: 'write',
    companySettings: 'write',
};

const permissionLabels: Record<string, string> = {
    'read': 'Read',
    'write': 'Write',
    'write-upload': 'Write & Upload',
    'invite-only': 'Invite Only',
};

function PermissionsDialog({ manager, companyName, open, onOpenChange, onSave }: {
    manager: HrManager,
    companyName: string,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (email: string, permissions: HrPermissions) => void,
}) {
    const [editedPermissions, setEditedPermissions] = useState<HrPermissions>(manager.permissions);

    useEffect(() => {
        if (manager) {
            setEditedPermissions(manager.permissions);
        }
    }, [manager]);

    const handleSave = () => {
        onSave(manager.email, editedPermissions);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {manager.email}</DialogTitle>
                    <DialogDescription>
                        You are changing permissions for {companyName}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>User Management</Label>
                        <Select value={editedPermissions.userManagement} onValueChange={(v) => setEditedPermissions(p => ({...p, userManagement: v as any}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="read">Read Only</SelectItem>
                                <SelectItem value="invite-only">Invite Only</SelectItem>
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
                    <div className="space-y-2">
                        <Label>Company Settings</Label>
                        <Select value={editedPermissions.companySettings} onValueChange={(v) => setEditedPermissions(p => ({...p, companySettings: v as any}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="read">Read Only</SelectItem>
                                <SelectItem value="write">Write</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Permissions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function CompanyManagementPage() {
  const { toast } = useToast();
  const { 
    companyAssignments, 
    addCompanyAssignment, 
    updateCompanyAssignment,
    getAllCompanyConfigs,
    assessmentCompletions 
  } = useUserData();
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newHrEmail, setNewHrEmail] = useState('');
  const [newCompanyVersion, setNewCompanyVersion] = useState<'basic' | 'pro'>('basic');
  const [newMaxUsers, setNewMaxUsers] = useState('');
  const [newDeadlineTime, setNewDeadlineTime] = useState('17:00');
  const [newDeadlineTimezone, setNewDeadlineTimezone] = useState('America/Los_Angeles');
  const [newPreEndDateContact, setNewPreEndDateContact] = useState('');
  const [newPostEndDateContact, setNewPostEndDateContact] = useState('');

  const [isHrComboboxOpen, setIsHrComboboxOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyAssignment | null>(null);
  const [editingManager, setEditingManager] = useState<HrManager | null>(null);
  const [addHrEmail, setAddHrEmail] = useState('');

  const existingHrEmails = useMemo(() => {
    return [...new Set(companyAssignments.flatMap(a => a.hrManagers.map(hr => hr.email)))];
  }, [companyAssignments]);

  const handleAddCompany = () => {
    if (!newCompanyName || !newHrEmail || !newMaxUsers || !newPreEndDateContact || !newPostEndDateContact) {
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
    
    addCompanyAssignment({ 
        companyName: newCompanyName, 
        hrManagers: [{email: newHrEmail, isPrimary: true, permissions: fullPermissions }],
        version: newCompanyVersion,
        maxUsers: maxUsersNum,
        severanceDeadlineTime: newDeadlineTime,
        severanceDeadlineTimezone: newDeadlineTimezone,
        preEndDateContactAlias: newPreEndDateContact,
        postEndDateContactAlias: newPostEndDateContact,
    });
    toast({ title: "Company Added", description: `${newCompanyName} has been created and assigned.` });
    setNewCompanyName('');
    setNewHrEmail('');
    setNewMaxUsers('');
    setNewCompanyVersion('basic');
    setNewDeadlineTime('17:00');
    setNewDeadlineTimezone('America/Los_Angeles');
    setNewPreEndDateContact('');
    setNewPostEndDateContact('');
  };

  
  const handleEditClick = (company: CompanyAssignment) => {
    setEditingCompany(company);
    setIsEditDialogOpen(true);
  }

  const handleUpgrade = (companyName: string) => {
    updateCompanyAssignment(companyName, { version: 'pro' });
    toast({ title: "Company Upgraded", description: `${companyName} is now on the Pro version.` });
  }

  const allConfigs = getAllCompanyConfigs();
  const companyDataWithStats = companyAssignments.map(assignment => {
      const companyConfig = allConfigs[assignment.companyName];
      const users = companyConfig?.users || [];
      const usersAdded = users.length;
      const usersInvited = users.filter(u => u.notified).length;
      const assessmentsCompleted = users.filter(u => assessmentCompletions?.[u.email]).length;
      const modifiedQuestionCount = Object.keys(companyConfig?.questions || {}).length + Object.keys(companyConfig?.customQuestions || {}).length;

      return {
          ...assignment,
          usersAdded,
          usersInvited,
          assessmentsCompleted,
          modifiedQuestionCount
      };
  });
  
  const handleExportCompanies = () => {
    if (!companyDataWithStats || companyDataWithStats.length === 0) {
        toast({ title: "No companies to export", variant: "destructive" });
        return;
    }
    const headers = ["Company Name", "HR Manager", "Version", "Max Users", "Users Added", "Users Invited", "Assessments Completed", "Custom Questions", "Deadline Time", "Deadline Timezone", "Pre-End Date Contact", "Post-End Date Contact"];
    
    const dataToExport = companyDataWithStats.map(c => ({
        "Company Name": c.companyName,
        "HR Manager": c.hrManagers.find(hr => hr.isPrimary)?.email || c.hrManagers[0]?.email || 'N/A',
        "Version": c.version,
        "Max Users": c.maxUsers,
        "Users Added": c.usersAdded,
        "Users Invited": c.usersInvited,
        "Assessments Completed": c.assessmentsCompleted,
        "Custom Questions": c.modifiedQuestionCount,
        "Deadline Time": c.severanceDeadlineTime || '17:00',
        "Deadline Timezone": c.severanceDeadlineTimezone || 'America/Los_Angeles',
        "Pre-End Date Contact": c.preEndDateContactAlias || '',
        "Post-End Date Contact": c.postEndDateContactAlias || '',
    }));

    const csv = Papa.unparse(dataToExport, { header: true, columns: headers });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'all_companies_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
    const handleMakePrimary = (companyName: string, newPrimaryEmail: string) => {
        updateCompanyAssignment(companyName, { newPrimaryManagerEmail: newPrimaryEmail });
        toast({ title: 'Primary Manager Updated', description: `${newPrimaryEmail} is now the primary manager.`});
    };

    const handleRemoveHrFromCompany = (companyName: string, emailToRemove: string) => {
        updateCompanyAssignment(companyName, { hrManagerToRemove: emailToRemove });
    };

    const handleAddHrToCompany = (companyName: string) => {
        if (!companyName || !addHrEmail) return;
        
        const companyToUpdate = companyAssignments.find(c => c.companyName === companyName);
        if (!companyToUpdate) return;

        if (companyToUpdate.hrManagers.some(hr => hr.email.toLowerCase() === addHrEmail.toLowerCase())) {
            toast({ title: "Manager Already Assigned", description: `${addHrEmail} is already assigned to this company.`, variant: "destructive" });
            return;
        }

        const newHr: HrManager = { email: addHrEmail, isPrimary: false, permissions: defaultPermissions };
        updateCompanyAssignment(companyName, { hrManagerToAdd: newHr });
        setAddHrEmail('');
    };

    const handlePermissionsEdit = (manager: HrManager) => {
        setEditingManager(manager);
        setIsEditDialogOpen(true);
    };
    
    const handleSavePermissions = (email: string, permissions: HrPermissions) => {
        if (!editingCompany) return;
        updateCompanyAssignment(editingCompany.companyName, { hrManagerToUpdate: { email, permissions } });
        toast({ title: 'Permissions Updated', description: `Permissions for ${email} have been updated.`});
    };

    // This effect is needed to refresh the dialog's view of the company data
    // when changes are made to the underlying global state.
    useEffect(() => {
        if(isEditDialogOpen && editingCompany) {
            const freshCompanyData = companyAssignments.find(c => c.companyName === editingCompany.companyName);
            if (freshCompanyData) {
                setEditingCompany(freshCompanyData);
            } else {
                // The company was deleted, so close the dialog.
                setIsEditDialogOpen(false);
                setEditingCompany(null);
            }
        }
    }, [companyAssignments, editingCompany, isEditDialogOpen]);

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">Company Management</h1>
            <p className="text-muted-foreground">
                Create companies, assign HR Managers, and manage subscription tiers.
            </p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Add New Company</CardTitle>
                <CardDescription>Create a new company profile and assign its HR manager and default settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="newCompanyName">Company Name</Label>
                        <Input id="newCompanyName" placeholder="e.g., Globex Corp" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
                    </div>
                     <div className="space-y-2 lg:col-span-2">
                        <Label>Primary HR Manager Email</Label>
                        <Popover open={isHrComboboxOpen} onOpenChange={setIsHrComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isHrComboboxOpen}
                                    className="w-full justify-between font-normal"
                                >
                                    {newHrEmail || "Select or type an email..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput placeholder="Search or add new email..." onValueChange={setNewHrEmail} value={newHrEmail} />
                                    <CommandList>
                                        <CommandEmpty>No existing emails found. Type to add new.</CommandEmpty>
                                        <CommandGroup>
                                            {existingHrEmails.filter(email => email && email.toLowerCase().includes(newHrEmail.toLowerCase())).map((email) => (
                                                <CommandItem
                                                    key={email}
                                                    value={email}
                                                    onSelect={(currentValue) => {
                                                        setNewHrEmail(currentValue === newHrEmail ? "" : currentValue);
                                                        setIsHrComboboxOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", newHrEmail === email ? "opacity-100" : "opacity-0")} />
                                                    {email}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
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
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="newPreEndDateContact">Pre-End Date Contact Alias</Label>
                        <Input id="newPreEndDateContact" placeholder="e.g., Your HR Business Partner" value={newPreEndDateContact} onChange={e => setNewPreEndDateContact(e.target.value)} />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="newPostEndDateContact">Post-End Date Contact Alias</Label>
                        <Input id="newPostEndDateContact" placeholder="e.g., alumni-support@company.com" value={newPostEndDateContact} onChange={e => setNewPostEndDateContact(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newDeadlineTime">Deadline Time</Label>
                        <Input id="newDeadlineTime" type="time" value={newDeadlineTime} onChange={e => setNewDeadlineTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newDeadlineTimezone">Deadline Timezone</Label>
                        <Select value={newDeadlineTimezone} onValueChange={setNewDeadlineTimezone}>
                            <SelectTrigger id="newDeadlineTimezone"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={handleAddCompany}>
                        <PlusCircle className="mr-2" /> Add Company
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Assigned Companies</CardTitle>
                    <CardDescription>List of all companies and their designated HR managers.</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportCompanies}>
                    <Download className="mr-2" /> Export to CSV
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>HR Managers</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Users Added/Invited</TableHead>
                            <TableHead>Max Users</TableHead>
                            <TableHead>Assessments Done</TableHead>
                            <TableHead>Custom Qs</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companyDataWithStats.length > 0 ? companyDataWithStats.map(assignment => {
                            const version = assignment.version || 'basic';
                            const primaryHr = assignment.hrManagers.find(hr => hr.isPrimary);
                            const otherHrs = assignment.hrManagers.filter(hr => !hr.isPrimary);
                            return (
                                <TableRow key={assignment.companyName}>
                                    <TableCell className="font-medium">{assignment.companyName}</TableCell>
                                    <TableCell>
                                        {primaryHr && <div className="flex items-center gap-1 font-semibold"><Crown className="text-amber-500 h-4 w-4"/>{primaryHr.email}</div>}
                                        {otherHrs.map(hr => <div key={hr.email} className="text-xs text-muted-foreground pl-5">{hr.email}</div>)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={version === 'pro' ? 'default' : 'secondary'} className={version === 'pro' ? 'bg-green-600' : ''}>
                                            {version.charAt(0).toUpperCase() + version.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{assignment.usersAdded} / {assignment.usersInvited}</TableCell>
                                    <TableCell className="text-center">{assignment.maxUsers ?? '—'}</TableCell>
                                    <TableCell className="text-center">{assignment.assessmentsCompleted}</TableCell>
                                    <TableCell className="text-center">{assignment.modifiedQuestionCount}</TableCell>
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
                                                        <AlertDialogAction onClick={() => updateCompanyAssignment(assignment.companyName, { delete: true })}>
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
                                <TableCell colSpan={8} className="text-center text-muted-foreground">No companies have been created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
           if (!open) setEditingCompany(null);
           setIsEditDialogOpen(open);
       }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit {editingCompany?.companyName}</DialogTitle>
                    <DialogDescription>
                        Update company settings, manage HR team, and upgrade plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    {editingCompany && (
                        <>
                        <Card>
                            <CardHeader><CardTitle className="text-base">Company Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="max-users">Max Users</Label>
                                        <Input 
                                            id="max-users" 
                                            type="number" 
                                            defaultValue={editingCompany.maxUsers?.toString() ?? ''} 
                                            onBlur={(e) => updateCompanyAssignment(editingCompany.companyName, { maxUsers: parseInt(e.target.value, 10) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deadline-time">Deadline Time</Label>
                                        <Input 
                                            id="deadline-time" 
                                            type="time" 
                                            defaultValue={editingCompany.severanceDeadlineTime || '17:00'} 
                                            onBlur={(e) => updateCompanyAssignment(editingCompany.companyName, { severanceDeadlineTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deadline-timezone">Deadline Timezone</Label>
                                    <Select defaultValue={editingCompany.severanceDeadlineTimezone || 'America/Los_Angeles'} onValueChange={(v) => updateCompanyAssignment(editingCompany.companyName, {severanceDeadlineTimezone: v})}>
                                        <SelectTrigger id="deadline-timezone"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-pre-contact">Pre-End Date Contact Alias</Label>
                                    <Input id="edit-pre-contact" defaultValue={editingCompany.preEndDateContactAlias || ''} onBlur={(e) => updateCompanyAssignment(editingCompany.companyName, {preEndDateContactAlias: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-post-contact">Post-End Date Contact Alias</Label>
                                    <Input id="edit-post-contact" defaultValue={editingCompany.postEndDateContactAlias || ''} onBlur={(e) => updateCompanyAssignment(editingCompany.companyName, {postEndDateContactAlias: e.target.value})} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base">HR Team Management</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {editingCompany.hrManagers.map(hr => (
                                        <div key={hr.email} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{hr.email}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {hr.isPrimary ? (
                                                        <Badge><Crown className="mr-2"/>Primary</Badge>
                                                    ) : (
                                                        <>
                                                            <Badge variant="outline" className="text-xs">Users: {permissionLabels[hr.permissions.userManagement]}</Badge>
                                                            <Badge variant="outline" className="text-xs">Forms: {permissionLabels[hr.permissions.formEditor]}</Badge>
                                                            <Badge variant="outline" className="text-xs">Resources: {permissionLabels[hr.permissions.resources]}</Badge>
                                                            <Badge variant="outline" className="text-xs">Settings: {permissionLabels[hr.permissions.companySettings]}</Badge>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id={`primary-switch-${hr.email}`}
                                                        checked={hr.isPrimary}
                                                        onCheckedChange={() => handleMakePrimary(editingCompany.companyName, hr.email)}
                                                        disabled={hr.isPrimary}
                                                    />
                                                    <Label htmlFor={`primary-switch-${hr.email}`} className="text-xs text-muted-foreground">Primary</Label>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handlePermissionsEdit(hr)} disabled={hr.isPrimary}>
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveHrFromCompany(editingCompany.companyName, hr.email)} disabled={hr.isPrimary}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-4"/>
                                <div className="flex items-center gap-2">
                                    <Input placeholder="new.manager@email.com" value={addHrEmail} onChange={e => setAddHrEmail(e.target.value)} />
                                    <Button onClick={() => handleAddHrToCompany(editingCompany.companyName)}><UserPlus className="mr-2"/>Add HR</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {(editingCompany.version || 'basic') === 'basic' && (
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-base">Upgrade to Pro</CardTitle>
                                    <CardDescription className="text-xs">
                                        Unlock form editing capabilities for the HR Manager. This action cannot be undone.
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button size="sm" onClick={() => handleUpgrade(editingCompany.companyName)}>Upgrade to Pro</Button>
                                </CardFooter>
                            </Card>
                        )}
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {editingManager && editingCompany && (
            <PermissionsDialog 
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                manager={editingManager}
                companyName={editingCompany.companyName}
                onSave={handleSavePermissions}
            />
        )}
    </div>
  );
}
