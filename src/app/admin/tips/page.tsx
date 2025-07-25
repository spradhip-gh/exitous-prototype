

'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useUserData, MasterTip } from '@/hooks/use-user-data';
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
import { PlusCircle, Trash2, Pencil, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';

const tipCategories = ['Financial', 'Career', 'Health', 'Basics'];
const tipTypes = ['layoff', 'anxious'];
const tipPriorities = ['High', 'Medium', 'Low'];

function TipForm({ isOpen, onOpenChange, onSave, tip }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tip: MasterTip) => void;
    tip: Partial<MasterTip> | null;
}) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<MasterTip>>({});

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
                    <DialogTitle>{tip?.id ? 'Edit "Did you know..." Tip' : 'Add New "Did you know..." Tip'}</DialogTitle>
                    <DialogDescription>Create or edit a contextual tip that can be mapped to question answers.</DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="text">Tip Text</Label>
                        <Textarea id="text" name="text" value={formData.text || ''} onChange={handleInputChange} placeholder='You can rollover your 401k to an IRA...'/>
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

export default function TipsManagementPage() {
    const { toast } = useToast();
    const { 
        masterTips,
        saveMasterTips,
    } = useUserData();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<Partial<MasterTip> | null>(null);

    const handleAddClick = () => {
        setEditingTip(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (tip: MasterTip) => {
        setEditingTip(tip);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (tipId: string) => {
        const updatedTips = masterTips.filter(t => t.id !== tipId);
        saveMasterTips(updatedTips);
        toast({ title: 'Tip Deleted', description: 'The "Did you know..." tip has been removed.' });
    };

    const handleSave = (tipData: MasterTip) => {
        let updatedTips;
        if (editingTip?.id || masterTips.some(t => t.id === tipData.id)) {
            updatedTips = masterTips.map(t => t.id === tipData.id ? tipData : t);
            toast({ title: 'Tip Updated'});
        } else {
            updatedTips = [...masterTips, tipData];
            toast({ title: 'Tip Added'});
        }
        saveMasterTips(updatedTips);
        setIsFormOpen(false);
        setEditingTip(null);
    };
    
    const handleDownloadTemplate = useCallback(() => {
        const headers = ["id", "type", "priority", "category", "text"];
        const sampleRow = ["sample-tip-1", "layoff", "Medium", "Financial", "You can rollover your 401k to an IRA."];
        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'tips_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const requiredHeaders = ["id", "text", "category", "priority", "type"];
                const fileHeaders = results.meta.fields?.map(h => h.toLowerCase().replace(/\s/g, '')) || [];
                if (!requiredHeaders.every(h => fileHeaders.includes(h))) {
                    toast({ title: "Invalid CSV format", description: `CSV must include columns: ${requiredHeaders.join(', ')}`, variant: "destructive" });
                    return;
                }
                
                let updatedCount = 0;
                let addedCount = 0;
                let newMasterTips = [...masterTips];

                results.data.forEach((row: any) => {
                    const id = row.id?.trim();
                    if (!id || !row.text) return;

                    const tip: MasterTip = {
                        id,
                        text: row.text,
                        category: tipCategories.includes(row.category) ? row.category : 'Basics',
                        priority: tipPriorities.includes(row.priority) ? row.priority : 'Medium',
                        type: tipTypes.includes(row.type) ? row.type : 'layoff',
                    };
                    
                    const existingIndex = newMasterTips.findIndex(t => t.id === id);
                    if (existingIndex !== -1) {
                        newMasterTips[existingIndex] = tip;
                        updatedCount++;
                    } else {
                        newMasterTips.push(tip);
                        addedCount++;
                    }
                });

                saveMasterTips(newMasterTips);
                toast({ title: "Upload Complete", description: `${addedCount} tips added, ${updatedCount} tips updated.` });
            },
            error: (error) => {
                toast({ title: "Upload Error", description: error.message, variant: "destructive" });
            }
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [masterTips, saveMasterTips, toast]);


    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="font-headline text-3xl font-bold">"Did you know..." Tips Management</h1>
                        <p className="text-muted-foreground">
                            Create and manage the master list of contextual tips.
                        </p>
                    </div>
                    <Button onClick={handleAddClick}><PlusCircle className="mr-2" /> Add New Tip</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Master Tip List</CardTitle>
                        <CardDescription>The full list of tips that can be mapped to question answers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex gap-2 mb-4">
                            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2"/> Download Template</Button>
                            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2"/> Upload CSV</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Text</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {masterTips.map(tip => (
                                    <TableRow key={tip.id}>
                                        <TableCell className="font-medium max-w-lg truncate">{tip.text}</TableCell>
                                        <TableCell><Badge variant="secondary">{tip.category}</Badge></TableCell>
                                        <TableCell><Badge variant={tip.priority === 'High' ? 'destructive' : 'outline'}>{tip.priority}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(tip)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete this tip. This action cannot be undone and may affect existing mappings.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteClick(tip.id)}>Yes, Delete</AlertDialogAction>
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
            
            <TipForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                tip={editingTip}
            />
        </div>
    );
}
