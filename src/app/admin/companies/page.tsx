

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { timezones } from '@/lib/timezones';
import * as XLSX from 'xlsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

function AddHrManagerDialog({ open, onOpenChange, companyName, onSave, currentManagers }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyName: string;
    onSave: (companyName: string, newManager: HrManager) => void;
    currentManagers: HrManager[];
}) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [permissions, setPermissions] = useState<HrPermissions>(defaultPermissions);
    const [isPrimary, setIsPrimary] = useState(false);

    useEffect(() => {
        if (!open) {
            setEmail('');
            setPermissions(defaultPermissions);
            setIsPrimary(false);
        }
    }, [open]);
    
    useEffect(() => {
        if(isPrimary) {
            setPermissions(fullPermissions);
        }
    }, [isPrimary]);

    const handlePermissionChange = (key: keyof HrPermissions, value: string) => {
        setPermissions(p => ({ ...p, [key]: value as any }));
    };

    const handleSave = () => {
        if (!email) {
            toast({ title: 'Email is required', variant: 'destructive' });
            return;
        }
        if (currentManagers.some(m => m.email.toLowerCase() === email.toLowerCase())) {
            toast({ title: 'Manager already exists', description: `${email} is already assigned to this company.`, variant: 'destructive' });
            return;
        }

        const newManager: HrManager = { email, isPrimary, permissions, projectAccess: ['all'] };
        onSave(companyName, newManager);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add HR Manager to {companyName}</DialogTitle>
                    <DialogDescription>Assign a new HR Manager and set their initial permissions.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-hr-email">Email Address</Label>
                        <Input id="new-hr-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="new.manager@email.com" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <Label>Primary Manager</Label>
                            <p className="text-xs text-muted-foreground">Grants full permissions and demotes the current primary.</p>
                        </div>
                        <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                    </div>
                    {!isPrimary && (
                        <Card className="bg-muted/50">
                            <CardHeader><CardTitle className="text-base">Permissions</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>User Management</Label>
                                    <Select value={permissions.userManagement} onValueChange={(v) => handlePermissionChange('userManagement', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <Select value={permissions.formEditor} onValueChange={(v) => handlePermissionChange('formEditor', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Write</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Resources</Label>
                                    <Select value={permissions.resources} onValueChange={(v) => handlePermissionChange('resources', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Write</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Settings</Label>
                                    <Select value={permissions.companySettings} onValueChange={(v) => handlePermissionChange('companySettings', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="read">Read Only</SelectItem>
                                            <SelectItem value="write">Write</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Add Manager</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PermissionsDialog({ manager, company, open, onOpenChange, onSave }: {
    manager: HrManager,
    company: CompanyAssignment,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (email: string, permissions: HrPermissions, projectAccess: string[]) => void,
}) {
    const [editedPermissions, setEditedPermissions] = useState<HrPermissions>(manager.permissions);
    const [projectAccess, setProjectAccess] = useState<string[]>(manager.projectAccess || []);

    useEffect(() => {
        if (manager) {
            setEditedPermissions(manager.permissions);
            setProjectAccess(manager.projectAccess || []);
        }
    }, [manager]);

    const handleSave = () => {
        onSave(manager.email, editedPermissions, projectAccess);
        onOpenChange(false);
    }
    
     const handleProjectAccessChange = (projectId: string, isChecked: boolean) => {
        setProjectAccess(prev => {
            const allPossibleIds = company.projects?.map(p => p.id).concat(['__none__']) || ['__none__'];
            
            // If was "All", create an array with everything except the one that was unchecked.
            if (prev.length === 0 || prev.includes('all')) {
                return isChecked 
                    ? allPossibleIds // This case shouldn't happen from the UI
                    : allPossibleIds.filter(id => id !== projectId);
            }
            
            // Add or remove from current list
            let newAccess = isChecked ? [...prev, projectId] : prev.filter(id => id !== projectId);

            // If all are checked, revert to "All"
            if (newAccess.length === allPossibleIds.length) {
                return ['all'];
            }
            return newAccess;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {manager.email}</DialogTitle>
                    <DialogDescription>
                        You are changing permissions for {company.companyName}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Role Permissions</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 pt-4">
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
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Project Access</CardTitle><CardDescription className="text-xs">Control which projects this HR manager can see and manage users for.</CardDescription></CardHeader>
                        <CardContent className="pt-4 space-y-2">
                             {(company.projects || []).map(p => {
                                const isAllSelected = projectAccess.length === 0 || projectAccess.includes('all');
                                const isChecked = isAllSelected || projectAccess.includes(p.id);
                                return (
                                    <div key={p.id} className="flex items-center space-x-2">
                                        <Checkbox id={`project-access-${p.id}`} checked={isChecked} onCheckedChange={(c) => handleProjectAccessChange(p.id, !!c)} />
                                        <Label htmlFor={`project-access-${p.id}`} className="font-normal">{p.name}</Label>
                                    </div>
                                )
                             })}
                             <div className="flex items-center space-x-2">
                                 <Checkbox id="project-access-unassigned" checked={projectAccess.length === 0 || projectAccess.includes('all') || projectAccess.includes('__none__')} onCheckedChange={(c) => handleProjectAccessChange('__none__', !!c)} />
                                 <Label htmlFor="project-access-unassigned" className="font-normal flex items-center gap-1.5">
                                    Unassigned Users
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent><p>Users who are not allocated to a specific project or division.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                 </Label>
                             </div>
                        </CardContent>
                    </Card>
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
    isLoading,
    addCompanyAssignment, 
    updateCompanyAssignment,
    getAllCompanyConfigs,
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
  const [isAddHrDialogOpen, setIsAddHrDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  const existingHrEmails = useMemo(() => {
    if (!companyAssignments) {
        return [];
    }
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
    if (companyAssignments?.some(a => a.companyName.toLowerCase() === newCompanyName.toLowerCase())) {
        toast({ title: "Company Exists", description: "A company with this name already exists.", variant: "destructive" });
        return;
    }
    
    addCompanyAssignment({ 
        companyName: newCompanyName, 
        hrManagers: [{email: newHrEmail, isPrimary: true, permissions: fullPermissions, projectAccess: ['all'] }],
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
  const companyDataWithStats = useMemo(() => {
    if (!companyAssignments) return [];
    return companyAssignments.map(assignment => {
        const companyConfig = allConfigs[assignment.companyName];
        const users = companyConfig?.users || [];
        const usersAdded = users.length;
        const usersInvited = users.filter(u => u.is_invited).length;
        const assessmentsCompleted = 0; // This needs profile/assessment completion data
        const modifiedQuestionCount = Object.keys(companyConfig?.questions || {}).length + Object.keys(companyConfig?.customQuestions || {}).length;

        return {
            ...assignment,
            usersAdded,
            usersInvited,
            assessmentsCompleted,
            modifiedQuestionCount
        };
    });
  }, [companyAssignments, allConfigs]);
  
  const handleExportCompanies = () => {
    if (!companyDataWithStats || companyDataWithStats.length === 0) {
        toast({ title: "No companies to export", variant: "destructive" });
        return;
    }
    const dataToExport = companyDataWithStats.map(c => ({
        "Company Name": c.companyName,
        "Primary HR Manager": c.hrManagers.find(hr => hr.isPrimary)?.email || c.hrManagers[0]?.email || 'N/A',
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

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    XLSX.writeFile(workbook, "all_companies_export.xlsx");
  };
  
    const handleMakePrimary = (companyName: string, newPrimaryEmail: string) => {
        updateCompanyAssignment(companyName, { newPrimaryManagerEmail: newPrimaryEmail });
        toast({ title: 'Primary Manager Updated', description: `${newPrimaryEmail} is now the primary manager.`});
    };

    const handleRemoveHrFromCompany = (companyName: string, emailToRemove: string) => {
        const companyToUpdate = companyAssignments?.find(a => a.companyName === companyName);
        const managerToRemove = companyToUpdate?.hrManagers.find(hr => hr.email === emailToRemove);

        if (managerToRemove?.isPrimary) {
            toast({ title: "Action Prohibited", description: "You cannot remove a Primary Manager. Assign a new primary manager first.", variant: "destructive" });
            return;
        }
        updateCompanyAssignment(companyName, { hrManagerToRemove: emailToRemove });
    };

    const handleAddHrToCompany = (companyName: string, newManager: HrManager) => {
        if (newManager.isPrimary) {
            handleMakePrimary(companyName, newManager.email);
        }
        updateCompanyAssignment(companyName, { hrManagerToAdd: newManager });
    };

    const handlePermissionsEdit = (manager: HrManager) => {
        setEditingManager(manager);
        setIsPermissionsDialogOpen(true);
    };
    
    const handleSavePermissions = (email: string, permissions: HrPermissions, projectAccess: string[]) => {
        if (!editingCompany) return;
        updateCompanyAssignment(editingCompany.companyName, { hrManagerToUpdate: { email, permissions, projectAccess } });
        toast({ title: 'Permissions Updated', description: `Permissions for ${email} have been updated.`});
    };

    // This effect is needed to refresh the dialog's view of the company data
    // when changes are made to the underlying global state.
    useEffect(() => {
        if(isEditDialogOpen && editingCompany && companyAssignments) {
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

  if (isLoading || !companyAssignments) {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

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
                    <CardTitle>Companies</CardTitle>
                    <CardDescription>List of all companies and their designated HR managers.</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportCompanies}>
                    <Download className="mr-2" /> Export to Excel
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
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base">HR Team Management</CardTitle>
                                    <Button size="sm" variant="outline" onClick={() => setIsAddHrDialogOpen(true)}>
                                        <UserPlus className="mr-2" /> Add Manager
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {editingCompany.hrManagers.map(hr => {
                                        const currentPrimaryEmail = editingCompany?.hrManagers.find(m => m.isPrimary)?.email;
                                        return (
                                        <div key={hr.email} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{hr.email}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                     <Badge variant={hr.isPrimary ? 'default' : 'outline'}>
                                                        {hr.isPrimary ? <><Crown className="mr-2"/>Primary</> : 'Manager'}
                                                    </Badge>
                                                    {!hr.isPrimary && (
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
                                                <div className="flex items-center space-x-2 rounded-lg border p-3">
                                                    <Label htmlFor={`primary-switch-${hr.email}`} className="text-xs text-muted-foreground">Primary</Label>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <Switch
                                                              id={`primary-switch-${hr.email}`}
                                                              checked={hr.isPrimary}
                                                              disabled={hr.isPrimary}
                                                          />
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirm Primary Manager Transfer</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to make <span className="font-bold">{hr.email}</span> the new Primary Manager for <span className="font-bold">{editingCompany.companyName}</span>?
                                                                    This will demote the current primary ({currentPrimaryEmail}).
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleMakePrimary(editingCompany.companyName, hr.email)}>Confirm & Transfer</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                                <Separator orientation="vertical" className="h-6" />
                                                <Button variant="ghost" size="icon" onClick={() => handlePermissionsEdit(hr)} disabled={hr.isPrimary}>
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveHrFromCompany(editingCompany.companyName, hr.email)} disabled={hr.isPrimary}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        </div>
                                    )})}
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
        
        {editingCompany && (
            <AddHrManagerDialog
                open={isAddHrDialogOpen}
                onOpenChange={setIsAddHrDialogOpen}
                companyName={editingCompany.companyName}
                onSave={handleAddHrToCompany}
                currentManagers={editingCompany.hrManagers}
            />
        )}


        {editingManager && editingCompany && (
            <PermissionsDialog 
                open={isPermissionsDialogOpen}
                onOpenChange={setIsPermissionsDialogOpen}
                manager={editingManager}
                company={editingCompany}
                onSave={handleSavePermissions}
            />
        )}
    </div>
  );
}
