

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
import { PlusCircle, Trash2, Pencil, Link as LinkIcon, Download, Upload, Replace } from 'lucide-react';
import Papa from 'papaparse';
import TaskForm from '@/components/admin/tasks/TaskForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

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
        if (!taskMappings) return counts;
        taskMappings.forEach(mapping => {
            counts[mapping.taskId] = (counts[mapping.taskId] || 0) + 1;
        });
        return counts;
    }, [taskMappings]);


    const handleAddClick = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (task: MasterTask) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };
    
    const handleViewMappings = (taskId: string) => {
        const mappings = (taskMappings || []).filter(m => m.taskId === taskId);
        setViewingMappings(mappings);
    }

    const handleDeleteClick = (taskId: string) => {
        const updatedTasks = masterTasks.filter(r => r.id !== taskId);
        saveMasterTasks(updatedTasks);
        toast({ title: 'Task Deleted', description: 'The master task has been removed.' });
    };

    const handleSave = (taskData: MasterTask) => {
        let updatedTasks;
        if (editingTask?.id || (masterTasks || []).some(t => t.id === taskData.id)) {
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
        const sampleRow = ["sample-task-id", "layoff", "Sample Task Name", "Basics", "This is a sample task description.", "notification_date", "14", ""];
        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'tasks_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);
    
    const processCsvFile = useCallback((file: File, replace: boolean) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const requiredHeaders = ["id", "name", "category", "detail", "deadlinetype"];
                const fileHeaders = results.meta.fields?.map(h => h.toLowerCase().replace(/\s/g, '')) || [];
                const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));

                if (missingHeaders.length > 0) {
                    toast({ title: "Invalid CSV format", description: `Missing required columns: ${missingHeaders.join(', ')}`, variant: "destructive" });
                    return;
                }
                
                let updatedCount = 0;
                let addedCount = 0;
                let newMasterTasks = replace ? [] : [...(masterTasks || [])];

                results.data.forEach((row: any) => {
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
            },
            error: (error) => {
                toast({ title: "Upload Error", description: error.message, variant: "destructive" });
            }
        });
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

                <Card>
                    <CardHeader>
                        <CardTitle>Master Task List</CardTitle>
                        <CardDescription>The full list of tasks that can be mapped to question answers.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2"/> Download Template</Button>
                            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2"/> Merge with CSV</Button>
                            <input type="file" accept=".csv" ref={replaceFileInputRef} onChange={handleReplaceUpload} className="hidden" />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive"><Replace className="mr-2" /> Replace via CSV</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will completely delete all current master tasks and replace them with the content of your uploaded CSV file. This cannot be undone.
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
                                {masterTasks && masterTasks.map(task => (
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
                allResources={externalResources || []}
            />

            <Dialog open={!!viewingMappings} onOpenChange={() => setViewingMappings(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Task Mappings</DialogTitle>
                        <DialogDescription>
                            This task is triggered by the following question/answer pairs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {viewingMappings && viewingMappings.length > 0 ? (
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Answer</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {viewingMappings.map(mapping => (
                                        <TableRow key={mapping.id}>
                                            <TableCell>{allQuestions[mapping.questionId]?.label || 'N/A'}</TableCell>
                                            <TableCell><Badge variant="outline">{mapping.answerValue}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                 </TableBody>
                             </Table>
                        ) : <p className="text-sm text-muted-foreground text-center">No mappings found for this task.</p>}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
