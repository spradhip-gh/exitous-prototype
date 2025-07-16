'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyUser } from "@/hooks/use-user-data";
import { Loader2, PlusCircle, Trash2, Upload, Send, Calendar as CalendarIcon, CheckCircle, Pencil, Download, PencilRuler, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse, isToday, isPast, isFuture } from 'date-fns';
import Papa from 'papaparse';
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// Main switcher component
export default function UserManagementPage() {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (auth?.role === 'admin') {
        return <AdminUserManagement />;
    }

    if (auth?.role === 'hr') {
        return <HrUserManagement />;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                 </Card>
            </div>
        </div>
    );
}


// ##################################
// #      ADMIN USER MANAGEMENT     #
// ##################################
function AdminUserManagement() {
    const { toast } = useToast();
    const { getAllCompanyConfigs, saveCompanyUsers, companyAssignments, assessmentCompletions } = useUserData();

    const [selectedCompany, setSelectedCompany] = useState("");
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedCompany) {
            setIsLoading(true);
            const configs = getAllCompanyConfigs();
            const companyUsers = configs[selectedCompany]?.users || [];
            setUsers(companyUsers);
            setIsLoading(false);
        } else {
            setUsers([]);
        }
    }, [selectedCompany, getAllCompanyConfigs]);
    
    const handleAddUser = () => {
        if (!newUserEmail || !newCompanyId) {
            toast({ title: "All Fields Required", description: "Please enter both an email and a Company ID.", variant: "destructive" });
            return;
        }

        const assignment = companyAssignments.find(a => a.companyName === selectedCompany);
        if (assignment && users.length >= assignment.maxUsers) {
            toast({ title: "User Limit Reached", description: `You have reached the maximum of ${assignment.maxUsers} users for this company.`, variant: "destructive" });
            return;
        }

        if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
            toast({ title: "User Exists", description: "A user with this email address already exists for this company.", variant: "destructive" });
            return;
        }
        const newUsers = [...users, { email: newUserEmail, companyId: newCompanyId }];
        setUsers(newUsers);
        saveCompanyUsers(selectedCompany, newUsers);
        setNewUserEmail("");
        setNewCompanyId("");
        toast({ title: "User Added", description: `${newUserEmail} has been added.` });
    };

    const handleDeleteUser = (email: string) => {
        const newUsers = users.filter(u => u.email !== email);
        setUsers(newUsers);
        saveCompanyUsers(selectedCompany, newUsers);
        toast({ title: "User Removed", description: `${email} has been removed.` });
    };

    const currentCompanyAssignment = companyAssignments.find(a => a.companyName === selectedCompany);

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                    Manage employee lists for all companies.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Select Company</CardTitle>
                    <CardDescription>Choose a company to manage its employee list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedCompany} value={selectedCompany}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a company..." />
                        </SelectTrigger>
                        <SelectContent>
                            {companyAssignments.length > 0 ? companyAssignments.map(c => (
                                <SelectItem key={c.companyName} value={c.companyName}>{c.companyName}</SelectItem>
                            )) : <SelectItem value="none" disabled>No companies available</SelectItem>}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedCompany && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Add New User</CardTitle>
                        <CardDescription>
                            Add an employee to <span className="font-bold">{selectedCompany}</span>.
                            This company has {users.length} of {currentCompanyAssignment?.maxUsers ?? 'N/A'} users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newUserEmail">Email Address</Label>
                                <Input id="newUserEmail" placeholder="employee@email.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newCompanyId">Company ID #</Label>
                                <Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} />
                            </div>
                            <Button onClick={handleAddUser} className="self-end">
                                <PlusCircle className="mr-2" /> Add User
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee List</CardTitle>
                        <CardDescription>Employees who can log in and complete the assessment for <span className="font-bold">{selectedCompany}</span>.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email Address</TableHead>
                                    <TableHead>Company ID</TableHead>
                                    <TableHead>Assessment Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                                ) : users.length > 0 ? users.map(user => (
                                    <TableRow key={user.email}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.companyId}</TableCell>
                                        <TableCell>
                                            {assessmentCompletions?.[user.email] ? (
                                                <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
                                            ) : (
                                                <Badge variant="outline">Not Started</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.email)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                </>
            )}
        </div>
    );
}

