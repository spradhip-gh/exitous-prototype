
'use client';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserData, CompanyUser } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isToday, isPast } from 'date-fns';
import { cn } from "@/lib/utils";
import { Send, CheckCircle, Pencil, Trash2, CalendarIcon, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { SortConfig } from './HrUserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StatusBadge = ({ isComplete }: { isComplete: boolean }) => (
    isComplete ? (
        <Badge variant="secondary" className="border-green-300 bg-green-100 text-green-800">Completed</Badge>
    ) : (
        <Badge variant="outline">Pending</Badge>
    )
);

const SortableHeader = ({
  children,
  sortKey,
  sortConfig,
  requestSort,
}: {
  children: React.ReactNode;
  sortKey: SortConfig['key'];
  sortConfig: SortConfig;
  requestSort: (key: SortConfig['key']) => void;
}) => {
  const isSorted = sortConfig.key === sortKey;

  return (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="px-2 py-1 h-auto">
        {children}
        <ArrowUpDown className={cn("ml-2 h-4 w-4", !isSorted && "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
};


export default function HrUserTable({ users, setUsers, selectedUsers, setSelectedUsers, sortConfig, requestSort, canWrite, canInvite, isLoading }: {
    users: CompanyUser[];
    setUsers: React.Dispatch<React.SetStateAction<CompanyUser[]>>;
    selectedUsers: Set<string>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    sortConfig: SortConfig;
    requestSort: (key: SortConfig['key']) => void;
    canWrite: boolean;
    canInvite: boolean;
    isLoading: boolean;
}) {
    const { auth } = useAuth();
    const { toast } = useToast();
    const { saveCompanyUsers, profileCompletions, assessmentCompletions, companyAssignmentForHr } = useUserData();
    const companyName = auth?.companyName;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
    const [editedPersonalEmail, setEditedPersonalEmail] = useState('');
    const [editedNotificationDate, setEditedNotificationDate] = useState<Date | undefined>();
    const [editedProjectId, setEditedProjectId] = useState<string | undefined>();

    const selectableUserCount = users.filter(u => !u.is_invited).length;
    const isAllSelected = selectableUserCount > 0 && selectedUsers.size === selectableUserCount;
    const isSomeSelected = selectedUsers.size > 0 && !isAllSelected;

    const isNotifyDisabled = (user: CompanyUser): boolean => {
        if (user.is_invited || !canInvite) return true;
        if (!user.notification_date) return true;
        const notificationDate = parse(user.notification_date, 'yyyy-MM-dd', new Date());
        return !(isToday(notificationDate) || isPast(notificationDate));
    };

    const handleNotifyUsers = async (emailsToNotify: string[]) => {
        if (!companyName) return;
        
        const updates = emailsToNotify.map(email => ({
          id: users.find(u => u.email === email)?.id,
          is_invited: true,
        })).filter(u => u.id);

        const { error } = await supabase.from('company_users').upsert(updates);

        if (error) {
            toast({ title: "Error", description: "Could not send invitations.", variant: "destructive" });
        } else {
             const newUsers = users.map(u => emailsToNotify.includes(u.email) ? { ...u, is_invited: true } : u);
             setUsers(newUsers);
             toast({ title: "Invitations Sent", description: `Invitations sent to ${emailsToNotify.length} users.` });
             setSelectedUsers(new Set());
        }
    };

    const handleToggleSelection = (email: string) => {
        setSelectedUsers(prev => {
            const newSelection = new Set(prev);
            const user = users.find(u => u.email === email);
            if (user?.is_invited) return newSelection;
            if (newSelection.has(email)) newSelection.delete(email);
            else newSelection.add(email);
            return newSelection;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedUsers(new Set(users.filter(u => !u.is_invited).map(u => u.email)));
        else setSelectedUsers(new Set());
    };

    const handleDeleteUser = async (user: CompanyUser) => {
        if (!companyName) return;
        const { error } = await supabase.from('company_users').delete().match({ id: user.id });
        if (error) {
            toast({ title: "Error", description: "Could not remove user.", variant: "destructive" });
        } else {
            setUsers(prev => prev.filter(u => u.id !== user.id));
            toast({ title: "User Removed", description: `${user.email} has been removed.` });
        }
    };

    const handleEditClick = (user: CompanyUser) => {
        setEditingUser(user);
        setEditedPersonalEmail(user.personal_email || '');
        setEditedNotificationDate(user.notification_date ? parse(user.notification_date, 'yyyy-MM-dd', new Date()) : undefined);
        setEditedProjectId(user.project_id || 'none');
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!editingUser || !companyName) return;

        const updatedUserPayload = {
            personal_email: editedPersonalEmail || undefined,
            notification_date: editedNotificationDate ? format(editedNotificationDate, 'yyyy-MM-dd') : editingUser.notification_date,
            project_id: editedProjectId === 'none' ? null : editedProjectId,
        };

        const { data, error } = await supabase.from('company_users').update(updatedUserPayload).eq('id', editingUser.id).select().single();

        if (error || !data) {
             toast({ title: "Error Updating User", description: error?.message || "An unknown error occurred.", variant: "destructive" });
        } else {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? data as CompanyUser : u));
            toast({ title: "User Updated", description: "Changes have been saved." });
            setIsEditDialogOpen(false);
            setEditingUser(null);
        }
    };

    return (
        <TooltipProvider>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all" data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')} disabled={!canInvite}/>
                        </TableHead>
                        <SortableHeader sortKey="email" sortConfig={sortConfig} requestSort={requestSort}>Work Email</SortableHeader>
                        <SortableHeader sortKey="company_user_id" sortConfig={sortConfig} requestSort={requestSort}>Company ID</SortableHeader>
                        <SortableHeader sortKey="project_id" sortConfig={sortConfig} requestSort={requestSort}>Project</SortableHeader>
                        <SortableHeader sortKey="notification_date" sortConfig={sortConfig} requestSort={requestSort}>Notification Date</SortableHeader>
                        <SortableHeader sortKey="profileStatus" sortConfig={sortConfig} requestSort={requestSort}>Profile</SortableHeader>
                        <SortableHeader sortKey="assessmentStatus" sortConfig={sortConfig} requestSort={requestSort}>Assessment</SortableHeader>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                           <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ))
                    ) : users.length > 0 ? users.map(user => {
                        const notifyDisabled = isNotifyDisabled(user);
                        const isSelectionDisabled = user.is_invited || !canInvite;
                        const projectName = companyAssignmentForHr?.projects?.find(p => p.id === user.project_id)?.name || 'N/A';
                        return (
                            <TableRow key={user.id} data-selected={selectedUsers.has(user.email)} className={cn(user.is_invited && "bg-muted/50 text-muted-foreground")}>
                                <TableCell><Checkbox checked={selectedUsers.has(user.email)} onCheckedChange={() => handleToggleSelection(user.email)} aria-label={`Select ${user.email}`} disabled={isSelectionDisabled}/></TableCell>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.company_user_id}</TableCell>
                                <TableCell>{projectName}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{user.notification_date ? format(parse(user.notification_date, 'yyyy-MM-dd', new Date()), 'PPP') : 'N/A'}</span>
                                        {user.is_invited ? <Badge className="bg-green-600 hover:bg-green-700 w-fit"><CheckCircle className="mr-1" /> Invited</Badge> : <Badge variant="secondary" className="w-fit">Pending</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge isComplete={!!profileCompletions[user.email]} /></TableCell>
                                <TableCell><StatusBadge isComplete={!!assessmentCompletions[user.email]} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild><span tabIndex={notifyDisabled ? 0 : -1}><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" disabled={notifyDisabled}><Send className="mr-2" /> Invite</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Invitation</AlertDialogTitle><AlertDialogDescription>This will send an invitation to {user.email}.<br /><br /><strong className="text-foreground">Please note:</strong> emails are not currently sent in prototype mode. This action will mark the user as "Invited".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleNotifyUsers([user.email])}>Confirm & Send</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></span></TooltipTrigger>
                                            {notifyDisabled && !user.is_invited && <TooltipContent><p>{!canInvite ? 'You do not have permission to invite users.' : 'Only available on or after the notification date.'}</p></TooltipContent>}
                                        </Tooltip>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" disabled={!canWrite}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the user "{user.email}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user)}>Yes, Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                        </AlertDialog>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} disabled={!canWrite}><Pencil className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No users added for this company yet.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit User: {editingUser?.email}</DialogTitle><DialogDescription>Update the user's details below. Work email and company ID cannot be changed.</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label htmlFor="edit-work-email">Work Email</Label><Input id="edit-work-email" value={editingUser?.email || ''} disabled /></div>
                        <div className="space-y-2"><Label htmlFor="edit-company-id">Company ID</Label><Input id="edit-company-id" value={editingUser?.company_user_id || ''} disabled /></div>
                        <div className="space-y-2"><Label htmlFor="edit-personal-email">Personal Email</Label><Input id="edit-personal-email" value={editedPersonalEmail} onChange={(e) => setEditedPersonalEmail(e.target.value)} placeholder="user@personal.com"/></div>
                        <div className="space-y-2">
                             <Label htmlFor="edit-project-id">Project / Division</Label>
                             <Select value={editedProjectId} onValueChange={setEditedProjectId}>
                                <SelectTrigger><SelectValue placeholder="Assign to project..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Company-wide)</SelectItem>
                                    {companyAssignmentForHr?.projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-notification-date">Notification Date</Label>
                             <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editedNotificationDate && "text-muted-foreground")} disabled={editingUser?.is_invited}><CalendarIcon className="mr-2 h-4 w-4" />{editedNotificationDate ? format(editedNotificationDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editedNotificationDate} onSelect={setEditedNotificationDate} initialFocus /></PopoverContent></Popover>
                             {editingUser?.is_invited && <p className="text-xs text-muted-foreground">Cannot change date for an invited user.</p>}
                            {editedNotificationDate && isPast(editedNotificationDate) && !isToday(editedNotificationDate) && !editingUser?.is_invited && <div className="flex items-center gap-2 p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md"><AlertCircle className="h-4 w-4" /><div>The Notification Date is in the past. If you are editing the date, ensure this matches the user's actual notification date as it impacts their assessment.</div></div>}
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveChanges}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
