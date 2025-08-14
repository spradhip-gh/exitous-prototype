

'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useUserData, MasterTask, ExternalResource } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Pencil, Link as LinkIcon, Download, Upload, Replace, Archive, ArchiveRestore } from 'lucide-react';
import * as XLSX from 'xlsx';
import TaskForm from '@/components/admin/tasks/TaskForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function TaskManagementPage() {
    const { toast } = useToast();
    const { 
        masterTasks, 
        saveMasterTasks, 
        isLoading, 
        taskMappings, 
        masterQuestions, 
        masterProfileQuestions,
        externalResources, 
        guidanceRules,
        companyConfigs,
    } = useUserData();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);
    const [viewingMappings, setViewingMappings] = useState<any[] | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const replaceFileInputRef = React.useRef<HTMLInputElement>(null);
    
    const allQuestions = useMemo(() => {
        return {...masterQuestions, ...masterProfileQuestions};
    }, [masterQuestions, masterProfileQuestions]);
    
    const taskMappingCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        if (guidanceRules) {
            guidanceRules.forEach(rule => {
                rule.assignments?.taskIds?.forEach(taskId => {
                    counts[taskId] = (counts[taskId] || 0) + 1;
                });
                rule.ranges?.forEach(range => {
                    range.assignments.taskIds.forEach(taskId => {
                        counts[taskId] = (counts[taskId] || 0) + 1;
                    });
                });
            });
        }
        if (companyConfigs) {
             Object.values(companyConfigs).forEach(config => {
                if (config.answerGuidanceOverrides) {
                    Object.values(config.answerGuidanceOverrides).forEach(answerMap => {
                        Object.values(answerMap).forEach(guidance => {
                            guidance.tasks?.forEach(taskId => {
                                counts[taskId] = (counts[taskId] || 0) + 1;
                            });
                        });
                    });
                }
            });
        }
        return counts;
    }, [guidanceRules, companyConfigs]);

    const handleAddClick = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (task: MasterTask) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };
    
    const handleViewMappings = (taskId: string) => {
        const directMappings = guidanceRules.filter(rule => rule.assignments.taskIds?.includes(taskId) || rule.ranges?.some(r => r.assignments.taskIds.includes(taskId)));
        
        const companyMappings: {companyName: string, questionLabel: string, answer: string}[] = [];
        Object.entries(companyConfigs).forEach(([companyName, config]) => {
            if (config.answerGuidanceOverrides) {
                Object.entries(config.answerGuidanceOverrides).forEach(([questionId, answerMap]) => {
                     Object.entries(answerMap).forEach(([answer, guidance]) => {
                        if (guidance.tasks?.includes(taskId)) {
                            companyMappings.push({
                                companyName,
                                questionLabel: allQuestions[questionId]?.label || questionId,
                                answer,
                            });
                        }
                    });
                });
            }
        });

        setViewingMappings({ direct: directMappings, company: companyMappings });
    }
    
    const handleDeleteClick = (taskId: string) => {
        const updatedTasks = (masterTasks || []).filter(r => r.id !== taskId);
        saveMasterTasks(updatedTasks);
        toast({ title: 'Task Deleted', description: 'The master task has been permanently removed.' });
    };

    const handleSave = (taskData: MasterTask) => {
        let updatedTasks;
        if (taskData.id && (masterTasks || []).some(t => t.id === taskData.id)) {
            // Update existing
            updatedTasks = (masterTasks || []).map(t => t.id === taskData.id ? taskData : t);
            toast({ title: 'Task Updated', description: `Task "${taskData.name}" has been updated.` });
        } else {
            // Add new
            updatedTasks = [...(masterTasks || []), taskData];
            toast({ title: 'Task Added', description: `Task "${taskData.name}" has been added.` });
        }
        saveMasterTasks(updatedTasks);
        setIsFormOpen(false);
        setEditingTask(null);
    };

     const handleDownloadTemplate = useCallback(() => {
        const headers = ["id", "type", "name", "category", "detail", "deadlineType", "deadlineDays", "linkedResourceId"];
        const sampleData = [{
            id: "sample-task-id",
            type: "layoff",
            name: "Sample Task Name",
            category: "Basics",
            detail: "This is a sample task description.",
            deadlineType: "notification_date",
            deadlineDays: 14,
            linkedResourceId: ""
        }];
        const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
        XLSX.writeFile(workbook, "tasks_template.xlsx");
    }, []);
    
    const processCsvFile = useCallback((file: File, replace: boolean) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const results = XLSX.utils.sheet_to_json(worksheet);

            const requiredHeaders = ["id", "name", "category", "detail", "deadlineType"];
            const fileHeaders = Object.keys(results[0] as object).map(h => h.toLowerCase().replace(/\s/g, '')) || [];
            const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));

            if (missingHeaders.length > 0) {
                toast({ title: "Invalid Excel format", description: `Missing required columns: ${missingHeaders.join(', ')}`, variant: "destructive" });
                return;
            }
            
            let updatedCount = 0;
            let addedCount = 0;
            let newMasterTasks = replace ? [] : [...(masterTasks || [])];

            results.forEach((row: any) => {
                const id = row.id?.trim();
                if (!id) return; // Skip rows without an id

                const task: MasterTask = {
                    id,
                    type: ['layoff', 'anxious'].includes(row.type) ? row.type : 'layoff',
                    name: row.name || 'Unnamed Task',
                    category: ['Financial', 'Career', 'Health', 'Basics'].includes(row.category) ? row.category : 'Basics',
                    detail: row.detail || '',
                    deadlineType: ['notification_date', 'termination_date'].includes(row.deadlineType) ? row.deadlineType : 'notification_date',
                    deadlineDays: row.deadlineDays ? parseInt(row.deadlineDays, 10) : undefined,
                    linkedResourceId: row.linkedResourceId || undefined,
                    isCompanySpecific: false,
                    isActive: true,
                };
                
                const existingIndex = newMasterTasks.findIndex(t => t.id === id);
                if (existingIndex !== -1) {
                    newMasterTasks[existingIndex] = task;
                    updatedCount++;
                } else {
                    newMasterTasks.push(task);
                    addedCount++;
                }
            });

            saveMasterTasks(newMasterTasks);
            if(replace) {
                toast({ title: "Upload Complete", description: `Task list replaced with ${addedCount} tasks from the file.` });
            } else {
                toast({ title: "Upload Complete", description: `${addedCount} tasks added, ${updatedCount} tasks updated.` });
            }
        };
        reader.readAsBinaryString(file);
    }, [masterTasks, saveMasterTasks, toast]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processCsvFile(file, false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [processCsvFile]);

    const handleReplaceUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processCsvFile(file, true);
        if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }, [processCsvFile]);
    
    const { activeTasks, archivedTasks } = useMemo(() => {
        const active: MasterTask[] = [];
        const archived: MasterTask[] = [];
        (masterTasks || []).forEach(task => {
            if (task.isActive) active.push(task);
            else archived.push(task);
        });
        return { activeTasks: active, archivedTasks: archived };
    }, [masterTasks]);

    const handleArchiveToggle = (task: MasterTask) => {
        const mappingsCount = taskMappingCounts[task.id] || 0;
        if (task.isActive && mappingsCount > 0) {
            handleViewMappings(task.id);
        } else {
            const updatedTask = { ...task, isActive: !task.isActive };
            const updatedTasks = masterTasks.map(t => t.id === task.id ? updatedTask : t);
            saveMasterTasks(updatedTasks);
            toast({ title: `Task ${updatedTask.isActive ? 'Reactivated' : 'Archived'}` });
        }
    };


    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

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
                 <Tabs defaultValue="active">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Master Task List</CardTitle>
                                <CardDescription>The full list of tasks that can be mapped to question answers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2"/> Download Template</Button>
