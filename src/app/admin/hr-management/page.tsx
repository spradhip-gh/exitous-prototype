

'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserData, CompanyAssignment, HrManager, HrPermissions } from "@/hooks/use-user-data";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Crown, Shield, UserPlus, Info, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelectPopover } from "@/components/admin/forms/GuidanceRuleForm";

const permissionLabels: Record<string, string> = {
    'read': 'Read',
    'write': 'Write',
    'write-upload': 'Write & Upload',
    'invite-only': 'Invite Only',
};

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

function ManageAccessDialog({ managerEmail, assignments, open, onOpenChange, onSave }: {
    managerEmail: string | null;
    assignments: CompanyAssignment[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (email: string, updatedAssignments: CompanyAssignment[]) => void;
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const [localAssignments, setLocalAssignments] = useState<CompanyAssignment[]>([]);

    useEffect(() => {
        if (open) {
            setLocalAssignments(JSON.parse(JSON.stringify(assignments))); // Deep copy
        }
    }, [open, assignments]);

    const managerAssignments = useMemo(() => {
        if (!managerEmail) return [];
        return localAssignments.filter(a => a.hrManagers.some(hr => hr.email.toLowerCase() === managerEmail.toLowerCase()));
    }, [localAssignments, managerEmail]);

    const addableCompanies = useMemo(() => {
        if (!managerEmail) return [];
        const assignedCompanyNames = new Set(managerAssignments.map(ma => ma.companyName));
        return assignments.filter(a => !assignedCompanyNames.has(a.companyName)).map(a => a.companyName);
    }, [assignments, managerAssignments, managerEmail]);

    if (!managerEmail) return null;

    const handleMakePrimary = (companyName: string, newPrimaryEmail: string) => {
        setLocalAssignments(prev => {
            const updated = prev.map(a => {
                if (a.companyName === companyName) {
                    const newManagers = a.hrManagers.map(hr => {
                        const isNewPrimary = hr.email.toLowerCase() === newPrimaryEmail.toLowerCase();
                        return {
                            ...hr,
                            isPrimary: isNewPrimary,
                            permissions: isNewPrimary
                                ? fullPermissions
                                : { ...hr.permissions, companySettings: 'read' as const },
                            projectAccess: isNewPrimary ? ['all'] : hr.projectAccess,
                        };
                    });
                    return { ...a, hrManagers: newManagers };
                }
                return a;
            });
            return updated;
        });
        toast({ title: 'Primary Role Staged', description: `${newPrimaryEmail} will become the new primary. Save all changes to confirm.` });
    };

    const handleRemoveAccess = (companyName: string) => {
        const companyAssignment = localAssignments.find(a => a.companyName === companyName);
        if (!companyAssignment || !managerEmail) return;

        const managerInQuestion = companyAssignment.hrManagers.find(hr => hr.email.toLowerCase() === managerEmail.toLowerCase());
        
        if (managerInQuestion?.isPrimary) {
            toast({ title: "Action Prohibited", description: `You cannot remove a Primary Manager. Please assign a new primary for ${companyName} first.`, variant: "destructive" });
            return;
        }
        
         if (companyAssignment.hrManagers.length <= 1) {
            toast({ title: "Action Prohibited", description: `Cannot remove the last manager of a company.`, variant: "destructive" });
            return;
        }

        setLocalAssignments(prev => prev.map(a => {
            if (a.companyName === companyName) {
                const updatedManagers = a.hrManagers.filter(hr => hr.email.toLowerCase() !== managerEmail.toLowerCase());
                return { ...a, hrManagers: updatedManagers };
            }
            return a;
        }));
    };

    const handleAddAccess = (companyName: string) => {
        setLocalAssignments(prev => prev.map(a => {
            if (a.companyName === companyName) {
                return { ...a, hrManagers: [...a.hrManagers, { email: managerEmail, isPrimary: false, permissions: defaultPermissions, projectAccess: ['all'] }] };
            }
            return a;
        }));
    };

    const handlePermissionChange = (companyName: string, key: keyof HrPermissions, value: string) => {
        setLocalAssignments(prev => prev.map(a => {
            if (a.companyName === companyName) {
                const updatedManagers = a.hrManagers.map(hr => {
                    if (hr.email.toLowerCase() === managerEmail.toLowerCase()) {
                        return { ...hr, permissions: { ...hr.permissions, [key]: value } };
                    }
                    return hr;
                });
                return { ...a, hrManagers: updatedManagers };
            }
            return a;
        }));
    };
    
     const handleProjectAccessChange = (companyName: string, projectIds: string[]) => {
        setLocalAssignments(prev => prev.map(a => {
            if (a.companyName === companyName) {
                const updatedManagers = a.hrManagers.map(hr => {
                    if (hr.email.toLowerCase() === managerEmail.toLowerCase()) {
                        return { ...hr, projectAccess: projectIds };
                    }
                    return hr;
                });
                return { ...a, hrManagers: updatedManagers };
            }
            return a;
        }));
    };

    const handleSave = () => {
        onSave(managerEmail, localAssignments);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Manage Access for {managerEmail}</DialogTitle>
                    <DialogDescription>Add, remove, or edit company access and permissions for this HR Manager.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Assigned Companies</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {managerAssignments.length > 0 ? managerAssignments.map(assignment => {
                                const manager = assignment.hrManagers.find(hr => hr.email.toLowerCase() === managerEmail.toLowerCase());
                                if (!manager) return null;
                                
                                const canEditThisCompany = assignments.some(a => a.companyName === assignment.companyName);
                                const isPrimaryInThisCompany = manager.isPrimary;
                                const isLastManager = assignment.hrManagers.length <= 1;
                                const currentPrimaryEmail = assignment.hrManagers.find(m => m.isPrimary)?.email;
                                const projectOptions = assignment.projects?.map(p => ({ id: p.id, name: p.name, category: 'Projects' })) || [];
                                const hasProjectScope = manager.projectAccess && !manager.projectAccess.includes('all');


                                return (
                                    <Card key={assignment.companyName} className={cn("transition-all", isPrimaryInThisCompany && "border-primary")}>
                                        <CardHeader className="flex flex-row items-center justify-between p-4">
                                            <Label htmlFor={`assign-${assignment.companyName}`} className="text-base font-semibold">{assignment.companyName}</Label>
                                            <TooltipProvider>
                                                 <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span tabIndex={!canEditThisCompany || isLastManager ? 0 : -1}>
                                                           <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveAccess(assignment.companyName)} disabled={!canEditThisCompany || isLastManager || manager.isPrimary}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </span>
                                                    </TooltipTrigger>
                                                     <TooltipContent>
                                                          <p>
                                                            {isLastManager ? "Cannot remove the last manager of a company." :
                                                             manager.isPrimary ? "Cannot remove a Primary Manager. Assign a new primary first." : 
                                                             "Remove access"}
                                                          </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 space-y-4">
                                            <Separator />
                                            <div className="pt-2">
                                                 <div className="flex items-center justify-between rounded-lg border p-3">
                                                    <div>
                                                        <Label>Primary Manager</Label>
                                                        <p className="text-xs text-muted-foreground">Grants full permissions and demotes the current primary.</p>
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Switch
                                                                checked={isPrimaryInThisCompany}
                                                                onCheckedChange={() => {}}
                                                                disabled={!canEditThisCompany || isPrimaryInThisCompany}
                                                            />
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirm Primary Manager Transfer</AlertDialogTitle>
                                                                <AlertDialogDescription asChild>
                                                                    <div>
                                                                        Are you sure you want to make <span className="font-bold">{manager.email}</span> the new Primary Manager for <span className="font-bold">{assignment.companyName}</span>?
                                                                        <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                                                                            <Info className="h-4 w-4 !text-amber-600" />
                                                                            <AlertTitle>Warning</AlertTitle>
                                                                            <AlertDescription>This will demote the current primary ({currentPrimaryEmail}). You may lose permissions if you are not an Admin.</AlertDescription>
                                                                        </Alert>
                                                                    </div>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleMakePrimary(assignment.companyName, manager.email)}>Confirm & Transfer</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                            {!isPrimaryInThisCompany && (
                                                <fieldset disabled={!canEditThisCompany} className="grid grid-cols-2 gap-4">
                                                     <div>
                                                        <Label>User Management</Label>
                                                        <Select value={manager.permissions.userManagement} onValueChange={(v) => handlePermissionChange(assignment.companyName, 'userManagement', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="invite-only">Invite Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                                <SelectItem value="write-upload">Write & Upload</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                     <div>
                                                        <Label>Form Editor</Label>
                                                        <Select value={manager.permissions.formEditor} onValueChange={(v) => handlePermissionChange(assignment.companyName, 'formEditor', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                     <div>
                                                        <Label>Resources</Label>
                                                        <Select value={manager.permissions.resources} onValueChange={(v) => handlePermissionChange(assignment.companyName, 'resources', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Company Settings</Label>
                                                        <Select value={manager.permissions.companySettings} onValueChange={(v) => handlePermissionChange(assignment.companyName, 'companySettings', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <MultiSelectPopover 
                                                            label="Project Access"
                                                            items={[{id: 'all', name: 'All Projects', category: 'General'}, ...projectOptions]}
                                                            selectedIds={manager.projectAccess || ['all']}
                                                            onSelectionChange={(ids) => handleProjectAccessChange(assignment.companyName, ids)}
                                                            onAddNew={() => {}}
                                                            categories={[]}
                                                        />
                                                    </div>
                                                </fieldset>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            }) : (
                                <p className="text-sm text-center text-muted-foreground py-4">This manager is not assigned to any companies you manage.</p>
                            )}
                        </CardContent>
                    </Card>

                    {addableCompanies.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Add Access to Your Companies</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                     <TableBody>
                                        {addableCompanies.map(companyName => (
                                            <TableRow key={companyName}>
                                                <TableCell className="font-medium">{companyName}</TableCell>
                                                <TableCell className="text-right"><Button size="sm" onClick={() => handleAddAccess(companyName)}><PlusCircle className="mr-2" />Add</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save All Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type NewAssignment = {
    companyName: string;
    isPrimary: boolean;
    permissions: HrPermissions;
};

function AddHrManagerDialog({ open, onOpenChange, managedCompanies, onSave, allAssignments }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    managedCompanies: string[];
    onSave: (updatedAssignments: CompanyAssignment[]) => void;
    allAssignments: CompanyAssignment[];
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const [email, setEmail] = useState('');
    const [assignments, setAssignments] = useState<Record<string, NewAssignment>>({});

    useEffect(() => {
        if (!open) {
            setEmail('');
            setAssignments({});
        }
    }, [open]);

    const handleAssignmentChange = (companyName: string, isAssigned: boolean) => {
        setAssignments(prev => {
            const newAssignments = { ...prev };
            if (isAssigned) {
                newAssignments[companyName] = { companyName, isPrimary: false, permissions: defaultPermissions };
            } else {
                delete newAssignments[companyName];
            }
            return newAssignments;
        });
    };

    const handlePermissionChange = (companyName: string, key: keyof HrPermissions, value: string) => {
        setAssignments(prev => ({
            ...prev,
            [companyName]: {
                ...prev[companyName],
                permissions: { ...prev[companyName].permissions, [key]: value as any }
            }
        }));
    };
    
    const handlePrimaryChange = (companyName: string) => {
        setAssignments(prev => {
            const newAssignments = {...prev};
            
            // Unset other primaries for this user
            Object.keys(newAssignments).forEach(cn => {
                if (newAssignments[cn].isPrimary) {
                    newAssignments[cn] = {...newAssignments[cn], isPrimary: false, permissions: defaultPermissions };
                }
            });

            // Set the new primary
            newAssignments[companyName] = {
                ...newAssignments[companyName],
                isPrimary: true,
                permissions: fullPermissions,
            };

            return newAssignments;
        });
    };

    const handleSave = () => {
        if (!email || Object.keys(assignments).length === 0) {
            toast({ title: 'Missing Information', description: 'Please provide an email and assign to at least one company.', variant: 'destructive' });
            return;
        }

        let updatedAssignments = JSON.parse(JSON.stringify(allAssignments)); // deep copy

        Object.values(assignments).forEach(newAssignment => {
            const assignmentIndex = updatedAssignments.findIndex((a: CompanyAssignment) => a.companyName === newAssignment.companyName);
            if (assignmentIndex > -1) {
                const company = updatedAssignments[assignmentIndex];
                if (company.hrManagers.some((hr: HrManager) => hr.email.toLowerCase() === email.toLowerCase())) {
                    return; // already assigned
                }

                if (newAssignment.isPrimary) {
                    // Demote old primary
                    company.hrManagers.forEach((hr: HrManager) => { if (hr.isPrimary) hr.isPrimary = false; });
                }

                company.hrManagers.push({
                    email,
                    isPrimary: newAssignment.isPrimary,
                    permissions: newAssignment.permissions,
                    projectAccess: ['all'],
                });
            }
        });
        
        onSave(updatedAssignments);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New HR Manager</DialogTitle>
                    <DialogDescription>Add a new HR manager and assign them to the companies you manage.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="space-y-2 sticky top-0 bg-background py-2">
                        <Label htmlFor="hr-email">HR Manager Email</Label>
                        <Input id="hr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new.manager@email.com" />
                    </div>
                    <div className="space-y-4">
                        <Label>Assign to Companies</Label>
                        {managedCompanies.map(company => {
                            const isAssigned = !!assignments[company];
                            const isPrimary = isAssigned && assignments[company].isPrimary;
                            const currentPrimaryEmail = allAssignments.find(a => a.companyName === company)?.hrManagers.find(m => m.isPrimary)?.email;

                            return (
                                <Card key={company} className={cn("transition-all", isAssigned && "bg-muted/50", isPrimary && "border-primary")}>
                                    <CardHeader className="flex flex-row items-center justify-between p-4">
                                        <Label htmlFor={`assign-${company}`} className="text-base font-semibold">{company}</Label>
                                        <Checkbox
                                            id={`assign-${company}`}
                                            checked={isAssigned}
                                            onCheckedChange={(checked) => handleAssignmentChange(company, !!checked)}
                                        />
                                    </CardHeader>
                                    {isAssigned && (
                                        <CardContent className="p-4 pt-0 space-y-4">
                                            <Separator />
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between rounded-lg border p-3">
                                                    <div>
                                                         <Label>Make Primary Manager</Label>
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Switch 
                                                                checked={isPrimary}
                                                                onCheckedChange={() => {}} // dummy to allow trigger
                                                                disabled={isPrimary}
                                                            />
                                                        </AlertDialogTrigger>
                                                         <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirm Primary Manager Transfer</AlertDialogTitle>
                                                                <AlertDialogDescription asChild>
                                                                    <div>
                                                                        Are you sure you want to make <span className="font-bold">{email}</span> the new Primary Manager for <span className="font-bold">{company}</span>?
                                                                        <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                                                                            <Info className="h-4 w-4 !text-amber-600" />
                                                                            <AlertTitle>Warning</AlertTitle>
                                                                            <AlertDescription>This will demote the current primary ({currentPrimaryEmail}). You may lose permissions if you are not an Admin.</AlertDescription>
                                                                        </Alert>
                                                                    </div>
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handlePrimaryChange(company)}>Confirm & Transfer</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                            {!isPrimary && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>User Management</Label>
                                                        <Select value={assignments[company].permissions.userManagement} onValueChange={(v) => handlePermissionChange(company, 'userManagement', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="invite-only">Invite Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                                <SelectItem value="write-upload">Write & Upload</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                     <div>
                                                        <Label>Form Editor</Label>
                                                        <Select value={assignments[company].permissions.formEditor} onValueChange={(v) => handlePermissionChange(company, 'formEditor', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                     <div>
                                                        <Label>Resources</Label>
                                                        <Select value={assignments[company].permissions.resources} onValueChange={(v) => handlePermissionChange(company, 'resources', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Company Settings</Label>
                                                        <Select value={assignments[company].permissions.companySettings} onValueChange={(v) => handlePermissionChange(company, 'companySettings', v)}>
                                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="read">Read Only</SelectItem>
                                                                <SelectItem value="write">Write</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Add Manager</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function HrManagementPage() {
    const { auth, switchCompany } = useAuth();
    const { companyAssignments, saveCompanyAssignments } = useUserData();
    const { toast } = useToast();

    const [selectedManager, setSelectedManager] = useState<string | null>(null);
    const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
    const [isAddHrOpen, setIsAddHrOpen] = useState(false);

    const { manageableHrs, managedCompanies } = useMemo(() => {
        let companiesWherePrimary: string[] = [];

        if (auth?.role === 'admin') {
            companiesWherePrimary = companyAssignments.map(a => a.companyName);
        } else if (auth?.role === 'hr' && auth.email) {
            companiesWherePrimary = companyAssignments
                .filter(a => a.hrManagers.some(hr => hr.email.toLowerCase() === auth.email!.toLowerCase() && hr.isPrimary))
                .map(a => a.companyName);
        }
        
        const companiesToScan = companyAssignments.filter(a => companiesWherePrimary.includes(a.companyName));
        
        const managers = new Map<string, { email: string, companies: { name: string, projectAccess?: string[] }[] }>();
        companiesToScan.forEach(assignment => {
            assignment.hrManagers.forEach(hr => {
                if (!managers.has(hr.email)) {
                    managers.set(hr.email, { email: hr.email, companies: [] });
                }
                const managerData = managers.get(hr.email)!;
                if (!managerData.companies.some(c => c.name === assignment.companyName)) {
                     managerData.companies.push({name: assignment.companyName, projectAccess: hr.projectAccess});
                }
            });
        });

        return {
            manageableHrs: Array.from(managers.values()),
            managedCompanies: companiesWherePrimary,
        };
    }, [companyAssignments, auth]);
    
    const handleManageClick = (email: string) => {
        setSelectedManager(email);
        setIsManageAccessOpen(true);
    };
    
    const handleSaveAssignments = (email: string, updatedAssignments: CompanyAssignment[]) => {
        saveCompanyAssignments(updatedAssignments);
        toast({ title: "HR Assignments Updated", description: `Access for ${email} has been saved.`});

        if (auth?.email && auth.companyName) {
            const currentAssignment = updatedAssignments.find(a => a.companyName === auth.companyName);
            const isNowPrimary = currentAssignment?.hrManagers.some(hr => hr.email.toLowerCase() === auth.email!.toLowerCase() && hr.isPrimary);
            
            const wasPrimary = managedCompanies.includes(auth.companyName);
            
            if (wasPrimary && !isNowPrimary) {
                switchCompany(auth.companyName);
            }
        }
    };
    
    const handleAddHrSave = (updatedAssignments: CompanyAssignment[]) => {
        saveCompanyAssignments(updatedAssignments);
        toast({ title: "HR Manager Added", description: `The new manager has been assigned to the selected companies.`});
    };

    const assignmentsForDialog = useMemo(() => {
        return companyAssignments.filter(a => managedCompanies.includes(a.companyName));
    }, [companyAssignments, managedCompanies]);

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">HR Management</h1>
                    <p className="text-muted-foreground">
                        {auth?.role === 'admin'
                            ? "View all HR Managers and manage their company assignments and permissions."
                            : "Manage the HR teams for the companies where you are the Primary Manager."
                        }
                    </p>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>HR Managers in Your Scope</CardTitle>
                            <CardDescription>A list of HR managers within the companies you manage.</CardDescription>
                        </div>
                        <Button onClick={() => setIsAddHrOpen(true)}><UserPlus className="mr-2"/> Add New HR Manager</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Assignments</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {manageableHrs.map(manager => {
                                    const projectsByCompany: Record<string, string[]> = {};
                                    assignmentsForDialog.forEach(company => {
                                        const hr = company.hrManagers.find(h => h.email === manager.email);
                                        if (hr && hr.projectAccess && !hr.projectAccess.includes('all')) {
                                            projectsByCompany[company.companyName] = hr.projectAccess.map(pId => company.projects?.find(p => p.id === pId)?.name || 'Unknown Project');
                                        }
                                    });

                                    return (
                                    <TableRow key={manager.email}>
                                        <TableCell className="font-medium">{manager.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                            {manager.companies.map(c => (
                                                <div key={c.name} className="flex items-center gap-2">
                                                    <span className="font-medium">{c.name}</span>
                                                    {projectsByCompany[c.name] ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="outline">{projectsByCompany[c.name].length} Projects</Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{projectsByCompany[c.name].join(', ')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <Badge variant="secondary">All Projects</Badge>
                                                    )}
                                                </div>
                                            ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="ghost" size="icon" onClick={() => handleManageClick(manager.email)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <ManageAccessDialog 
                managerEmail={selectedManager}
                assignments={assignmentsForDialog}
                open={isManageAccessOpen}
                onOpenChange={setIsManageAccessOpen}
                onSave={handleSaveAssignments}
            />

            <AddHrManagerDialog
                open={isAddHrOpen}
                onOpenChange={setIsAddHrOpen}
                managedCompanies={managedCompanies}
                onSave={handleAddHrSave}
                allAssignments={companyAssignments}
            />
        </div>
    );
}
