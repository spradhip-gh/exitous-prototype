
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
