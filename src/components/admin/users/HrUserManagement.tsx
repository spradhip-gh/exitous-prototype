

'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyUser } from "@/hooks/use-user-data";
import { PlusCircle, Download, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Papa from 'papaparse';
import { CalendarIcon } from "lucide-react";
import HrUserTable from "./HrUserTable";
import BulkActions from "./BulkActions";
import { supabase } from "@/lib/supabase-client";

export type SortConfig = {
    key: keyof CompanyUser | 'profileStatus' | 'assessmentStatus';
    direction: 'asc' | 'desc';
};

const parseDateFromCsv = (dateStr: any): Date | null => {
    if (typeof dateStr !== 'string') return null;

    const trimmedDateStr = dateStr.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDateStr)) {
        return null;
    }
    
    const [year, month, day] = trimmedDateStr.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    
    if (isValid(date)) {
        return date;
    }
    
    return null;
};


export default function HrUserManagement() {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { companyAssignmentForHr, profileCompletions, assessmentCompletions, isLoading: isUserDataLoading, saveCompanyUsers, companyConfigs } = useUserData();
    
    const companyName = auth?.companyName;
    const permissions = auth?.permissions;
    const canWrite = permissions?.userManagement === 'write' || permissions?.userManagement === 'write-upload';
    const canUpload = permissions?.userManagement === 'write-upload';
    const canInvite = canWrite || permissions?.userManagement === 'invite-only';
    
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newCompanyId, setNewCompanyId] = useState("");
    const [newPersonalEmail, setNewPersonalEmail] = useState("");
    const [newNotificationDate, setNewNotificationDate] = useState<Date | undefined>();

    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'notification_date', direction: 'asc' });

    useEffect(() => {
        const loadData = () => {
            if (companyName && !isUserDataLoading) {
                setIsLoading(true);
                const companyData = companyConfigs[companyName];
                setUsers(companyData?.users || []);
                setIsLoading(false);
            }
        };
        loadData();
    }, [companyName, companyConfigs, isUserDataLoading]);

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        const invitedUsers = users.filter(u => u.notified);
        const uninvitedUsers = users.filter(u => !u.notified);

        const sortArray = (array: CompanyUser[], config: SortConfig) => {
            return [...array].sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (config.key === 'profileStatus') {
                    aValue = profileCompletions[a.email] ? 1 : 0;
                    bValue = profileCompletions[b.email] ? 1 : 0;
                } else if (config.key === 'assessmentStatus') {
                    aValue = assessmentCompletions[a.email] ? 1 : 0;
                    bValue = assessmentCompletions[b.email] ? 1 : 0;
                } else {
                    aValue = a[config.key as keyof CompanyUser];
                    bValue = b[config.key as keyof CompanyUser];
                }

                if (aValue === undefined || aValue === null) aValue = '';
                if (bValue === undefined || bValue === null) bValue = '';
                
                if (config.key === 'notification_date') {
                    const timezone = companyAssignmentForHr?.severanceDeadlineTimezone || 'UTC';
                    const dateA = aValue ? toZonedTime(aValue, timezone).getTime() : 0;
                    const dateB = bValue ? toZonedTime(bValue, timezone).getTime() : 0;
                    if (dateA < dateB) return config.direction === 'asc' ? -1 : 1;
                    if (dateA > dateB) return config.direction === 'asc' ? 1 : -1;
                    return 0;
                }

                if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
                return 0;
            });
        };

        const sortedUninvited = sortArray(uninvitedUsers, sortConfig);
        const sortedInvited = sortArray(invitedUsers, sortConfig);

        return [...sortedUninvited, ...sortedInvited];
    }, [users, sortConfig, profileCompletions, assessmentCompletions, companyAssignmentForHr]);

    const addUser = useCallback(async (userToAdd: Partial<CompanyUser>): Promise<boolean> => {
        if (!companyName || !companyAssignmentForHr?.companyId) return false;

        if (companyAssignmentForHr && users.length >= companyAssignmentForHr.maxUsers) {
            toast({ title: "User Limit Reached", description: `Cannot add ${userToAdd.email}. Adding this user would exceed the maximum of ${companyAssignmentForHr.maxUsers} users.`, variant: "destructive" });
            return false;
        }

        if (users.some(u => u.email.toLowerCase() === userToAdd.email?.toLowerCase())) {
            toast({ title: "User Exists", description: `A user with the email ${userToAdd.email} already exists for this company.`, variant: "destructive" });
            return false;
        }

        const { data, error } = await supabase
            .from('company_users')
            .insert({ ...userToAdd, company_id: companyAssignmentForHr.companyId })
            .select()
            .single();

        if (error || !data) {
            toast({ title: "Error", description: "Could not add new user.", variant: "destructive" });
            return false;
        }

        setUsers(prev => [...prev, data as CompanyUser]);
        return true;
    }, [companyAssignmentForHr, companyName, users, toast]);

    const handleAddUser = useCallback(async () => {
        if (!newUserEmail || !newCompanyId || !newNotificationDate) {
            toast({ title: "Required Fields Missing", description: "Please enter Email, Company ID, and a Notification Date.", variant: "destructive" });
            return;
        }

        const newUser: Partial<CompanyUser> = { 
            email: newUserEmail, 
            company_user_id: newCompanyId,
            personal_email: newPersonalEmail || undefined,
            notification_date: format(newNotificationDate, 'yyyy-MM-dd'),
            notified: false,
        };
        
        const success = await addUser(newUser);
        if (success) {
            setNewUserEmail("");
            setNewCompanyId("");
            setNewPersonalEmail("");
            setNewNotificationDate(undefined);
            toast({ title: "User Added", description: `${newUser.email} has been added.` });
        }
    }, [newUserEmail, newCompanyId, newPersonalEmail, newNotificationDate, addUser, toast]);

    const processCsvRow = useCallback((row: any): { userFromCsv?: Partial<CompanyUser>, error?: string } => {
        const email = String(row["email"] || '').trim();
        const companyId = String(row["companyId"] || '').trim();
        const notificationDateStr = String(row["notificationDate"] || '').trim();

        if (!email) return { error: "A row was skipped because the 'email' field was missing." };
        if (!companyId) return { error: `Row for ${email} skipped. Reason: Missing companyId.` };
        if (!notificationDateStr) return { error: `Row for ${email} skipped. Reason: Missing notificationDate.` };
        
        const notificationDate = parseDateFromCsv(notificationDateStr);
        if (!notificationDate) return { error: `Invalid date format for ${email}. Date must be YYYY-MM-DD.` };

        const optionalFields: (keyof CompanyUser['prefilledAssessmentData'])[] = ['finalDate', 'severanceAgreementDeadline', 'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate', 'eapCoverageEndDate'];
        const prefilledData: any = {};
        
        optionalFields.forEach(field => {
            const dateStr = String(row[field] || '').trim();
            if (dateStr) {
                const dateVal = parseDateFromCsv(dateStr);
                if (dateVal) prefilledData[field] = format(dateVal, 'yyyy-MM-dd');
                else console.warn(`Invalid optional date format for ${field} in row for ${email}. Skipping this field.`);
            }
        });
        
        if (String(row['preEndDateContactAlias'] || '').trim()) prefilledData.preEndDateContactAlias = String(row['preEndDateContactAlias']).trim();
        if (String(row['postEndDateContactAlias'] || '').trim()) prefilledData.postEndDateContactAlias = String(row['postEndDateContactAlias']).trim();

        const userFromCsv: Partial<CompanyUser> = {
            email,
            company_user_id: companyId,
            personal_email: String(row["personalEmail"] || '').trim() || undefined,
            notification_date: format(notificationDate, 'yyyy-MM-dd'),
            notified: false,
            prefilled_assessment_data: Object.keys(prefilledData).length > 0 ? prefilledData : undefined
        };
        return { userFromCsv };
    }, []);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !companyName) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const requiredHeaders = ["email", "companyid", "notificationdate"];
                const fileHeaders = results.meta.fields?.map(h => h.trim().toLowerCase()) || [];
                if (!requiredHeaders.every(h => fileHeaders.includes(h))) {
                    toast({ title: "Invalid CSV format", description: "CSV must include columns: email, companyId, notificationDate.", variant: "destructive"});
                    return;
                }
                
                let toAdd: Partial<CompanyUser>[] = [];
                let toUpdate: Partial<CompanyUser>[] = [];

                for (const row of results.data as any[]) {
                    const { userFromCsv, error } = processCsvRow(row);
                    if (error) {
                        toast({ title: "Skipping Row", description: error, variant: "destructive" });
                        continue;
                    }
                    if (userFromCsv) {
                        const existingUser = users.find(u => u.email.toLowerCase() === userFromCsv.email?.toLowerCase());
                        if (existingUser) {
                            if (!existingUser.notified) toUpdate.push({ id: existingUser.id, ...userFromCsv });
                        } else {
                            toAdd.push({ company_id: companyAssignmentForHr?.companyId, ...userFromCsv });
                        }
                    }
                }
                
                let success = true;
                if (toUpdate.length > 0) {
                    const { error } = await supabase.from('company_users').upsert(toUpdate);
                    if (error) {
                        success = false;
                        console.error('Update error:', error);
                    }
                }
                if (toAdd.length > 0) {
                    const { error } = await supabase.from('company_users').insert(toAdd);
                    if (error) {
                        success = false;
                        console.error('Insert error:', error);
                    }
                }
                
                if (success) {
                    toast({ title: "Upload Complete", description: `${toAdd.length} users added, ${toUpdate.length} users updated.` });
                    // Re-fetch data
                     const { data, error } = await supabase.from('company_users').select('*').eq('company_id', companyAssignmentForHr?.companyId);
                    if (!error) setUsers(data as CompanyUser[] || []);
                } else {
                    toast({ title: "Upload Failed", description: "An error occurred during the database operation.", variant: "destructive" });
                }
            }
        });
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [companyName, companyAssignmentForHr, saveCompanyUsers, toast, users, processCsvRow]);


    const handleDownloadTemplate = useCallback(() => {
        const headers = ["email", "companyId", "notificationDate", "personalEmail", "finalDate", "severanceAgreementDeadline", "medicalCoverageEndDate", "dentalCoverageEndDate", "visionCoverageEndDate", "eapCoverageEndDate", "preEndDateContactAlias", "postEndDateContactAlias"];
        const sampleRow = ["user@company.com", "EMP123", "2025-12-31", "user@personal.com", "2026-01-31", "2026-02-15", "", "", "", "", "Your HR Business Partner", "alumni-support@company.com"];
        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'user_upload_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleExportUsers = useCallback(() => {
        if (!users || users.length === 0) {
            toast({ title: "No users to export", variant: "destructive" });
            return;
        }
        const headers = ["email", "companyId", "notificationDate", "notified", "personalEmail", "finalDate", "severanceAgreementDeadline", "medicalCoverageEndDate", "dentalCoverageEndDate", "visionCoverageEndDate", "eapCoverageEndDate", "preEndDateContactAlias", "postEndDateContactAlias"];
        const dataToExport = users.map(user => ({
            email: user.email,
            companyId: user.company_user_id,
            notificationDate: user.notification_date || '',
            notified: user.notified ? 'Yes' : 'No',
            personalEmail: user.personal_email || '',
            finalDate: user.prefilled_assessment_data?.finalDate || '',
            severanceAgreementDeadline: user.prefilled_assessment_data?.severanceAgreementDeadline || '',
            medicalCoverageEndDate: user.prefilled_assessment_data?.medicalCoverageEndDate || '',
            dentalCoverageEndDate: user.prefilled_assessment_data?.dentalCoverageEndDate || '',
            visionCoverageEndDate: user.prefilled_assessment_data?.visionCoverageEndDate || '',
            eapCoverageEndDate: user.prefilled_assessment_data?.eapCoverageEndDate || '',
            preEndDateContactAlias: user.prefilled_assessment_data?.preEndDateContactAlias || '',
            postEndDateContactAlias: user.prefilled_assessment_data?.postEndDateContactAlias || '',
        }));
        const csv = Papa.unparse(dataToExport, { header: true, columns: headers });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${companyName}_user_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [users, toast, companyName]);
    
    const requestSort = useCallback((key: SortConfig['key']) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    if (isUserDataLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!companyName) {
        return (
            <div className="p-4 md:p-8">
                <Card><CardHeader><CardTitle>Error</CardTitle><CardDescription>No company is assigned to your HR account.</CardDescription></CardHeader></Card>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
             <div className="space-y-2">
                <h1 className="font-headline text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage the employee list for {companyName}.</p>
            </div>
            <Card>
                <fieldset disabled={!canWrite}>
                    <CardHeader>
                        <CardTitle>Add New User</CardTitle>
                        <CardDescription>
                            Add an employee who will need to access the assessment for <span className="font-bold">{companyName}</span>.
                            You have added {users.length} of {companyAssignmentForHr?.maxUsers ?? 'N/A'} users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2"><Label htmlFor="newUserEmail">Work Email Address*</Label><Input id="newUserEmail" placeholder="employee@work.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="newCompanyId">Company ID*</Label><Input id="newCompanyId" placeholder="123456" value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} /></div>
                            <div className="space-y-2">
                                <Label htmlFor="newNotificationDate">Notification Date*</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newNotificationDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{newNotificationDate ? format(newNotificationDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newNotificationDate} onSelect={setNewNotificationDate} initialFocus /></PopoverContent></Popover>
                            </div>
                            <div className="space-y-2"><Label htmlFor="newPersonalEmail">Personal Email</Label><Input id="newPersonalEmail" placeholder="user@personal.com" value={newPersonalEmail} onChange={e => setNewPersonalEmail(e.target.value)} /></div>
                            <Button onClick={handleAddUser} className="lg:col-start-4"><PlusCircle className="mr-2" /> Add User</Button>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                         <fieldset disabled={!canUpload}>
                            <div className="space-y-2">
                                <Label>Bulk Upload User Data</Label>
                                <p className="text-sm text-muted-foreground">Upload a CSV file with "email", "companyId", and "notificationDate". All date columns must be in YYYY-MM-DD format. This will add new users or update existing, non-invited users.</p>
                                <input type="file" accept=".csv,.tsv,.txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <div className="flex items-center gap-2"><Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2"/> Upload CSV</Button><Button variant="link" onClick={handleDownloadTemplate} className="text-muted-foreground"><Download className="mr-2" /> Download Template</Button></div>
                            </div>
                        </fieldset>
                    </CardFooter>
                </fieldset>
            </Card>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div><CardTitle>Employee List</CardTitle><CardDescription>Employees who can log in and complete the assessment for <span className="font-bold">{companyName}</span>.</CardDescription></div>
                    <BulkActions selectedUsers={selectedUsers} users={users} setUsers={setUsers} setSelectedUsers={setSelectedUsers} onExport={handleExportUsers} canWrite={canWrite} canInvite={canInvite}/>
                </CardHeader>
                <CardContent>
                   <HrUserTable isLoading={isLoading} users={sortedUsers} setUsers={setUsers} selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} sortConfig={sortConfig} requestSort={requestSort} canWrite={canWrite} canInvite={canInvite}/>
                </CardContent>
            </Card>
        </div>
    );
}
