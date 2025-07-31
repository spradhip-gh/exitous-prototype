
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MasterTip } from '@/hooks/use-user-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { reviewContent } from '@/ai/flows/content-review';
import { Loader2, Wand2 } from 'lucide-react';

const tipCategories = ['Financial', 'Career', 'Health', 'Basics'];
const tipTypes = ['layoff', 'anxious'];
const tipPriorities = ['High', 'Medium', 'Low'];

export default function TipForm({ isOpen, onOpenChange, onSave, tip }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tip: MasterTip) => void;
    tip: Partial<MasterTip> | null;
}) {
    const { toast } = useToast();
    const [formData, setFormData] = React.useState<Partial<MasterTip>>({});
    const [isReviewing, setIsReviewing] = React.useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof MasterTip, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        const id = tip?.id || `tip-${Date.now()}`;
        if (!formData.text || !formData.category || !formData.priority || !formData.type) {
            toast({ title: 'All Fields Required', description: 'Please fill in all required fields.', variant: 'destructive' });
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
        try {
            const revisedText = await reviewContent(formData.text);
            setFormData(prev => ({ ...prev, text: revisedText }));
            toast({ title: 'AI Review Complete', description: 'The tip text has been updated.'});
        } catch (error) {
            console.error('AI Review Failed:', error);
            toast({ title: 'AI Review Failed', description: 'Could not review the text at this time.', variant: 'destructive'});
        } finally {
            setIsReviewing(false);
        }
    };
    
    React.useEffect(() => {
        if (tip) {
            setFormData(tip);
        } else {
            setFormData({
                id: '',
                type: 'layoff',
                category: 'Financial',
                priority: 'Medium',
                text: '',
            });
        }
    }, [tip, isOpen]);

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
                            <Button type="button" variant="outline" size="sm" onClick={handleAiReview} disabled={isReviewing}>
                                {isReviewing ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                                Review with AI
                            </Button>
                        </div>
                        <Textarea id="text" name="text" value={formData.text || ''} onChange={handleInputChange} placeholder='e.g., You can rollover your 401k to an IRA...'/>
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Tip</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
