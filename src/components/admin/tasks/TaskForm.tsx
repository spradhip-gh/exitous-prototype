

'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalResource, MasterTask, Project } from '@/hooks/use-user-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reviewContent } from '@/ai/flows/content-review';
import { Loader2, Wand2, Terminal, Info, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useUserData } from '@/hooks/use-user-data';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectAssignmentPopover } from '../settings/ProjectAssignmentPopover';

const taskCategories = ['Financial', 'Career', 'Health', 'Basics'];
const taskTypes = ['layoff', 'anxious'];

export default function TaskForm({ isOpen, onOpenChange, onSave, task, allResources, masterTasks }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (task: MasterTask) => void;
    task: Partial<MasterTask> | null;
    allResources?: ExternalResource[];
    masterTasks?: MasterTask[];
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { companyAssignmentForHr } = useUserData();
    const [formData, setFormData] = React.useState<Partial<MasterTask>>({});
    const [isReviewing, setIsReviewing] = React.useState(false);
    const [aiSuggestion, setAiSuggestion] = React.useState<{ revisedName?: string; revisedDetail: string; } | null>(null);
    const [hasBeenReviewed, setHasBeenReviewed] = React.useState(false);
    
    const isAdmin = auth?.role === 'admin';
    const isHr = auth?.role === 'hr';
    const isNewTask = !task?.id;

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
    
    const handleProjectVisibilityChange = (hiddenIds: string[]) => {
        const newProjectIds = (companyAssignmentForHr?.projects || [])
            .map(p => p.id)
            .filter(id => !hiddenIds.includes(id) && !hiddenIds.includes('all'));
            
        if (hiddenIds.includes('__none__')) {
            // No action needed, as unassigned is handled by empty array or inclusion
        }

        setFormData(prev => ({ ...prev, projectIds: newProjectIds }));
    };

    const handleSubmit = () => {
        const id = task?.id || formData.id;
        if (!id || !formData.name || !formData.category || !formData.detail || !formData.deadlineType) {
            toast({ title: 'All Fields Required', description: 'Please fill in all required fields.', variant: 'destructive' });
            return;
        }
        if (!hasBeenReviewed) {
            toast({ title: 'Review Required', description: 'Please review the content with AI before saving.', variant: 'destructive' });
            return;
        }
        onSave({ ...formData, id } as MasterTask);
    };

    const handleAiReview = async () => {
        if (!formData.name && !formData.detail) {
            toast({ title: 'No text to review', variant: 'destructive' });
            return;
        }
        setIsReviewing(true);
        setAiSuggestion(null);

        try {
            const result = await reviewContent({
                name: formData.name || '',
                detail: formData.detail || '',
            });

            if (isNewTask) {
                const nameForId = result.revisedName || formData.name || '';
                let suggestedId = nameForId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                const allKnownTasks = [...(masterTasks || []), ...(companyAssignmentForHr?.companyTasks || [])];

                if (allKnownTasks.some(t => t.id === suggestedId)) {
                    suggestedId += `-${format(new Date(), 'MMddyy')}`;
                }
                
                setFormData(prev => ({...prev, id: suggestedId}));
            }

            const hasNameChanged = result.revisedName && result.revisedName.trim() !== formData.name?.trim();
            const hasDetailChanged = result.revisedDetail && result.revisedDetail.trim() !== formData.detail?.trim();

            if (hasNameChanged || hasDetailChanged) {
                setAiSuggestion(result);
            } else {
                toast({ title: 'No Changes Suggested', description: 'The AI found no improvements to suggest.'});
            }
        } catch (error) {
            console.error('AI Review Failed:', error);
            toast({ title: 'AI Review Failed', description: 'Could not review the text at this time.', variant: 'destructive'});
        } finally {
            setIsReviewing(false);
            setHasBeenReviewed(true);
        }
    };
    
    React.useEffect(() => {
        if (isOpen) {
            setAiSuggestion(null);
            if (task) {
                setFormData(task);
                setHasBeenReviewed(true); // Existing tasks are considered "reviewed"
            } else {
                setFormData({
                    id: '',
                    type: 'layoff',
                    category: 'Financial',
                    deadlineType: 'notification_date',
                    isActive: true, // Default to active for new tasks
                    isCompanySpecific: isHr,
                    projectIds: [],
                });
                setHasBeenReviewed(false);
            }
        }
    }, [task, isOpen, isHr]);

    const activeProjects = companyAssignmentForHr?.projects?.filter(p => !p.isArchived) || [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{task?.id ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                    <DialogDescription>Fill in the details for the task. This task will be available to map to questions.</DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="id">Unique ID</Label>
                             {isNewTask && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={5}>
                                            <p>The ID is auto-generated after AI review.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <Input id="id" name="id" value={formData.id || ''} onChange={handleInputChange} placeholder="e.g., apply-for-unemployment" disabled={isNewTask} />
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
                         <div className="flex justify-between items-center">
                            <Label htmlFor="detail">Task Detail (Markdown)</Label>
                         </div>
                        <Textarea id="detail" name="detail" value={formData.detail || ''} onChange={handleInputChange} placeholder="Provide a detailed description of the task..." rows={5}/>
                    </div>
                     <div className="md:col-span-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleAiReview} disabled={isReviewing}>
                            {isReviewing ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                            Review with AI
                        </Button>
                    </div>
                    {aiSuggestion && (
                        <div className="md:col-span-2">
                            <Alert className="mt-2">
                                <Wand2 className="h-4 w-4" />
                                <AlertTitle>AI Suggestions</AlertTitle>
                                <AlertDescription>
                                    <div className="space-y-4 my-4">
                                        {aiSuggestion.revisedName && aiSuggestion.revisedName.trim() !== formData.name?.trim() && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Revised Name</Label>
                                                <p className="p-2 bg-background rounded-md border text-sm">{aiSuggestion.revisedName}</p>
                                            </div>
                                        )}
                                        {aiSuggestion.revisedDetail.trim() !== formData.detail?.trim() && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Revised Detail</Label>
                                            <p className="p-2 bg-background rounded-md border text-sm">{aiSuggestion.revisedDetail}</p>
                                        </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setAiSuggestion(null)}>Discard</Button>
                                        <Button size="sm" onClick={() => {
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                name: aiSuggestion.revisedName || prev.name,
                                                detail: aiSuggestion.revisedDetail 
                                            }));
                                            setAiSuggestion(null);
                                        }}>Accept Suggestions</Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
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
                    {isHr && (
                        <div className="space-y-2">
                            <Label>Project Visibility</Label>
                             <ProjectAssignmentPopover
                                question={formData as any}
                                projects={activeProjects}
                                companyConfig={ { companyTasks: [formData as MasterTask] } as any }
                                onVisibilityChange={handleProjectVisibilityChange}
                                disabled={!isHr}
                                itemType="Task"
                            />
                        </div>
                    )}
                    {isAdmin && (
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
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!hasBeenReviewed}>Save Task</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
