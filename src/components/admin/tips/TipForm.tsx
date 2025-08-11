
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MasterTip, Project } from '@/hooks/use-user-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reviewContent } from '@/ai/flows/content-review';
import { Loader2, Wand2, Terminal, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectAssignmentPopover } from '../settings/ProjectAssignmentPopover';

const tipCategories = ['Financial', 'Career', 'Health', 'Basics'];
const tipTypes = ['layoff', 'anxious'];
const tipPriorities = ['High', 'Medium', 'Low'];

export default function TipForm({ isOpen, onOpenChange, onSave, tip, masterTips }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tip: MasterTip) => void;
    tip: Partial<MasterTip> | null;
    masterTips?: MasterTip[];
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { companyAssignmentForHr } = useUserData();
    const [formData, setFormData] = React.useState<Partial<MasterTip>>({});
    const [isReviewing, setIsReviewing] = React.useState(false);
    const [aiSuggestion, setAiSuggestion] = React.useState<{ revisedDetail: string; } | null>(null);
    const [hasBeenReviewed, setHasBeenReviewed] = React.useState(false);

    const isNewTip = !tip?.id;
    const isHr = auth?.role === 'hr';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof MasterTip, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
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
        const id = tip?.id || formData.id;
        if (!id || !formData.text || !formData.category || !formData.priority || !formData.type) {
            toast({ title: 'All Fields Required', description: 'Please fill in all required fields.', variant: 'destructive' });
            return;
        }
         if (!hasBeenReviewed) {
            toast({ title: 'Review Required', description: 'Please review the content with AI before saving.', variant: 'destructive' });
            return;
        }
        onSave({ ...formData, id } as MasterTip);
    };

    const handleAiReview = async () => {
        if (!formData.text) {
            toast({ title: 'No text to review', variant: 'destructive' });
            return;
        }
        setIsReviewing(true);
        setAiSuggestion(null);

        try {
            const result = await reviewContent({ detail: formData.text });

            if (isNewTip) {
                const textForId = result.revisedDetail || formData.text || '';
                let suggestedId = textForId.toLowerCase().split(' ').slice(0, 4).join('-').replace(/[^a-z0-9-]/g, '');

                const allKnownTips = [...(masterTips || []), ...(companyAssignmentForHr?.companyTips || [])];
                if (allKnownTips.some(t => t.id === suggestedId)) {
                    suggestedId += `-${format(new Date(), 'MMddyy')}`;
                }

                setFormData(prev => ({...prev, id: suggestedId}));
            }

            if (result.revisedDetail.trim() !== formData.text.trim()) {
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
            if (tip) {
                setFormData(tip);
                setHasBeenReviewed(true); // Existing tips are considered "reviewed"
            } else {
                setFormData({
                    id: '',
                    type: 'layoff',
                    category: 'Financial',
                    priority: 'Medium',
                    text: '',
                    isActive: true, // Default to active for new tips
                    isCompanySpecific: isHr,
                    projectIds: [],
                });
                setHasBeenReviewed(false);
            }
        }
    }, [tip, isOpen, isHr]);

    const activeProjects = companyAssignmentForHr?.projects?.filter(p => !p.isArchived) || [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{tip?.id ? 'Edit Tip' : 'Add New Tip'}</DialogTitle>
                    <DialogDescription>Create or edit a contextual tip that can be mapped to question answers.</DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2 md:col-span-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="text">Tip Text</Label>
                        </div>
                        <Textarea id="text" name="text" value={formData.text || ''} onChange={handleInputChange} placeholder='e.g., You can rollover your 401k to an IRA...'/>
                         <Button type="button" variant="outline" size="sm" onClick={handleAiReview} disabled={isReviewing}>
                            {isReviewing ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                            Review with AI
                        </Button>
                        {aiSuggestion && (
                            <Alert className="mt-2">
                                <Wand2 className="h-4 w-4" />
                                <AlertTitle>AI Suggestion</AlertTitle>
                                <AlertDescription>
                                     <div className="space-y-4 my-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Revised Detail</Label>
                                            <p className="p-2 bg-background rounded-md border text-sm">{aiSuggestion.revisedDetail}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setAiSuggestion(null)}>Discard</Button>
                                        <Button size="sm" onClick={() => {
                                            setFormData(prev => ({ ...prev, text: aiSuggestion.revisedDetail }));
                                            setAiSuggestion(null);
                                        }}>Accept Suggestion</Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" value={formData.category} onValueChange={(v) => handleSelectChange('category', v as any)}>
                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {tipCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority" value={formData.priority} onValueChange={(v) => handleSelectChange('priority', v as any)}>
                            <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {tipPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" value={formData.type} onValueChange={(v) => handleSelectChange('type', v as any)}>
                            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {tipTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="id">Unique ID</Label>
                             {isNewTip && (
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
                        <Input id="id" name="id" value={formData.id || ''} onChange={handleInputChange} placeholder="e.g., rollover-401k-tip" disabled={isNewTip} />
                    </div>
                     {isHr && (
                        <div className="space-y-2 md:col-span-2">
                             <Label>Project Visibility</Label>
                              <ProjectAssignmentPopover
                                questionId={formData.id || ''}
                                projects={activeProjects}
                                companyConfig={{ customQuestions: { [formData.id!]: formData as MasterTip } }}
                                onVisibilityChange={handleProjectVisibilityChange}
                                disabled={!isHr}
                                itemType="Tip"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!hasBeenReviewed}>Save Tip</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
