

'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalResource, MasterTask } from '@/hooks/use-user-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const taskCategories = ['Financial', 'Career', 'Health', 'Basics'];
const taskTypes = ['layoff', 'anxious'];

export default function TaskForm({ isOpen, onOpenChange, onSave, task, allResources }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (task: MasterTask) => void;
    task: Partial<MasterTask> | null;
    allResources: ExternalResource[];
}) {
    const { toast } = useToast();
    const [formData, setFormData] = React.useState<Partial<MasterTask>>({});

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
        const id = task?.id || formData.id || `task-${Date.now()}`;
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
                        <Select name="category" value={formData.category} onValueChange={(v) => handleSelectChange('category', v as any)}>
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
                     <div className="space-y-2">
                        <Label htmlFor="linkedResourceId">Linked Resource (Optional)</Label>
                        <Select name="linkedResourceId" value={formData.linkedResourceId} onValueChange={(v) => handleSelectChange('linkedResourceId', v === 'none' ? '' : v)}>
                            <SelectTrigger id="linkedResourceId"><SelectValue placeholder="Select a resource..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {(allResources || []).map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
