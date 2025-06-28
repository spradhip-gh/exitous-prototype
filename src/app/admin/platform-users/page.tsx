'use client';

import { useState } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

export default function PlatformUsersPage() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const {
    platformUsers,
    addPlatformUser,
    deletePlatformUser
  } = useUserData();

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'consultant'>('consultant');

  const handleAddUser = () => {
    if (!newUserEmail) {
      toast({ title: "Email Required", description: "Please provide an email address.", variant: "destructive" });
      return;
    }
    if (platformUsers.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
        toast({ title: "User Exists", description: "A user with this email already has platform access.", variant: "destructive" });
        return;
    }

    addPlatformUser({
        email: newUserEmail,
        role: newUserRole
    });
    toast({ title: "User Added", description: `${newUserEmail} has been granted ${newUserRole} access.` });
    setNewUserEmail('');
    setNewUserRole('consultant');
  };

  const handleDeleteUser = (email: string) => {
    if (auth?.email && email.toLowerCase() === auth.email.toLowerCase()) {
        toast({ title: "Cannot Delete Self", description: "You cannot remove your own platform access.", variant: "destructive" });
        return;
    }
    deletePlatformUser(email);
    toast({ title: "User Removed", description: `${email}'s platform access has been revoked.` });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">Platform User Management</h1>
            <p className="text-muted-foreground">
                Grant or revoke Admin and Consultant access to the application.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Add New Platform User</CardTitle>
                <CardDescription>Grant a user Admin or Consultant level permissions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="newUserEmail">User Email</Label>
                        <Input id="newUserEmail" placeholder="user@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newUserRole">Role</Label>
                        <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                            <SelectTrigger id="newUserRole"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="consultant">Consultant</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddUser} className="self-end sm:col-span-1">
                        <PlusCircle className="mr-2" /> Add User
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Current Platform Users</CardTitle>
                <CardDescription>List of all users with Admin or Consultant access.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {platformUsers.length > 0 ? platformUsers.map(user => (
                            <TableRow key={user.email}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={auth?.email?.toLowerCase() === user.email.toLowerCase()}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will revoke all platform access for {user.email}. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(user.email)}>
                                                    Yes, Revoke Access
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">No platform users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
