

'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserData, CompanyAssignment, HrManager, HrPermissions } from "@/hooks/use-user-data";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Crown, Shield, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
    const [localAssignments, setLocalAssignments] = useState<CompanyAssignment[]>([]);
    const [editingPermissions, setEditingPermissions] = useState<{ companyName: string, permissions: HrPermissions } | null>(null);

    useEffect(() => {
        if (open) {
            setLocalAssignments(JSON.parse(JSON.stringify(assignments))); // Deep copy
        }
    }, [open, assignments]);

    if (!managerEmail) return null;

    const managerAssignments = localAssignments.filter(a => a.hrManagers.some(hr => hr.email.toLowerCase() === managerEmail.toLowerCase()));
    const unassignedCompanies = managedCompanies.filter(c => !managerAssignments.some(a => a.companyName === c));

    const handleRemoveAccess = (companyName: string) => {
        const companyAssignment = localAssignments.find(a => a.companyName === companyName);
        if (companyAssignment && companyAssignment.hrManagers.length <= 1) {
            toast({ title: "Cannot Remove Last Manager", description: `A company must have at least one HR manager. Assign another manager to ${companyName} first.`, variant: "destructive" });
            return;
        }

        setLocalAssignments(prev => prev.map(a => {
            if (a.companyName === companyName) {
                const updatedManagers = a.hrManagers.filter(hr => hr.email.toLowerCase() !== managerEmail.toLowerCase());
                if (!updatedManagers.some(hr => hr.isPrimary) && updatedManagers.length > 0) {
                    updatedManagers[0].isPrimary = true;
                }
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
                                        const canEdit = managedCompanies.includes(assignment.companyName) && !manager.isPrimary;

                                        return (
                                            <TableRow key={assignment.companyName}>
                                                <TableCell className="font-medium">{assignment.companyName}</TableCell>
                                                <TableCell>{manager.isPrimary ? <Badge><Crown className="mr-2" />Primary</Badge> : <Badge variant="secondary">Manager</Badge>}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingPermissions({ companyName: assignment.companyName, permissions: manager.permissions })} disabled={!canEdit}><Shield className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveAccess(assignment.companyName)} disabled={!managedCompanies.includes(assignment.companyName)}><Trash2 className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {unassignedCompanies.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Add Access to Your Companies</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                     <TableBody>
                                        {unassignedCompanies.map(companyName => (
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

function AddHrManagerDialog({ open, onOpenChange, managedCompanies, onSave, allAssignments }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    managedCompanies: string[];
    onSave: (updatedAssignments: CompanyAssignment[]) => void;
    allAssignments: CompanyAssignment[];
}) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
    
    const handleSave = () => {
        if (!email || selectedCompanies.size === 0) {
            toast({ title: 'Missing Information', description: 'Please provide an email and select at least one company.', variant: 'destructive' });
            return;
        }

        const updatedAssignments = [...allAssignments];
        selectedCompanies.forEach(companyName => {
            const assignmentIndex = updatedAssignments.findIndex(a => a.companyName === companyName);
            if (assignmentIndex > -1) {
                const assignment = updatedAssignments[assignmentIndex];
                if (!assignment.hrManagers.some(hr => hr.email.toLowerCase() === email.toLowerCase())) {
                    assignment.hrManagers.push({ email, isPrimary: false, permissions: defaultPermissions });
                }
            }
        });
        
        onSave(updatedAssignments);
        setEmail('');
        setSelectedCompanies(new Set());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New HR Manager</DialogTitle>
                    <DialogDescription>Add a new HR manager and assign them to the companies you manage.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="hr-email">HR Manager Email</Label>
                        <Input id="hr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new.manager@email.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Assign to Companies</Label>
                        <div className="space-y-2 p-3 border rounded-md max-h-48 overflow-y-auto">
                            {managedCompanies.map(company => (
                                <div key={company} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`company-${company}`}
                                        checked={selectedCompanies.has(company)}
                                        onCheckedChange={(checked) => {
                                            setSelectedCompanies(prev => {
                                                const newSet = new Set(prev);
                                                if (checked) newSet.add(company);
                                                else newSet.delete(company);
                                                return newSet;
                                            });
                                        }}
                                    />
                                    <Label htmlFor={`company-${company}`} className="font-normal">{company}</Label>
                                </div>
                            ))}
                        </div>
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
    const { companyAssignments, saveCompanyAssignments } = useUserData();
    const { toast } = useToast();

    const [selectedManager, setSelectedManager] = useState<string | null>(null);
    const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
    const [isAddHrOpen, setIsAddHrOpen] = useState(false);

    const { manageableHrs, managedCompanies } = useMemo(() => {
        const managers = new Map<string, { email: string, companies: string[] }>();
        let companiesToScan: CompanyAssignment[];
        let primaryForCompanies: string[] = [];

        if (auth?.role === 'admin') {
            companiesToScan = companyAssignments;
            primaryForCompanies = companyAssignments.map(a => a.companyName);
        } else if (auth?.role === 'hr' && auth.email) {
            primaryForCompanies = companyAssignments
                .filter(a => a.hrManagers.some(hr => hr.email.toLowerCase() === auth.email?.toLowerCase() && hr.isPrimary))
                .map(a => a.companyName);
            companiesToScan = companyAssignments.filter(a => primaryForCompanies.includes(a.companyName));
        } else {
            companiesToScan = [];
        }
        
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
            managedCompanies: primaryForCompanies,
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
