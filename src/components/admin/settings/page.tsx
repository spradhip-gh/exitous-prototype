

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, CompanyAssignment, Project, Question, MasterTask, MasterTip, Resource, CompanyConfig } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timezones } from '@/lib/timezones';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, ShieldCheck, Info, PlusCircle, Pencil, Trash2, Archive, ArchiveRestore, ChevronsUpDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import ProjectCustomizationTab from '@/components/admin/settings/ProjectCustomizationTab';

function ProjectFormDialog({
    isOpen,
    onOpenChange,
    onSave,
    project,
    companyDefaults,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (project: Project) => void;
    project: Partial<Project> | null;
    companyDefaults: Partial<CompanyAssignment>;
}) {
    const [name, setName] = useState('');
    const [preEndDateContact, setPreEndDateContact] = useState('');
    const [postEndDateContact, setPostEndDateContact] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('');
    const [deadlineTimezone, setDeadlineTimezone] = useState('');

    const [inheritPreContact, setInheritPreContact] = useState(true);
    const [inheritPostContact, setInheritPostContact] = useState(true);
    const [inheritDeadline, setInheritDeadline] = useState(true);

    useEffect(() => {
        if (project) {
            setName(project.name || '');
            setPreEndDateContact(project.preEndDateContactAlias || '');
            setPostEndDateContact(project.postEndDateContactAlias || '');
            setDeadlineTime(project.severanceDeadlineTime || '');
            setDeadlineTimezone(project.severanceDeadlineTimezone || '');

            setInheritPreContact(!project.preEndDateContactAlias);
            setInheritPostContact(!project.postEndDateContactAlias);
            setInheritDeadline(!project.severanceDeadlineTime && !project.severanceDeadlineTimezone);
        } else {
            setName('');
            setInheritPreContact(true);
            setInheritPostContact(true);
            setInheritDeadline(true);
        }
    }, [project, isOpen]);

    useEffect(() => {
        if (inheritPreContact) setPreEndDateContact('');
    }, [inheritPreContact]);

    useEffect(() => {
        if (inheritPostContact) setPostEndDateContact('');
    }, [inheritPostContact]);

    useEffect(() => {
        if (inheritDeadline) {
            setDeadlineTime('');
            setDeadlineTimezone('');
        }
    }, [inheritDeadline]);

    const handleSave = () => {
        if (!name) return;
        onSave({
            id: project?.id || uuidv4(),
            name,
            isArchived: project?.isArchived || false,
            preEndDateContactAlias: inheritPreContact ? null : preEndDateContact,
            postEndDateContactAlias: inheritPostContact ? null : postEndDateContact,
            severanceDeadlineTime: inheritDeadline ? null : deadlineTime,
            severanceDeadlineTimezone: inheritDeadline ? null : deadlineTimezone,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project/Division Name</Label>
                        <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Contact Aliases</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center space-x-2">
                                <Checkbox id="inherit-pre" checked={inheritPreContact} onCheckedChange={(c) => setInheritPreContact(!!c)} />
                                <Label htmlFor="inherit-pre">Inherit Pre-End Date Contact from Company ({companyDefaults.preEndDateContactAlias || 'Not Set'})</Label>
                            </div>
                            <div className="space-y-2 pl-6">
                                <Label htmlFor="pre-contact">Project-Specific Pre-End Date Contact</Label>
                                <Input id="pre-contact" value={preEndDateContact} onChange={(e) => setPreEndDateContact(e.target.value)} disabled={inheritPreContact} />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="inherit-post" checked={inheritPostContact} onCheckedChange={(c) => setInheritPostContact(!!c)} />
                                <Label htmlFor="inherit-post">Inherit Post-End Date Contact from Company ({companyDefaults.postEndDateContactAlias || 'Not Set'})</Label>
                            </div>
                             <div className="space-y-2 pl-6">
                                <Label htmlFor="post-contact">Project-Specific Post-End Date Contact</Label>
                                <Input id="post-contact" value={postEndDateContact} onChange={(e) => setPostEndDateContact(e.target.value)} disabled={inheritPostContact} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Deadline Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="inherit-deadline" checked={inheritDeadline} onCheckedChange={(c) => setInheritDeadline(!!c)} />
                                <Label htmlFor="inherit-deadline">Inherit Deadline Time/Zone from Company ({companyDefaults.severanceDeadlineTime} {companyDefaults.severanceDeadlineTimezone})</Label>
                            </div>
                             <div className="grid grid-cols-2 gap-4 pl-6">
                               <div className="space-y-2">
                                    <Label htmlFor="deadline-time">Project-Specific Time</Label>
                                    <Input id="deadline-time" type="time" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} disabled={inheritDeadline}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deadline-timezone">Project-Specific Timezone</Label>
                                    <Select value={deadlineTimezone} onValueChange={setDeadlineTimezone} disabled={inheritDeadline}>
                                        <SelectTrigger id="deadline-timezone"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save Project</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const { 
    companyAssignmentForHr, 
    updateCompanyAssignment, 
    companyConfigs,
    isLoading,
    saveCompanyProjects,
  } = useUserData();

  const [deadlineTime, setDeadlineTime] = useState('');
  const [deadlineTimezone, setDeadlineTimezone] = useState('');
  const [preEndDateContact, setPreEndDateContact] = useState('');
  const [postEndDateContact, setPostEndDateContact] = useState('');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  
  const canWrite = auth?.permissions?.companySettings === 'write';
  const companyName = auth?.companyName || '';
  const companyConfig = companyName ? companyConfigs[companyName] : null;

  const userCount = companyConfig?.users?.length ?? 0;
  const maxUsers = companyAssignmentForHr?.maxUsers ?? 0;
  const userProgress = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;
  
  const companySettingsComplete = !!(companyAssignmentForHr?.preEndDateContactAlias && companyAssignmentForHr?.postEndDateContactAlias);

  useEffect(() => {
    if (companyAssignmentForHr) {
      setDeadlineTime(companyAssignmentForHr.severanceDeadlineTime || '23:59');
      setDeadlineTimezone(companyAssignmentForHr.severanceDeadlineTimezone || 'America/Los_Angeles');
      setPreEndDateContact(companyAssignmentForHr.preEndDateContactAlias || '');
      setPostEndDateContact(companyAssignmentForHr.postEndDateContactAlias || '');
    }
  }, [companyAssignmentForHr]);

  const handleSaveChanges = () => {
    if (!auth?.companyName) return;
    
    updateCompanyAssignment(auth.companyName, { 
      severanceDeadlineTime: deadlineTime,
      severanceDeadlineTimezone: deadlineTimezone,
      preEndDateContactAlias: preEndDateContact,
      postEndDateContactAlias: postEndDateContact,
    });
    toast({ title: "Settings Updated", description: "Default settings have been saved." });
  };
  
  const handleUpgrade = () => {
      if (!auth?.companyName) return;
      updateCompanyAssignment(auth.companyName, { version: 'pro' });
      toast({ title: "Company Upgraded!", description: `${auth.companyName} is now on the Pro version.` });
  }

  const handleSaveProject = (project: Project) => {
    if (!auth?.companyName) return;
    const projects = companyAssignmentForHr?.projects || [];
    const existingIndex = projects.findIndex(p => p.id === project.id);
    let newProjects;
    if (existingIndex > -1) {
        newProjects = [...projects];
        newProjects[existingIndex] = project;
    } else {
        newProjects = [...projects, project];
    }
    saveCompanyProjects(auth.companyName, newProjects);
  };
  
  const handleArchiveProject = (project: Project) => {
    const updatedProject = { ...project, isArchived: !project.isArchived };
    handleSaveProject(updatedProject);
  };
  
  const handleEditProjectClick = (project: Project) => {
    setEditingProject(project);
    setIsProjectFormOpen(true);
  };
  
  const handleAddNewProjectClick = () => {
    setEditingProject(null);
    setIsProjectFormOpen(true);
  };

  if (isLoading || companyAssignmentForHr === undefined || !companyConfig) {
    return (
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!companyAssignmentForHr) {
      return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>Could not find company information for your account.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
      )
  }

  const isPro = companyAssignmentForHr.version === 'pro';
  const projects = companyAssignmentForHr.projects || [];
  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  return (
    <>
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company's plan, projects, and default settings.
          </p>
        </div>
        
        {!companySettingsComplete && (
            <Alert variant="destructive">
                <Info className="h-4 w-4"/>
                <AlertTitle>Complete Your Setup</AlertTitle>
                <AlertDescription>
                   Please set the default pre- and post-end date contact aliases before inviting users. This ensures your employees know who to contact for help.
                </AlertDescription>
            </Alert>
        )}
        
        {!canWrite && (
            <Alert variant="default" className="border-orange-300 bg-orange-50">
                <Info className="h-4 w-4 !text-orange-600"/>
                <AlertTitle className="text-orange-900">Read-Only Access</AlertTitle>
                <AlertDescription className="text-orange-800">
                  These settings are universal for the company and can only be changed by the Primary HR Manager.
                </AlertDescription>
            </Alert>
        )}

        <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="customizations">Project Customization</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="mt-6">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan & Usage</CardTitle>
                            <CardDescription>Your current subscription plan and user license details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="text-sm font-medium">Plan Type</p>
                                    <Badge variant={isPro ? 'default' : 'secondary'} className={isPro ? 'bg-green-600' : ''}>
                                    {isPro ? "Pro" : "Basic"}
                                    </Badge>
                                </div>
                                {isPro ? (
                                    <div className="text-green-600 flex items-center gap-2">
                                        <ShieldCheck />
                                        <span className="font-semibold">Active</span>
                                    </div>
                                ) : (
                                    <Button onClick={handleUpgrade} disabled={!canWrite}><ShieldAlert className="mr-2"/>Upgrade to Pro</Button>
                                )}
                            </div>
                            <div>
                                <Label>User Licenses</Label>
                                <Progress value={userProgress} className="w-full mt-2" />
                                <p className="text-sm text-muted-foreground mt-2 text-right">{userCount} of {maxUsers} users</p>
                            </div>
                        </CardContent>
                    </Card>

                    <fieldset disabled={!canWrite}>
                        <Card>
                        <CardHeader>
                            <CardTitle>Contact & Deadline Defaults</CardTitle>
                            <CardDescription>
                            Set default contact aliases and severance deadline times for all users in your company. These can be overridden for individual users via CSV upload or for specific projects.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                <Label htmlFor="pre-end-date-contact">Pre-End Date Contact Alias</Label>
                                <Input id="pre-end-date-contact" placeholder="e.g., Your HR Business Partner" value={preEndDateContact} onChange={(e) => setPreEndDateContact(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="post-end-date-contact">Post-End Date Contact Alias</Label>
                                <Input id="post-end-date-contact" placeholder="e.g., alumni-support@email.com" value={postEndDateContact} onChange={(e) => setPostEndDateContact(e.target.value)} />
                                </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline-time">Default Deadline Time</Label>
                                <Input id="deadline-time" type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline-timezone">Default Timezone</Label>
                                <Select value={deadlineTimezone} onValueChange={setDeadlineTimezone}>
                                <SelectTrigger id="deadline-timezone"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-3">
                            <div className="flex w-full justify-end">
                                <Button onClick={handleSaveChanges}>Save Changes</Button>
                            </div>
                        </CardFooter>
                        </Card>
                    </fieldset>
                </div>
            </TabsContent>
            <TabsContent value="projects" className="mt-6">
                 <fieldset disabled={!canWrite}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Active Projects</CardTitle>
                                <CardDescription>Manage distinct projects or divisions within your company.</CardDescription>
                            </div>
                            <Button onClick={handleAddNewProjectClick}><PlusCircle className="mr-2" /> New Project</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {activeProjects.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon" onClick={() => handleEditProjectClick(p)}><Pencil className="h-4 w-4" /></Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Archive className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Archive Project?</AlertDialogTitle><AlertDialogDescription>This will hide "{p.name}" from active lists but will not delete it.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleArchiveProject(p)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card className="mt-6">
                        <CardHeader><CardTitle>Archived Projects</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {archivedProjects.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="text-muted-foreground">{p.name}</TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon" onClick={() => handleArchiveProject(p)}><ArchiveRestore className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                 </fieldset>
            </TabsContent>
             <TabsContent value="customizations" className="mt-6">
                <ProjectCustomizationTab 
                    companyConfig={companyConfig} 
                    companyName={companyName}
                    projects={activeProjects} 
                    canWrite={canWrite}
                />
            </TabsContent>
        </Tabs>
      </div>
    </div>
    <ProjectFormDialog 
        isOpen={isProjectFormOpen}
        onOpenChange={setIsProjectFormOpen}
        onSave={handleSaveProject}
        project={editingProject}
        companyDefaults={companyAssignmentForHr}
    />
    </>
  );
}
