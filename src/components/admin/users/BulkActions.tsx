'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from '@/components/ui/calendar';
import { Download, PencilRuler, Send, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useUserData, CompanyUser } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function BulkActions({ selectedUsers, users, setUsers, setSelectedUsers, onExport }: {
    selectedUsers: Set<string>;
    users: CompanyUser[];
    setUsers: React.Dispatch<React.SetStateAction<CompanyUser[]>>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    onExport: () => void;
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { saveCompanyUsers } = useUserData();
    const companyName = auth?.companyName;

    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [newBulkNotificationDate, setNewBulkNotificationDate] = useState<Date | undefined>();

    const { eligibleCount, pastDateCount } = useMemo(() => {
        let eligible = 0;
        let past = 0;
        selectedUsers.forEach(email => {
            const user = users.find(u => u.email === email);
            if (user && !user.notified) {
                const notificationDate = user.notificationDate ? new Date(user.notificationDate) : null;
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

    const isBulkNotifyDisabled = eligibleCount === 0;

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

    const handleNotifyUsers = () => {
        if (!companyName) return;
        const emailsToNotify = Array.from(selectedUsers).filter(email => {
            const user = users.find(u => u.email === email);
            return user && !user.notified && user.notificationDate && (isToday(new Date(user.notificationDate)) || isPast(new Date(user.notificationDate)));
        });

        const newUsers = users.map(u =>
            emailsToNotify.includes(u.email) ? { ...u, notified: true } : u
        );
        setUsers(newUsers);
        saveCompanyUsers(companyName, newUsers);
        toast({ title: "Invitations Sent", description: `Invitations sent to ${emailsToNotify.length} users.` });
        setSelectedUsers(new Set());
    };

    return (
        <div className="flex gap-2">
            <Button onClick={onExport} disabled={users.length === 0} variant="secondary">
                <Download className="mr-2" /> Export List
            </Button>
            <Button onClick={() => setIsBulkEditDialogOpen(true)} disabled={selectedUsers.size === 0} variant="outline">
                <PencilRuler className="mr-2" /> Change Dates ({selectedUsers.size})
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
        </div>
    );
}
