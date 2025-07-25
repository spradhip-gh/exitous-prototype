
'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useUserData, MasterTask } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Pencil } from 'lucide-react';

const taskCategories = ['Financial', 'Career', 'Health', 'Basics'];
const taskTypes = ['layoff', 'anxious'];

function TaskForm({ isOpen, onOpenChange, onSave, task }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (task: MasterTask) => void;
    task: Partial<MasterTask> | null;
}) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<MasterTask>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof MasterTask, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNumberChange = (name: keyof MasterTask, value: string) => {
        const num = parseInt(value, 10);
        setFormData(prev => ({ ...prev, [name]: isNaN(num) ? undefined : num }));
    }

    const handleSubmit = () => {
        const id = task?.id || formData.id || '';
        if (!id || !formData.name || !formData.category || !formData.detail || !formData.deadlineType) {
            toast({ title: 'All Fields Required', description: 'Please fill in all required fields.', variant: 'destructive' });
            return;
        }
        onSave({ ...formData, id } as MasterTask);
    };
    
    React.useEffect(() => {
        if (task) {
            setFormData(task);
        } else {
            setFormData({
                id: '',
                type: 'layoff',
                category: 'Financial',
                deadlineType: 'notification_date',
            });
        }
    }, [task, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{task?.id ? 'Edit Master Task' : 'Add New Master Task'}</DialogTitle>
                    <DialogDescription>Fill in the details for the task. This task will be available to map to questions.</DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="id">Unique ID</Label>
                        <Input id="id" name="id" value={formData.id || ''} onChange={handleInputChange} placeholder="e.g., apply-for-unemployment" disabled={!!task?.id} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" value={formData.type} onValueChange={(v) => handleSelectChange('type', v)}>
                            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {taskTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Task Name</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} placeholder="e.g., Apply for Unemployment Benefits"/>
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="detail">Task Detail (Markdown)</Label>
                        <Textarea id="detail" name="detail" value={formData.detail || ''} onChange={handleInputChange} placeholder="Provide a detailed description of the task..."/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {taskCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="deadlineType">Deadline Event</Label>
                        <Select name="deadlineType" value={formData.deadlineType} onValueChange={(v) => handleSelectChange('deadlineType', v as any)}>
                            <SelectTrigger id="deadlineType"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="notification_date">Notification Date</SelectItem>
                                <SelectItem value="termination_date">Termination Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deadlineDays">Deadline Days After Event</Label>
                        <Input id="deadlineDays" name="deadlineDays" type="number" value={formData.deadlineDays || ''} onChange={(e) => handleNumberChange('deadlineDays', e.target.value)} placeholder="e.g., 30"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Task</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TaskManagementPage() {
    const { toast } = useToast();
    const { masterTasks, saveMasterTasks, isLoading } = useUserData();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);

    const handleAddClick = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (task: MasterTask) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (taskId: string) => {
        const updatedTasks = masterTasks.filter(r => r.id !== taskId);
        saveMasterTasks(updatedTasks);
        toast({ title: 'Task Deleted', description: 'The master task has been removed.' });
    };

    const handleSave = (taskData: MasterTask) => {
        let updatedTasks;
        if (editingTask?.id || masterTasks.some(t => t.id === taskData.id)) {
            // Update existing
            updatedTasks = masterTasks.map(t => t.id === taskData.id ? taskData : t);
            toast({ title: 'Task Updated', description: `Task "${taskData.name}" has been updated.` });
        } else {
            // Add new
            updatedTasks = [...masterTasks, taskData];
            toast({ title: 'Task Added', description: `Task "${taskData.name}" has been added.` });
        }
        saveMasterTasks(updatedTasks);
        setIsFormOpen(false);
        setEditingTask(null);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="font-headline text-3xl font-bold">Master Task Management</h1>
                        <p className="text-muted-foreground">
                            Create and manage the master list of all possible user tasks.
                        </p>
                    </div>
                    <Button onClick={handleAddClick}><PlusCircle className="mr-2" /> Add New Task</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Master Task List</CardTitle>
                        <CardDescription>The full list of tasks that can be mapped to question answers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Deadline Logic</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {masterTasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-mono text-xs">{task.id}</TableCell>
                                        <TableCell className="font-medium">{task.name}</TableCell>
                                        <TableCell><Badge variant="secondary">{task.category}</Badge></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {task.deadlineDays ? `${task.deadlineDays} days after ${task.deadlineType === 'notification_date' ? 'Notification' : 'Termination'}` : 'No deadline'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(task)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the task "{task.name}". This action cannot be undone and may affect existing mappings.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteClick(task.id)}>Yes, Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <TaskForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                task={editingTask}
            />
        </div>
    );
}

```
  </change>
  <change>
    <file>/src/app/admin/layout.tsx</file>
    <content><![CDATA[

'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Users, UserCheck, Wrench, Building, UserCog, ChevronRight, Menu, Download, TriangleAlert, Library, Settings, HelpCircle, BarChart, Handshake, CheckSquare, Briefcase, Users2, ListChecks } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Footer from '@/components/common/Footer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

function AdminNav({ role, companyName, version, companySettingsComplete }: { role: 'hr' | 'consultant' | 'admin', companyName?: string, version?: 'basic' | 'pro', companySettingsComplete: boolean }) {
  const pathname = usePathname();
  const { auth } = useAuth();
  const { companyAssignments } = useUserData();
  
  const isFormEditorDisabled = role === 'hr' && version === 'basic';
  
  const [isManagementOpen, setIsManagementOpen] = useState(
    pathname.startsWith('/admin/companies') || pathname.startsWith('/admin/users') || pathname.startsWith('/admin/hr-management')
  );
  
  const getVariant = (path: string) => pathname === path ? 'secondary' : 'ghost';

  const getHelpLink = () => {
      switch (role) {
          case 'admin':
              return '/help/admin-guide';
          case 'hr':
              return '/help/hr-guide';
          default:
              return '/help/user-guide';
      }
  }

  const isHrPrimaryOfAnyCompany = useMemo(() => {
    if (role !== 'hr' || !auth?.email) return false;
    return companyAssignments.some(c => c.hrManagers.some(hr => hr.email === auth.email && hr.isPrimary));
  }, [role, auth?.email, companyAssignments]);

  return (
    <nav className="grid items-start gap-1 text-sm font-medium">
       {role === 'admin' && (
        <>
          <Link href="/admin/users">
            <Button variant={getVariant('/admin/users')} className="w-full justify-start">
                <Users className="mr-2" />
                User Management
            </Button>
          </Link>
          <Link href="/admin/companies">
            <Button variant={getVariant('/admin/companies')} className="w-full justify-start text-sm font-normal">
                <Building className="mr-2" />
                Company Management
            </Button>
          </Link>
          <Link href="/admin/forms">
            <Button variant={getVariant('/admin/forms')} className="w-full justify-start">
              <Wrench className="mr-2" />
              Master Form Editor
            </Button>
          </Link>
          <Link href="/admin/tasks">
            <Button variant={getVariant('/admin/tasks')} className="w-full justify-start">
              <ListChecks className="mr-2" />
              Task Management
            </Button>
          </Link>
          <Link href="/admin/external-resources">
            <Button variant={getVariant('/admin/external-resources')} className="w-full justify-start">
              <Handshake className="mr-2" />
              External Resources
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant={getVariant('/admin/analytics')} className="w-full justify-start">
              <BarChart className="mr-2" />
              Analytics
            </Button>
          </Link>
           <Link href="/admin/platform-users">
            <Button variant={getVariant('/admin/platform-users')} className="w-full justify-start">
              <UserCog className="mr-2" />
              Platform Users
            </Button>
          </Link>
          <Link href="/admin/export">
            <Button variant={getVariant('/admin/export')} className="w-full justify-start">
              <Download className="mr-2" />
              Export User Data
            </Button>
          </Link>
          <Separator className="my-2" />
           <Link href={getHelpLink()} target="_blank" rel="noopener noreferrer">
            <Button variant='ghost' className="w-full justify-start">
                <HelpCircle className="mr-2" />
                Help & Guide
            </Button>
           </Link>
        </>
      )}
      {role === 'hr' && (
        <>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {companyName}
            </h2>
            <div className="space-y-1">
              <Link href="/admin/users">
                <Button variant={getVariant('/admin/users')} className="w-full justify-start">
                  <Users className="mr-2" />
                  User Management
                </Button>
              </Link>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Link href="/admin/forms" aria-disabled={isFormEditorDisabled} className={cn(isFormEditorDisabled && 'pointer-events-none')}>
                        <Button variant={getVariant('/admin/forms')} className="w-full justify-start" disabled={isFormEditorDisabled}>
                          <FileText className="mr-2" />
                          Form Editor
                        </Button>
                      </Link>
                    </div>
                  </TooltipTrigger>
                  {isFormEditorDisabled && (
                    <TooltipContent>
                      <p>Upgrade to Pro to edit assessment questions.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <Link href="/admin/analytics">
                <Button variant={getVariant('/admin/analytics')} className="w-full justify-start">
                  <BarChart className="mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href="/admin/resources">
                <Button variant={getVariant('/admin/resources')} className="w-full justify-start">
                  <Library className="mr-2" />
                  Resources
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant={getVariant('/admin/settings')} className="w-full justify-start relative">
                  <Settings className="mr-2" />
                  Company Settings
                  {!companySettingsComplete && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </Button>
              </Link>
            </div>
          </div>
          <Separator />
           <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Global
              </h2>
              <div className="space-y-1">
                {isHrPrimaryOfAnyCompany && (
                 <Link href="/admin/hr-management">
                    <Button variant={getVariant('/admin/hr-management')} className="w-full justify-start">
                        <Users2 className="mr-2" />
                        HR Team Management
                    </Button>
                </Link>
                )}
                <Link href={getHelpLink()} target="_blank" rel="noopener noreferrer">
                  <Button variant='ghost' className="w-full justify-start">
                      <HelpCircle className="mr-2" />
                      Help & Guide
                  </Button>
                </Link>
              </div>
           </div>
        </>
      )}
      {role === 'consultant' && (
        <>
        <Link href="/admin/review">
          <Button variant={getVariant('/admin/review')} className="w-full justify-start">
            <UserCheck className="mr-2" />
            Guidance Editor
          </Button>
        </Link>
        <Link href="/admin/review-queue">
          <Button variant={getVariant('/admin/review-queue')} className="w-full justify-start">
            <CheckSquare className="mr-2" />
            Review Queue
          </Button>
        </Link>
        </>
      )}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  const { companyAssignments } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && auth?.role !== 'hr' && auth?.role !== 'consultant' && auth?.role !== 'admin') {
      router.push('/');
    }
  }, [auth, loading, router]);

  if (loading || !auth || (auth.role !== 'hr' && auth.role !== 'consultant' && auth.role !== 'admin')) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const companyAssignment = auth.companyName ? companyAssignments.find(a => a.companyName === auth.companyName) : null;
  const companySettingsComplete = !!(companyAssignment?.preEndDateContactAlias && companyAssignment?.postEndDateContactAlias);
  
  const navContent = <AdminNav role={auth.role} companyName={auth.companyName} version={companyAssignment?.version} companySettingsComplete={companySettingsComplete} />;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader>
                <SheetTitle className="sr-only">Admin Menu</SheetTitle>
              </SheetHeader>
              {navContent}
            </SheetContent>
          </Sheet>
        </div>
      </Header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
          {navContent}
        </aside>
        <main className="flex-1">
           <div className="border-b border-orange-200 bg-orange-50 p-4">
            <Alert variant="default" className="border-orange-300 bg-transparent">
              <TriangleAlert className="h-4 w-4 !text-orange-600" />
              <AlertTitle className="text-orange-800">Exitous Prototype</AlertTitle>
              <AlertDescription className="text-orange-700">
                Please Note: Data and changes made may refresh to default state at anytime.
              </AlertDescription>
            </Alert>
          </div>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
