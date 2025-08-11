
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from '@/components/ui/calendar';
import { Download, PencilRuler, Send, AlertCircle, VenetianMask } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useUserData, CompanyUser, Project } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase-client';

export default function BulkActions({ selectedUsers, users, setUsers, setSelectedUsers, onExport, canWrite, canInvite, projects }: {
    selectedUsers: Set<string>;
    users: CompanyUser[];
    setUsers: React.Dispatch<React.SetStateAction<CompanyUser[]>>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    onExport: () => void;
    canWrite: boolean;
    canInvite: boolean;
    projects: Project[];
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { saveCompanyUsers } = useUserData();
    const companyName = auth?.companyName;

    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [isBulkProjectDialogOpen, setIsBulkProjectDialogOpen] = useState(false);
    const [newBulkNotificationDate, setNewBulkNotificationDate] = useState<Date | undefined>();
    const [newBulkProjectId, setNewBulkProjectId] = useState<string>('none');

    const { eligibleCount, pastDateCount } = useMemo(() => {
        let eligible = 0;
        let past = 0;
        selectedUsers.forEach(email => {
            const user = users.find(u => u.email === email);
            if (user && !user.is_invited) {
                const notificationDate = user.notification_date ? new Date(user.notification_date) : null;
                if (notificationDate && (isToday(notificationDate) || isPast(notificationDate))) {
                    eligible++;
                }
                if (notificationDate && isPast(notificationDate) && !isToday(notificationDate)) {
                    past++;
                }
            }
        });
        return { eligibleCount: eligible, pastDateCount: past };
    }, [selectedUsers, users]);

    const isBulkNotifyDisabled = eligibleCount === 0 || !canInvite;
    const isBulkActionDisabled = selectedUsers.size === 0 || !canWrite;

    const handleBulkDateChange = async () => {
        if (!newBulkNotificationDate || selectedUsers.size === 0 || !companyName) {
            toast({ title: "Error", description: "No date selected or no users selected.", variant: "destructive" });
            return;
        }

        let updatedCount = 0;
        const updates = Array.from(selectedUsers).map(email => {
            updatedCount++;
            return {
                id: users.find(u => u.email === email)?.id,
                notification_date: format(newBulkNotificationDate, 'yyyy-MM-dd')
            };
        }).filter(u => u.id);

        const { error } = await supabase.from('company_users').upsert(updates);
        if (error) {
            toast({ title: 'Error Updating Users', description: error.message, variant: 'destructive' });
        } else {
            const updatedUsers = users.map(user => {
                if (selectedUsers.has(user.email)) {
                    return { ...user, notification_date: format(newBulkNotificationDate, 'yyyy-MM-dd') };
                }
                return user;
            });
            setUsers(updatedUsers);
            toast({ title: "Dates Updated", description: `Notification date updated for ${updatedCount} ${updatedCount === 1 ? 'user' : 'users'}.` });
        }
        
        setIsBulkEditDialogOpen(false);
        setNewBulkNotificationDate(undefined);
        setSelectedUsers(new Set());
    };
    
    const handleBulkProjectChange = async () => {
        if (selectedUsers.size === 0 || !companyName) {
            toast({ title: "Error", description: "No users selected.", variant: "destructive" });
            return;
        }
        
        const projectId = newBulkProjectId === 'none' ? null : newBulkProjectId;
        
        const updates = Array.from(selectedUsers).map(email => ({
            id: users.find(u => u.email === email)?.id,
            project_id: projectId
        })).filter(u => u.id);

        const { error } = await supabase.from('company_users').upsert(updates);

        if (error) {
            toast({ title: 'Error Assigning Project', description: error.message, variant: 'destructive' });
        } else {
             const updatedUsers = users.map(user => {
                if (selectedUsers.has(user.email)) {
                    return { ...user, project_id: projectId };
                }
                return user;
            });
            setUsers(updatedUsers);
            toast({ title: 'Project Assigned', description: `Project assignment updated for ${selectedUsers.size} users.` });
        }
        
        setIsBulkProjectDialogOpen(false);
        setNewBulkProjectId('none');
        setSelectedUsers(new Set());
    }

    const handleNotifyUsers = () => {
        if (!companyName) return;
        const emailsToNotify = Array.from(selectedUsers).filter(email => {
            const user = users.find(u => u.email === email);
            return user && !user.is_invited && user.notification_date && (isToday(new Date(user.notification_date)) || isPast(new Date(user.notification_date)));
        });

        const newUsers = users.map(u =>
            emailsToNotify.includes(u.email) ? { ...u, is_invited: true } : u
        );
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "Invitations Sent", description: `Invitations sent to ${emailsToNotify.length} users.` });
        setSelectedUsers(new Set());
    };

    return (
        <div className="flex flex-wrap gap-2">
            <Button onClick={onExport} disabled={users.length === 0} variant="secondary">
                <Download className="mr-2" /> Export List
            </Button>
            <Button onClick={() => setIsBulkEditDialogOpen(true)} disabled={isBulkActionDisabled} variant="outline">
                <PencilRuler className="mr-2" /> Change Dates ({selectedUsers.size})
            </Button>
            <Button onClick={() => setIsBulkProjectDialogOpen(true)} disabled={isBulkActionDisabled} variant="outline">
                <VenetianMask className="mr-2" /> Assign Project ({selectedUsers.size})
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button disabled={isBulkNotifyDisabled}>
                        <Send className="mr-2" /> Send Invites ({eligibleCount})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Invitations</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to send invitations to {eligibleCount} user(s).
                            <br /><br />
                            <strong className="text-foreground">Please note:</strong> emails are not currently sent in prototype mode. This action will mark the users as "Invited".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleNotifyUsers}>
                            Confirm & Send
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

            <Dialog open={isBulkProjectDialogOpen} onOpenChange={setIsBulkProjectDialogOpen}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Bulk Assign Project</DialogTitle>
                        <DialogDescription>
                            Assign the {selectedUsers.size} selected users to a project. This will not affect already invited users.
                        </DialogDescription>
                    </DialogHeader>
                     <div className="py-4 space-y-4">
                        <Select value={newBulkProjectId} onValueChange={setNewBulkProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a project..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Company-wide)</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkProjectDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkProjectChange}>Assign Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
