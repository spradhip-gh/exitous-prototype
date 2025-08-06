
'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useUserData, MasterTip } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Pencil, Download, Upload, Replace, Archive, ArchiveRestore } from 'lucide-react';
import Papa from 'papaparse';
import TipForm from '@/components/admin/tips/TipForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function TipsManagementPage() {
    const { toast } = useToast();
    const { 
        masterTips,
        saveMasterTips,
        isLoading,
    } = useUserData();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const replaceFileInputRef = React.useRef<HTMLInputElement>(null);


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
        const updatedTips = (masterTips || []).filter(t => t.id !== tipId);
        saveMasterTips(updatedTips);
        toast({ title: 'Tip Deleted', description: 'The "Did you know..." tip has been removed.' });
    };

    const handleSave = (tipData: MasterTip) => {
        let updatedTips;
        if (tipData.id && (masterTips || []).some(t => t.id === tipData.id)) {
            updatedTips = (masterTips || []).map(t => t.id === tipData.id ? tipData : t);
            toast({ title: 'Tip Updated'});
        } else {
            updatedTips = [...(masterTips || []), tipData];
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
    
    const processCsvFile = useCallback((file: File, replace: boolean) => {
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
                let newMasterTips = replace ? [] : [...(masterTips || [])];

                results.data.forEach((row: any) => {
                    const id = row.id?.trim();
                    if (!id || !row.text) return;

                    const tip: MasterTip = {
                        id,
                        text: row.text,
                        category: ['Financial', 'Career', 'Health', 'Basics'].includes(row.category) ? row.category : 'Basics',
                        priority: ['High', 'Medium', 'Low'].includes(row.priority) ? row.priority : 'Medium',
                        type: ['layoff', 'anxious'].includes(row.type) ? row.type : 'layoff',
                        isCompanySpecific: false,
                        isActive: true, // Default to active
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
                if (replace) {
                    toast({ title: "Upload Complete", description: `Tip list replaced with ${addedCount} tips from the file.` });
                } else {
                    toast({ title: "Upload Complete", description: `${addedCount} tips added, ${updatedCount} tips updated.` });
                }
            },
            error: (error) => {
                toast({ title: "Upload Error", description: error.message, variant: "destructive" });
            }
        });
    }, [masterTips, saveMasterTips, toast]);


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
    
    const handleArchiveToggle = (tip: MasterTip) => {
        const updatedTip = { ...tip, isActive: !tip.isActive };
        const updatedTips = (masterTips || []).map(t => t.id === tip.id ? updatedTip : t);
        saveMasterTips(updatedTips);
        toast({ title: `Tip ${updatedTip.isActive ? 'Reactivated' : 'Archived'}` });
    };

    const { activeTips, archivedTips } = useMemo(() => {
        const active: MasterTip[] = [];
        const archived: MasterTip[] = [];
        (masterTips || []).forEach(tip => {
            if (tip.isActive) active.push(tip);
            else archived.push(tip);
        });
        return { activeTips: active, archivedTips: archived };
    }, [masterTips]);


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
                <Card>
                    <CardHeader><CardTitle>Debug View: Raw Tip Data</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-60">
                            <code>{JSON.stringify(masterTips, null, 2)}</code>
                        </pre>
                    </CardContent>
                </Card>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="font-headline text-3xl font-bold">"Did you know..." Tips Management</h1>
                        <p className="text-muted-foreground">
                            Create and manage the master list of contextual tips.
                        </p>
                    </div>
                    <Button onClick={handleAddClick}><PlusCircle className="mr-2" /> Add New Tip</Button>
                </div>
                
                <Tabs defaultValue="active">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Master Tip List</CardTitle>
                                <CardDescription>The full list of tips that can be mapped to question answers.</CardDescription>
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
                                                    This action will completely delete all current master tips and replace them with the content of your uploaded CSV file. This cannot be undone.
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
                                            <TableHead>Text</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeTips && activeTips.map(tip => (
                                            <TableRow key={tip.id}>
                                                <TableCell className="font-medium max-w-lg">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <p className="truncate">{tip.text}</p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-sm">{tip.text}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell><Badge variant="secondary">{tip.category}</Badge></TableCell>
                                                <TableCell><Badge variant={tip.priority === 'High' ? 'destructive' : 'outline'}>{tip.priority}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(tip)}><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleArchiveToggle(tip)}><Archive className="h-4 w-4 text-muted-foreground" /></Button>
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
                            <CardHeader><CardTitle>Archived Tips</CardTitle><CardDescription>These tips are not available for new guidance mappings.</CardDescription></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Text</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {archivedTips && archivedTips.map(tip => (
                                            <TableRow key={tip.id}>
                                                <TableCell className="font-medium text-muted-foreground">{tip.text}</TableCell>
                                                <TableCell><Badge variant="outline">{tip.category}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleArchiveToggle(tip)}><ArchiveRestore className="mr-2" />Reactivate</Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this tip. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClick(tip.id)}>Yes, Delete</AlertDialogAction></AlertDialogFooter>
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
            
            <TipForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                tip={editingTip}
                masterTips={masterTips}
            />
        </div>
    );
}
