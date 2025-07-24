

'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserData, CompanyAssignment, HrManager, HrPermissions } from "@/hooks/use-user-data";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Crown, Shield, UserPlus, Info } from "lucide-react";
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

function PermissionsDialog({ open, onOpenChange, onSave, permissions }: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (permissions: HrPermissions) => void,
    permissions: HrPermissions
}) {
    const [editedPermissions, setEditedPermissions] = useState<HrPermissions>(permissions);

    useEffect(() => {
        if (open) {
            setEditedPermissions(permissions);
        }
    }, [open, permissions]);

    const handleSave = () => {
        onSave(editedPermissions);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Permissions</DialogTitle>
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
    );
}

function ManageAccessDialog({ managerEmail, assignments, managedCompanies, open, onOpenChange, onSave }: {
    managerEmail: string | null;
    assignments: CompanyAssignment[];
    managedCompanies: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (email: string, updatedAssignments: CompanyAssignment[]) => void;
}) {
    const { toast } = useToast();
    const { updateCompanyAssignment } = useUserData();
    const [localAssignments, setLocalAssignments] = useState<CompanyAssignment[]>([]);
    const [editingPermissions, setEditingPermissions] = useState<{ companyName: string, permissions: HrPermissions } | null>(null);

    useEffect(() => {
        if (open) {
            setLocalAssignments(JSON.parse(JSON.stringify(assignments))); // Deep copy
        }
    }, [open, assignments]);

    if (!managerEmail) return null;

    const managerAssignments = localAssignments.filter(a => a.hrManagers.some(hr => hr.email.toLowerCase() === managerEmail.toLowerCase()));
    
    // Admins can add to any company, HRs can only add to companies they are primary for
    const addableCompanies = assignments.filter(c => {
        const isManagedByLoggedInUser = managedCompanies.includes(c.companyName);
        const isAlreadyAssigned = managerAssignments.some(ma => ma.companyName === c.companyName);
        return isManagedByLoggedInUser && !isAlreadyAssigned;
    }).map(c => c.companyName);

    const handleRemoveAccess = (companyName: string) => {
        const companyAssignment = localAssignments.find(a => a.companyName === companyName);
        if (!companyAssignment || !managerEmail) return;

        const managerInQuestion = companyAssignment.hrManagers.find(hr => hr.email.toLowerCase() === managerEmail.toLowerCase());
        
        if (managerInQuestion?.isPrimary) {
            toast({ title: "Action Prohibited", description: `You cannot remove a Primary Manager. Please assign a new primary for ${companyName} first.`, variant: "destructive" });
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
                return { ...a, hrManagers: [...a.hrManagers, { email: managerEmail, isPrimary: false, permissions: defaultPermissions }] };
            }
            return a;
        }));
    };
    
    const handleMakePrimary = (companyName: string, newPrimaryManagerEmail: string) => {
        updateCompanyAssignment(companyName, { newPrimaryManagerEmail });
        toast({ title: 'Primary Manager Updated', description: `${newPrimaryManagerEmail} is now the primary manager for ${companyName}.`});
        
        // Refresh local state to reflect the change immediately in the dialog
        const updatedLocalAssignments = localAssignments.map(a => {
            if (a.companyName === companyName) {
                return {
                    ...a,
                    hrManagers: a.hrManagers.map(hr => ({
                        ...hr,
                        isPrimary: hr.email.toLowerCase() === newPrimaryManagerEmail.toLowerCase()
                    }))
                };
            }
            return a;
        });
        setLocalAssignments(updatedLocalAssignments);
    };

    const handleSavePermissions = (companyName: string, permissions: HrPermissions) => {
        setLocalAssignments(prev => prev.map(a => {
            if (a.companyName === companyName) {
                return {
                    ...a,
                    hrManagers: a.hrManagers.map(hr => hr.email.toLowerCase() === managerEmail.toLowerCase() ? { ...hr, permissions } : hr)
                };
            }
            return a;
        }));
        setEditingPermissions(null);
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
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Assigned Companies</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Company</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {managerAssignments.map(assignment => {
                                        const manager = assignment.hrManagers.find(hr => hr.email.toLowerCase() === managerEmail.toLowerCase());
                                        if (!manager) return null;
                                        
                                        const canEditThisCompany = managedCompanies.includes(assignment.companyName);
                                        const isPrimaryInThisCompany = manager.isPrimary;
                                        const isLastManager = assignment.hrManagers.length <= 1;

                                        const isDeleteDisabled = !canEditThisCompany || isPrimaryInThisCompany || isLastManager;

                                        return (
                                            <TableRow key={assignment.companyName}>
                                                <TableCell className="font-medium">{assignment.companyName}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {isPrimaryInThisCompany ? <Badge><Crown className="mr-2" />Primary</Badge> : <Badge variant="secondary">Manager</Badge>}
                                                        <Switch
                                                            id={`primary-switch-${assignment.companyName}`}
                                                            checked={isPrimaryInThisCompany}
                                                            onCheckedChange={() => handleMakePrimary(assignment.companyName, managerEmail)}
                                                            disabled={!canEditThisCompany || isPrimaryInThisCompany}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingPermissions({ companyName: assignment.companyName, permissions: manager.permissions })} disabled={!canEditThisCompany || isPrimaryInThisCompany}><Shield className="h-4 w-4" /></Button>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span tabIndex={isDeleteDisabled ? 0 : -1}>
                                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveAccess(assignment.companyName)} disabled={isDeleteDisabled}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>You cannot delete a primary user. Please assign a new primary for the company first.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
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
                {editingPermissions && (
                    <PermissionsDialog
                        open={!!editingPermissions}
                        onOpenChange={() => setEditingPermissions(null)}
                        permissions={editingPermissions.permissions}
                        onSave={(perms) => handleSavePermissions(editingPermissions.companyName, perms)}
                    />
                )}
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
                permissions: { ...prev[companyName].permissions, [key]: value }
            }
        }));
    };
    
    const handlePrimaryChange = (companyName: string, isPrimary: boolean) => {
        setAssignments(prev => ({
            ...prev,
            [companyName]: {
                ...prev[companyName],
                isPrimary: isPrimary,
                permissions: isPrimary ? fullPermissions : defaultPermissions
            }
        }));
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
                    permissions: newAssignment.permissions
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

                            return (
                                <Card key={company} className={cn("transition-all", isAssigned ? "bg-muted/50" : "bg-background", isPrimary && "border-primary")}>
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
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                         <Label>Make Primary Manager</Label>
                                                    </div>
                                                    <Switch 
                                                        checked={isPrimary}
                                                        onCheckedChange={(checked) => handlePrimaryChange(company, checked)}
                                                    />
                                                </div>
                                                {isPrimary && (
                                                     <Alert variant="destructive" className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
                                                      <Info className="h-4 w-4 !text-amber-600" />
                                                      <AlertTitle>Warning</AlertTitle>
                                                      <AlertDescription>Warning: This will demote the current primary (you), you will retain all permissions except managing HR Managers and Company Settings.</AlertDescription>
                                                    </Alert>
                                                )}
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
    const { auth } = useAuth();
    const { companyAssignments, saveCompanyAssignments, updateCompanyAssignment } = useUserData();
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
                .filter(a => a.hrManagers.some(hr => hr.email.toLowerCase() === auth.email?.toLowerCase() && hr.isPrimary))
                .map(a => a.companyName);
        }
        
        const companiesToScan = companyAssignments.filter(a => companiesWherePrimary.includes(a.companyName));
        
        const managers = new Map<string, { email: string, companies: string[] }>();
        companiesToScan.forEach(assignment => {
            assignment.hrManagers.forEach(hr => {
                if (!managers.has(hr.email)) {
                    managers.set(hr.email, { email: hr.email, companies: [] });
                }
                const managerData = managers.get(hr.email)!;
                if (!managerData.companies.includes(assignment.companyName)) {
                     managerData.companies.push(assignment.companyName);
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
    };
    
    const handleAddHrSave = (updatedAssignments: CompanyAssignment[]) => {
        saveCompanyAssignments(updatedAssignments);
        toast({ title: "HR Manager Added", description: `The new manager has been assigned to the selected companies.`});
    };

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
                                    <TableHead>Company Assignments</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {manageableHrs.map(manager => (
                                    <TableRow key={manager.email}>
                                        <TableCell className="font-medium">{manager.email}</TableCell>
                                        <TableCell>{manager.companies.length}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleManageClick(manager.email)}>
                                                Manage Access
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <ManageAccessDialog 
                managerEmail={selectedManager}
                assignments={companyAssignments}
                managedCompanies={managedCompanies}
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
