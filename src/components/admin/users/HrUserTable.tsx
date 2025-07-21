
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
import { cn } from '@/lib/utils';
import { Send, CheckCircle, Pencil, Trash2, CalendarIcon, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { SortConfig } from './HrUserManagement';

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
  const direction = isSorted ? sortConfig.direction : undefined;

  return (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="px-2 py-1 h-auto">
        {children}
        <ArrowUpDown className={cn("ml-2 h-4 w-4", !isSorted && "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
};


export default function HrUserTable({ users, setUsers, selectedUsers, setSelectedUsers, sortConfig, requestSort }: {
    users: CompanyUser[];
    setUsers: React.Dispatch<React.SetStateAction<CompanyUser[]>>;
    selectedUsers: Set<string>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    sortConfig: SortConfig;
    requestSort: (key: SortConfig['key']) => void;
}) {
    const { auth } = useAuth();
    const { toast } = useToast();
    const { saveCompanyUsers, profileCompletions, assessmentCompletions } = useUserData();
    const companyName = auth?.companyName;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
    const [editedPersonalEmail, setEditedPersonalEmail] = useState('');
    const [editedNotificationDate, setEditedNotificationDate] = useState<Date | undefined>();

    const selectableUserCount = users.filter(u => !u.notified).length;
    const isAllSelected = selectableUserCount > 0 && selectedUsers.size === selectableUserCount;
    const isSomeSelected = selectedUsers.size > 0 && !isAllSelected;

    const isNotifyDisabled = (user: CompanyUser): boolean => {
        if (user.notified) return true;
        if (!user.notificationDate) return true;
        const notificationDate = parse(user.notificationDate, 'yyyy-MM-dd', new Date());
        return !(isToday(notificationDate) || isPast(notificationDate));
    };

    const handleNotifyUsers = (emailsToNotify: string[]) => {
        if (!companyName) return;
        const newUsers = users.map(u =>
            emailsToNotify.includes(u.email) ? { ...u, notified: true } : u
        );
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "Invitations Sent", description: `Invitations sent to ${emailsToNotify.length} users.` });
        setSelectedUsers(new Set());
    };

    const handleToggleSelection = (email: string) => {
        setSelectedUsers(prev => {
            const newSelection = new Set(prev);
            const user = users.find(u => u.email === email);
            if (user?.notified) return newSelection;

            if (newSelection.has(email)) {
                newSelection.delete(email);
            } else {
                newSelection.add(email);
            }
            return newSelection;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allSelectableEmails = users.filter(u => !u.notified).map(u => u.email);
            setSelectedUsers(new Set(allSelectableEmails));
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleDeleteUser = (email: string) => {
        if (!companyName) return;
        const newUsers = users.filter(u => u.email !== email);
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "User Removed", description: `${email} has been removed.` });
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
                    notificationDate: editedNotificationDate ? format(editedNotificationDate, 'yyyy-MM-dd') : u.notificationDate,
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

    return (
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
                        <SortableHeader sortKey="email" sortConfig={sortConfig} requestSort={requestSort}>Work Email</SortableHeader>
                        <SortableHeader sortKey="companyId" sortConfig={sortConfig} requestSort={requestSort}>Company ID</SortableHeader>
                        <SortableHeader sortKey="notificationDate" sortConfig={sortConfig} requestSort={requestSort}>Notification Date</SortableHeader>
                        <SortableHeader sortKey="profileStatus" sortConfig={sortConfig} requestSort={requestSort}>Profile</SortableHeader>
                        <SortableHeader sortKey="assessmentStatus" sortConfig={sortConfig} requestSort={requestSort}>Assessment</SortableHeader>
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
                                <TableCell>{user.companyId}</TableCell>
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
                                                                    <br /><br />
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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the user "{user.email}". This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.email)}>Yes, Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">No users added for this company yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

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
        </TooltipProvider>
    );
}