<<<<<<< HEAD
                                    <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2"/> Merge with Excel</Button>
                                    <input type="file" accept=".xlsx" ref={replaceFileInputRef} onChange={handleReplaceUpload} className="hidden" />
=======
                                    <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2"/> Merge with Excel</Button>
                                    <input type="file" accept=".csv,.xlsx" ref={replaceFileInputRef} onChange={handleReplaceUpload} className="hidden" />
>>>>>>> bfcb76c (Lets make all exports xls files)
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive"><Replace className="mr-2" /> Replace via Excel</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action will completely delete all current master tasks and replace them with the content of your uploaded Excel file. This cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => replaceFileInputRef.current?.click()}>
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Linked Resource</TableHead>
                                            <TableHead>Mappings</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeTasks && activeTasks.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-mono text-xs">{task.id}</TableCell>
                                                <TableCell className="font-medium">{task.name}</TableCell>
                                                <TableCell><Badge variant="secondary">{task.category}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{(externalResources || []).find(r => r.id === task.linkedResourceId)?.name || 'None'}</TableCell>
                                                <TableCell>
                                                    <Button variant="link" className="p-0 h-auto" onClick={() => handleViewMappings(task.id)}>
                                                        {taskMappingCounts[task.id] || 0}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(task)}><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleArchiveToggle(task)}><Archive className="h-4 w-4 text-muted-foreground" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="archived" className="mt-6">
                         <Card>
                            <CardHeader><CardTitle>Archived Tasks</CardTitle><CardDescription>These tasks are not available for new guidance mappings.</CardDescription></CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {archivedTasks && archivedTasks.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium text-muted-foreground">{task.name}</TableCell>
                                                <TableCell><Badge variant="outline">{task.category}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleArchiveToggle(task)}><ArchiveRestore className="mr-2" />Reactivate</Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the task "{task.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClick(task.id)}>Yes, Delete</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                 </Tabs>
            </div>
            
            <TaskForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                task={editingTask}
                allResources={externalResources || []}
                masterTasks={masterTasks}
            />

            <Dialog open={!!viewingMappings} onOpenChange={() => setViewingMappings(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Task in Use</DialogTitle>
                        <DialogDescription>
                            This task is currently mapped and cannot be archived. Please either remove it from the following guidance rules or create a new rule to replace it before archiving.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {viewingMappings?.direct && viewingMappings.direct.length > 0 && (
                             <div>
                                <h4 className="font-semibold text-sm mb-2">Master Guidance Rules:</h4>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Rule Name</TableHead><TableHead>Question</TableHead></TableRow></TableHeader>
                                     <TableBody>
                                        {viewingMappings.direct.map((rule: any) => (
                                            <TableRow key={rule.id}>
                                                <TableCell>{rule.name}</TableCell>
                                                <TableCell>{allQuestions[rule.questionId]?.label || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                         {viewingMappings?.company && viewingMappings.company.length > 0 && (
                             <div>
                                <h4 className="font-semibold text-sm mb-2">Company-Specific Mappings:</h4>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Question</TableHead><TableHead>Answer</TableHead></TableRow></TableHeader>
                                     <TableBody>
                                        {viewingMappings.company.map((mapping: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell>{mapping.companyName}</TableCell>
                                                <TableCell>{mapping.questionLabel}</TableCell>
                                                <TableCell><Badge variant="outline">{mapping.answer}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
