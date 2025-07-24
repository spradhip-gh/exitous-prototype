

'use client';

import { useState, useMemo } from 'react';
import { useUserData, CompanyAssignment, HrManager } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Pencil, Download, Check, ChevronsUpDown, Crown, UserPlus } from 'lucide-react';
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
import { timezones } from '@/lib/timezones';
import Papa from 'papaparse';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const defaultPermissions = {
    userManagement: 'read' as const,
    formEditor: 'read' as const,
    resources: 'read' as const,
    companySettings: 'read' as const,
};

const fullPermissions = {
    userManagement: 'write-upload' as const,
    formEditor: 'write' as const,
    resources: 'write' as const,
    companySettings: 'read' as const,
};

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
  const [newDeadlineTime, setNewDeadlineTime] = useState('17:00');
  const [newDeadlineTimezone, setNewDeadlineTimezone] = useState('America/Los_Angeles');
  const [newPreEndDateContact, setNewPreEndDateContact] = useState('');
  const [newPostEndDateContact, setNewPostEndDateContact] = useState('');

  const [isHrComboboxOpen, setIsHrComboboxOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyAssignment | null>(null);
  const [editedMaxUsers, setEditedMaxUsers] = useState('');
  const [editedDeadlineTime, setEditedDeadlineTime] = useState('');
  const [editedDeadlineTimezone, setEditedDeadlineTimezone] = useState('');
  const [editedPreEndDateContact, setEditedPreEndDateContact] = useState('');
  const [editedPostEndDateContact, setEditedPostEndDateContact] = useState('');
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

  const handleDeleteCompany = (companyName: string) => {
    deleteCompanyAssignment(companyName);
    toast({ title: "Company Removed", description: `${companyName} and its assignment have been removed.` });
  };
  
  const handleEditClick = (company: CompanyAssignment) => {
    setEditingCompany(company);
    setEditedMaxUsers(company.maxUsers?.toString() ?? '');
    setEditedDeadlineTime(company.severanceDeadlineTime || '17:00');
    setEditedDeadlineTimezone(company.severanceDeadlineTimezone || 'America/Los_Angeles');
    setEditedPreEndDateContact(company.preEndDateContactAlias || '');
    setEditedPostEndDateContact(company.postEndDateContactAlias || '');
    setIsEditDialogOpen(true);
  }

  const handleSaveChanges = () => {
    if (!editingCompany) return;
    
    const maxUsersNum = parseInt(editedMaxUsers, 10);
     if (isNaN(maxUsersNum) || maxUsersNum <= 0) {
      toast({ title: "Invalid User Limit", description: "Maximum users must be a positive number.", variant: "destructive" });
      return;
    }

    updateCompanyAssignment(editingCompany.companyName, { 
        maxUsers: maxUsersNum,
        severanceDeadlineTime: editedDeadlineTime,
        severanceDeadlineTimezone: editedDeadlineTimezone,
        preEndDateContactAlias: editedPreEndDateContact,
        postEndDateContactAlias: editedPostEndDateContact,
    });
    toast({ title: "Company Updated", description: "Changes have been saved." });
    setIsEditDialogOpen(false);
    setEditingCompany(null);
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
        const currentAssignment = companyAssignments.find(a => a.companyName === companyName);
        if (!currentAssignment) return;

        const updatedManagers = currentAssignment.hrManagers.map(hr => ({
            ...hr,
            isPrimary: hr.email.toLowerCase() === newPrimaryEmail.toLowerCase(),
            // When making a user primary, grant them full permissions.
            permissions: hr.email.toLowerCase() === newPrimaryEmail.toLowerCase() ? fullPermissions : hr.permissions
        }));

        updateCompanyAssignment(companyName, { hrManagers: updatedManagers });
        setEditingCompany(prev => prev ? {...prev, hrManagers: updatedManagers} : null);
        toast({ title: "Primary Manager Updated", description: `${newPrimaryEmail} is now the primary manager for ${companyName}.` });
    };

    const handleRemoveHrFromCompany = (companyName: string, emailToRemove: string) => {
        const currentAssignment = companyAssignments.find(a => a.companyName === companyName);
        if (!currentAssignment || currentAssignment.hrManagers.length <= 1) {
            toast({ title: "Cannot Remove Last Manager", description: "A company must have at least one HR manager.", variant: "destructive" });
            return;
        }

        const updatedManagers = currentAssignment.hrManagers.filter(hr => hr.email.toLowerCase() !== emailToRemove.toLowerCase());
        
        // If the primary was removed, make the first remaining manager primary
        if (!updatedManagers.some(hr => hr.isPrimary)) {
            updatedManagers[0].isPrimary = true;
            // Also give them full permissions
            updatedManagers[0].permissions = fullPermissions;
        }
        
        updateCompanyAssignment(companyName, { hrManagers: updatedManagers });
        setEditingCompany(prev => prev ? {...prev, hrManagers: updatedManagers} : null);
        toast({ title: "HR Manager Removed", description: `${emailToRemove} has been removed from ${companyName}.` });
    };

    const handleAddHrToCompany = () => {
        if (!editingCompany || !addHrEmail) return;

        const currentAssignment = companyAssignments.find(a => a.companyName === editingCompany.companyName);
        if (!currentAssignment) return;
        
        if (currentAssignment.hrManagers.some(hr => hr.email.toLowerCase() === addHrEmail.toLowerCase())) {
            toast({ title: "Manager Already Assigned", description: `${addHrEmail} is already assigned to this company.`, variant: "destructive" });
            return;
        }

        const newHr: HrManager = { email: addHrEmail, isPrimary: false, permissions: defaultPermissions };
        const updatedManagers = [...currentAssignment.hrManagers, newHr];
        
        updateCompanyAssignment(editingCompany.companyName, { hrManagers: updatedManagers });
        setEditingCompany(prev => prev ? {...prev, hrManagers: updatedManagers} : null);
        setAddHrEmail('');
        toast({ title: "HR Manager Added", description: `${addHrEmail} has been added to ${editingCompany.companyName}.` });
    };


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
                                <TableCell colSpan={8} className="text-center text-muted-foreground">No companies have been created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit {editingCompany?.companyName}</DialogTitle>
                    <DialogDescription>
                        Update company settings, manage HR team, and upgrade plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Company Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max-users">Max Users</Label>
                                    <Input 
                                        id="max-users" 
                                        type="number" 
                                        value={editedMaxUsers} 
                                        onChange={(e) => setEditedMaxUsers(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deadline-time">Deadline Time</Label>
                                    <Input 
                                        id="deadline-time" 
                                        type="time" 
                                        value={editedDeadlineTime} 
                                        onChange={(e) => setEditedDeadlineTime(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline-timezone">Deadline Timezone</Label>
                                <Select value={editedDeadlineTimezone} onValueChange={setEditedDeadlineTimezone}>
                                    <SelectTrigger id="deadline-timezone"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-pre-contact">Pre-End Date Contact Alias</Label>
                                <Input id="edit-pre-contact" value={editedPreEndDateContact} onChange={e => setEditedPreEndDateContact(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-post-contact">Post-End Date Contact Alias</Label>
                                <Input id="edit-post-contact" value={editedPostEndDateContact} onChange={e => setEditedPostEndDateContact(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">HR Team Management</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                               <TableBody>
                                {editingCompany?.hrManagers.map(hr => (
                                    <TableRow key={hr.email}>
                                        <TableCell>
                                            <div className="font-medium">{hr.email}</div>
                                            {hr.isPrimary && <div className="text-xs text-amber-600">Primary Manager</div>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!hr.isPrimary && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => handleMakePrimary(editingCompany.companyName, hr.email)}>
                                                        <Crown className="mr-2 h-4 w-4"/> Make Primary
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveHrFromCompany(editingCompany.companyName, hr.email)}>
                                                        <Trash2 className="mr-2 h-4 w-4"/> Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            <Separator className="my-4"/>
                            <div className="flex items-center gap-2">
                                <Input placeholder="new.manager@email.com" value={addHrEmail} onChange={e => setAddHrEmail(e.target.value)} />
                                <Button onClick={handleAddHrToCompany}><UserPlus className="mr-2"/>Add HR</Button>
                            </div>
                        </CardContent>
                    </Card>

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
