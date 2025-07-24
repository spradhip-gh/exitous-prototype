

'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserData, CompanyAssignment, HrManager, HrPermissions } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Crown, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Permissions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ManageAccessDialog({ managerEmail, assignments, allCompanies, open, onOpenChange, onSave }: {
    managerEmail: string | null;
    assignments: CompanyAssignment[];
    allCompanies: string[];
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
    const unassignedCompanies = allCompanies.filter(c => !managerAssignments.some(a => a.companyName === c));

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
                                        return (
                                            <TableRow key={assignment.companyName}>
                                                <TableCell className="font-medium">{assignment.companyName}</TableCell>
                                                <TableCell>{manager.isPrimary ? <Badge><Crown className="mr-2" />Primary</Badge> : <Badge variant="secondary">Manager</Badge>}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingPermissions({ companyName: assignment.companyName, permissions: manager.permissions })} disabled={manager.isPrimary}><Shield className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveAccess(assignment.companyName)}><Trash2 className="h-4 w-4" /></Button>
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
                            <CardHeader><CardTitle className="text-base">Add Access to Company</CardTitle></CardHeader>
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

export default function HrManagementPage() {
    const { companyAssignments, saveCompanyAssignments } = useUserData();
    const { toast } = useToast();

    const [selectedManager, setSelectedManager] = useState<string | null>(null);
    const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);

    const allHrManagers = useMemo(() => {
        const managers = new Map<string, { email: string, companies: string[] }>();
        companyAssignments.forEach(assignment => {
            assignment.hrManagers.forEach(hr => {
                if (!managers.has(hr.email)) {
                    managers.set(hr.email, { email: hr.email, companies: [] });
                }
                managers.get(hr.email)!.companies.push(assignment.companyName);
            });
        });
        return Array.from(managers.values());
    }, [companyAssignments]);
    
    const allCompanyNames = useMemo(() => companyAssignments.map(a => a.companyName), [companyAssignments]);

    const handleManageClick = (email: string) => {
        setSelectedManager(email);
        setIsManageAccessOpen(true);
    };
    
    const handleSaveAssignments = (email: string, updatedAssignments: CompanyAssignment[]) => {
        saveCompanyAssignments(updatedAssignments);
        toast({ title: "HR Assignments Updated", description: `Access for ${email} has been saved.`});
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">HR Management</h1>
                    <p className="text-muted-foreground">
                        View all HR Managers and manage their company assignments and permissions.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All HR Managers</CardTitle>
                        <CardDescription>A list of all unique HR managers across the platform.</CardDescription>
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
                                {allHrManagers.map(manager => (
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
                allCompanies={allCompanyNames}
                open={isManageAccessOpen}
                onOpenChange={setIsManageAccessOpen}
                onSave={handleSaveAssignments}
            />
        </div>
    );
}