// ##################################
// #       HR USER MANAGEMENT       #
// ##################################
function HrUserManagement() {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { getAllCompanyConfigs, saveCompanyUsers, profileCompletions, assessmentCompletions, companyAssignmentForHr } = useUserData();
    
    const companyName = auth?.companyName;
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [newPersonalEmail, setNewPersonalEmail] = useState("");
    const [newNotificationDate, setNewNotificationDate] = useState<Date | undefined>();
    
    const [editedPersonalEmail, setEditedPersonalEmail] = useState('');
    const [editedNotificationDate, setEditedNotificationDate] = useState<Date | undefined>();
    const [newBulkNotificationDate, setNewBulkNotificationDate] = useState<Date | undefined>();

    const selectableUserCount = useMemo(() => users.filter(u => !u.notified).length, [users]);
    const isAllSelected = selectableUserCount > 0 && selectedUsers.size === selectableUserCount;
    const isSomeSelected = selectedUsers.size > 0 && !isAllSelected;

    const { eligibleCount, pastDateCount } = useMemo(() => {
        let eligible = 0;
        let past = 0;
        selectedUsers.forEach(email => {
            const user = users.find(u => u.email === email);
            if (user) {
                if (!user.notified) {
                    eligible++;
                    if (user.notificationDate && isPast(parse(user.notificationDate, 'yyyy-MM-dd', new Date())) && !isToday(parse(user.notificationDate, 'yyyy-MM-dd', new Date()))) {
                        past++;
                    }
                }
            }
        });
        return { eligibleCount: eligible, pastDateCount: past };
    }, [selectedUsers, users]);

    useEffect(() => {
        if (companyName) {
            setIsLoading(true);
            const configs = getAllCompanyConfigs();
            const companyUsers = configs[companyName]?.users || [];
            setUsers(companyUsers);
            setIsLoading(false);
        }
    }, [companyName, getAllCompanyConfigs]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!companyName) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>No company is assigned to your HR account.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const addUser = (userToAdd: CompanyUser) => {
        if (!companyName) return false;

        if (companyAssignmentForHr && users.length + 1 > companyAssignmentForHr.maxUsers) {
            toast({ title: "User Limit Reached", description: `Cannot add ${userToAdd.email}. Adding this user would exceed the maximum of ${companyAssignmentForHr.maxUsers} users.`, variant: "destructive" });
            return false;
        }

        if (users.some(u => u.email.toLowerCase() === userToAdd.email.toLowerCase())) {
            toast({ title: "User Exists", description: `A user with the email ${userToAdd.email} already exists for this company.`, variant: "destructive" });
            return false;
        }

        setUsers(prev => [...prev, userToAdd]);
        return true;
    }

    const handleAddUser = () => {
        if (!newUserEmail || !newCompanyId || !newNotificationDate) {
            toast({ title: "Required Fields Missing", description: "Please enter Email, Company ID, and a Notification Date.", variant: "destructive" });
            return;
        }

        const newUser: CompanyUser = { 
            email: newUserEmail, 
            companyId: newCompanyId,
            personalEmail: newPersonalEmail || undefined,
            notificationDate: format(newNotificationDate, 'yyyy-MM-dd'),
            notified: false,
        };
        
        if (addUser(newUser)) {
            const newUsers = [...users, newUser];
            saveCompanyUsers(companyName!, newUsers);
            setNewUserEmail("");
            setNewCompanyId("");
            setNewPersonalEmail("");
            setNewNotificationDate(undefined);
            toast({ title: "User Added", description: `${newUser.email} has been added.` });
        }
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !companyName) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const requiredHeaders = ["email", "companyId", "notificationDate"];
                const headers = (results.meta.fields || []).map(h => h.toLowerCase());
                if (!requiredHeaders.every(h => headers.includes(h))) {
                    toast({ title: "Invalid CSV format", description: `CSV must include columns: email, companyId, notificationDate.`, variant: "destructive"});
                    return;
                }
                
                let addedCount = 0;
                let updatedCount = 0;
                let skippedCount = 0;
                let newUsersList = [...users];

                const optionalFields: (keyof CompanyUser['prefilledAssessmentData'])[] = ['finalDate', 'severanceAgreementDeadline', 'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate', 'eapCoverageEndDate'];

                for (const row of results.data as any[]) {
                    const email = row["email"]?.trim();
                    const companyId = row["companyId"]?.trim();
                    const notificationDateStr = row["notificationDate"]?.trim();

                    if (!email || !companyId || !notificationDateStr) {
                         toast({ title: "Skipping Row", description: `Skipped a row due to missing required fields (email, companyId, notificationDate).`, variant: "destructive"});
                         continue;
                    }
                    
                    const notificationDate = parse(notificationDateStr, 'yyyy-MM-dd', new Date());
                    if (isNaN(notificationDate.getTime())) {
                        toast({ title: "Skipping Row", description: `Invalid date format for ${email} in notificationDate. Please use YYYY-MM-DD.`, variant: "destructive"});
                        continue;
                    }

                    const prefilledData: CompanyUser['prefilledAssessmentData'] = {};
                    optionalFields.forEach(field => {
                        if (row[field]?.trim()) {
                            prefilledData[field] = row[field].trim();
                        }
                    });

                    const userFromCsv: CompanyUser = {
                        email,
                        companyId,
                        personalEmail: row["personalEmail"]?.trim() || undefined,
                        notificationDate: format(notificationDate, 'yyyy-MM-dd'),
                        notified: false, // Default for new/updated users via CSV
                        prefilledAssessmentData: Object.keys(prefilledData).length > 0 ? prefilledData : undefined
                    };
                    
                    const existingUserIndex = newUsersList.findIndex(u => u.email.toLowerCase() === userFromCsv.email.toLowerCase());

                    if (existingUserIndex !== -1) {
                        const existingUser = newUsersList[existingUserIndex];
                        if (existingUser.notified) {
                            skippedCount++;
                            continue; // Skip invited users
                        }
                        // Update existing, non-invited user
                        newUsersList[existingUserIndex] = { ...existingUser, ...userFromCsv };
                        updatedCount++;
                    } else {
                        // Add as a new user
                        newUsersList.push(userFromCsv);
                        addedCount++;
                    }
                }
                
                saveCompanyUsers(companyName, newUsersList);
                setUsers(newUsersList);
                
                let summary = [];
                if (addedCount > 0) summary.push(`${addedCount} new users added.`);
                if (updatedCount > 0) summary.push(`${updatedCount} users updated.`);
                if (skippedCount > 0) summary.push(`${skippedCount} invited users skipped.`);
                
                toast({ 
                    title: "Upload Complete", 
                    description: summary.length > 0 ? summary.join(' ') : 'No changes were made.' 
                });
            },
            error: (error) => {
                toast({ title: "Upload Error", description: error.message, variant: "destructive" });
            }
        });
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ["email", "companyId", "notificationDate", "personalEmail", "finalDate", "severanceAgreementDeadline", "medicalCoverageEndDate", "dentalCoverageEndDate", "visionCoverageEndDate", "eapCoverageEndDate"];
        const csv = headers.join(',');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'user_upload_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportUsers = () => {
        if (!users || users.length === 0) {
            toast({ title: "No users to export", variant: "destructive" });
            return;
        }

        const headers = ["email", "companyId", "notificationDate", "notified", "personalEmail", "finalDate", "severanceAgreementDeadline", "medicalCoverageEndDate", "dentalCoverageEndDate", "visionCoverageEndDate", "eapCoverageEndDate"];
        
        const dataToExport = users.map(user => {
            return {
                email: user.email,
                companyId: user.companyId,
                notificationDate: user.notificationDate || '',
                notified: user.notified ? 'Yes' : 'No',
                personalEmail: user.personalEmail || '',
                finalDate: user.prefilledAssessmentData?.finalDate || '',
                severanceAgreementDeadline: user.prefilledAssessmentData?.severanceAgreementDeadline || '',
                medicalCoverageEndDate: user.prefilledAssessmentData?.medicalCoverageEndDate || '',
                dentalCoverageEndDate: user.prefilledAssessmentData?.dentalCoverageEndDate || '',
                visionCoverageEndDate: user.prefilledAssessmentData?.visionCoverageEndDate || '',
                eapCoverageEndDate: user.prefilledAssessmentData?.eapCoverageEndDate || '',
            };
        });

        const csv = Papa.unparse(dataToExport, { header: true, columns: headers });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${companyName}_user_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteUser = (email: string) => {
        if (!companyName) return;
        const newUsers = users.filter(u => u.email !== email);
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "User Removed", description: `${email} has been removed.` });
    };

    const handleNotifyUsers = (emailsToNotify: string[]) => {
        if (!companyName) return;
        const newUsers = users.map(u => 
            emailsToNotify.includes(u.email) ? { ...u, notified: true } : u
        );
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "Invitations Sent", description: `Invitations sent to ${emailsToNotify.length} users.` });
        setSelectedUsers(new Set()); // Clear selection after notifying
    }

    const handleToggleSelection = (email: string) => {
        setSelectedUsers(prev => {
            const newSelection = new Set(prev);
            const user = users.find(u => u.email === email);
            if (user?.notified) return newSelection; // Do not allow selecting invited users

            if (newSelection.has(email)) {
                newSelection.delete(email);
            } else {
                newSelection.add(email);
            }
            return newSelection;
        });
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allSelectableEmails = users
                .filter(u => !u.notified)
                .map(u => u.email);
            setSelectedUsers(new Set(allSelectableEmails));
        } else {
            setSelectedUsers(new Set());
        }
    }
    
    const isNotifyDisabled = (user: CompanyUser): boolean => {
        if (user.notified) return true;
        if (!user.notificationDate) return true;
        const notificationDate = parse(user.notificationDate, 'yyyy-MM-dd', new Date());
        return !(isToday(notificationDate) || isPast(notificationDate));
    };

    const isBulkNotifyDisabled = () => {
        if (selectedUsers.size === 0) return true;
        // Check if there is at least one selected user who is eligible for notification
        const selectedEmails = Array.from(selectedUsers);
        return !users.some(u => selectedEmails.includes(u.email) && !isNotifyDisabled(u));
    };
    
    const handleEditClick = (user: CompanyUser) => {
        setEditingUser(user);
        setEditedPersonalEmail(user.personalEmail || '');
        setEditedNotificationDate(user.notificationDate ? parse(user.notificationDate, 'yyyy-MM-dd', new Date()) : undefined);
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = () => {
        if (!editingUser || !companyName) return;

        const updatedUsers = users.map(u => {
            if (u.email === editingUser.email) {
                return {
                    ...u,
                    personalEmail: editedPersonalEmail || undefined,
                    notificationDate: editedNotificationDate ? format(editedNotificationDate, 'yyyy-MM-dd') : undefined,
                };
            }
            return u;
        });

        setUsers(updatedUsers);
        saveCompanyUsers(companyName, updatedUsers);
        toast({ title: "User Updated", description: "Changes have been saved." });
        setIsEditDialogOpen(false);
        setEditingUser(null);
    };

    const handleBulkDateChange = () => {
        if (!newBulkNotificationDate || selectedUsers.size === 0 || !companyName) {
            toast({ title: "Error", description: "No date selected or no users selected.", variant: "destructive" });
            return;
        }

        let updatedCount = 0;
        const updatedUsers = users.map(user => {
            if (selectedUsers.has(user.email)) {
                updatedCount++;
                return { ...user, notificationDate: format(newBulkNotificationDate, 'yyyy-MM-dd') };
            }
            return user;
        });

        setUsers(updatedUsers);
        saveCompanyUsers(companyName, updatedUsers);
        toast({ title: "Dates Updated", description: `Notification date updated for ${updatedCount} ${updatedCount === 1 ? 'user' : 'users'}.` });
        
        setIsBulkEditDialogOpen(false);
        setNewBulkNotificationDate(undefined);
        setSelectedUsers(new Set());
    };
    
    const StatusBadge = ({ isComplete }: { isComplete: boolean }) => (
        isComplete ? (
            <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
        ) : (
            <Badge variant="outline">Pending</Badge>
        )
    );
    
    return (
        <div className="p-4 md:p-8 space-y-8">
             <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                    Manage the employee list for {companyName}.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>
                        Add an employee who will need to access the assessment for <span className="font-bold">{companyName}</span>.
                        You have added {users.length} of {companyAssignmentForHr?.maxUsers ?? 'N/A'} users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="newUserEmail">Work Email Address*</Label>
                            <Input id="newUserEmail" placeholder="employee@work.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newCompanyId">Company ID*</Label>
                            <Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newNotificationDate">Notification Date*</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newNotificationDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newNotificationDate ? format(newNotificationDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newNotificationDate} onSelect={setNewNotificationDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="newPersonalEmail">Personal Email</Label>
                            <Input id="newPersonalEmail" placeholder="user@personal.com" value={newPersonalEmail} onChange={e => setNewPersonalEmail(e.target.value)} />
                        </div>
                        <Button onClick={handleAddUser} className="lg:col-start-4">
                            <PlusCircle className="mr-2" /> Add User
                        </Button>
                     </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <div className="space-y-2">
                        <Label>Bulk Upload User Data (Required plus optional assesment fields)</Label>
                        <p className="text-sm text-muted-foreground">Upload a CSV file with "email", "companyId", "notificationDate", and other optional fields. This will add new users or update existing, non-invited users.</p>
                         <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                         <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                               <Upload className="mr-2"/> Upload CSV
                            </Button>
                             <Button variant="link" onClick={handleDownloadTemplate} className="text-muted-foreground">
                                <Download className="mr-2" /> Download Template
                            </Button>
                         </div>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Employee List</CardTitle>
                        <CardDescription>Employees who can log in and complete the assessment for <span className="font-bold">{companyName}</span>.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                         <Button onClick={handleExportUsers} disabled={users.length === 0} variant="secondary">
                           <Download className="mr-2"/> Export List
                        </Button>
                        <Button onClick={() => setIsBulkEditDialogOpen(true)} disabled={selectedUsers.size === 0} variant="outline">
                           <PencilRuler className="mr-2"/> Change Dates ({selectedUsers.size})
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={isBulkNotifyDisabled()}>
                                    <Send className="mr-2" /> Send Invites ({eligibleCount})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Invitations</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You are about to send invitations to {eligibleCount} user(s).
                                        <br/><br/>
                                        <strong className="text-foreground">Please note:</strong> emails are not currently sent in prototype mode. This action will mark the users as "Invited".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleNotifyUsers(Array.from(selectedUsers))}>
                                        Confirm & Send
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            aria-label="Select all"
                                            data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                        />
                                    </TableHead>
                                    <TableHead>Work Email</TableHead>
                                    <TableHead>Notification Date</TableHead>
                                    <TableHead>Profile Status</TableHead>
                                    <TableHead>Assessment Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length > 0 ? users.map(user => {
                                    const notifyDisabled = isNotifyDisabled(user);
                                    const isSelectionDisabled = user.notified;

                                    return (
                                        <TableRow key={user.email} data-selected={selectedUsers.has(user.email)} className={cn(isSelectionDisabled && "bg-muted/50 text-muted-foreground")}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedUsers.has(user.email)}
                                                    onCheckedChange={() => handleToggleSelection(user.email)}
                                                    aria-label={`Select ${user.email}`}
                                                    disabled={isSelectionDisabled}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                <span>{user.notificationDate ? format(parse(user.notificationDate, 'yyyy-MM-dd', new Date()), 'PPP') : 'N/A'}</span>
                                                    {user.notified ? (
                                                        <Badge className="bg-green-600 hover:bg-green-700 w-fit"><CheckCircle className="mr-1" /> Invited</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="w-fit">Pending</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge isComplete={!!profileCompletions[user.email]} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge isComplete={!!assessmentCompletions[user.email]} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {/* The Tooltip needs a child to attach to, even if disabled. A span works well here. */}
                                                            <span tabIndex={notifyDisabled ? 0 : -1}>
                                                               <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="outline" size="sm" disabled={notifyDisabled}>
                                                                            <Send className="mr-2" /> Invite
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Confirm Invitation</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This will send an invitation to {user.email}.
                                                                                <br/><br/>
                                                                                <strong className="text-foreground">Please note:</strong> emails are not currently sent in prototype mode. This action will mark the user as "Invited".
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleNotifyUsers([user.email])}>
                                                                                Confirm & Send
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </span>
                                                        </TooltipTrigger>
                                                        {notifyDisabled && !user.notified && (
                                                            <TooltipContent>
                                                                <p>Only available on or after the notification date.</p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.email)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {editingUser?.email}</DialogTitle>
                        <DialogDescription>
                            Update the user's details below. Work email and company ID cannot be changed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-work-email">Work Email</Label>
                            <Input id="edit-work-email" value={editingUser?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-company-id">Company ID</Label>
                            <Input id="edit-company-id" value={editingUser?.companyId || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-personal-email">Personal Email</Label>
                            <Input 
                                id="edit-personal-email" 
                                value={editedPersonalEmail} 
                                onChange={(e) => setEditedPersonalEmail(e.target.value)} 
                                placeholder="user@personal.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-notification-date">Notification Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedNotificationDate && "text-muted-foreground")} disabled={editingUser?.notified}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editedNotificationDate ? format(editedNotificationDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editedNotificationDate} onSelect={setEditedNotificationDate} initialFocus /></PopoverContent>
                            </Popover>
                             {editingUser?.notified && (
                                <p className="text-xs text-muted-foreground">Cannot change date for an invited user.</p>
                            )}
                            {editedNotificationDate && isPast(editedNotificationDate) && !isToday(editedNotificationDate) && !editingUser?.notified && (
                                <div className="flex items-center gap-2 p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <div>The Notification Date is in the past. If you are editing the date, ensure this matches the user's actual notification date as it impacts their assessment.</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Change Notification Date</DialogTitle>
                        <DialogDescription>
                           Select a new notification date. This will be applied to the {selectedUsers.size} selected {selectedUsers.size === 1 ? 'user' : 'users'}.
                        </DialogDescription>
                    </DialogHeader>
                     <div className="py-4 space-y-4">
                        <Calendar
                            mode="single"
                            selected={newBulkNotificationDate}
                            onSelect={setNewBulkNotificationDate}
                            className="rounded-md border"
                        />
                        {pastDateCount > 0 && (
                             <div className="flex items-center gap-2 p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <div>You are changing the date for {pastDateCount} {pastDateCount === 1 ? 'user' : 'users'} whose original notification date is in the past. Ensure this matches the user's actual notification date as it impacts their assessment.</div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkDateChange}>Apply Date</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

    