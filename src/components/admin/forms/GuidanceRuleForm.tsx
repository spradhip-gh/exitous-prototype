

'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUserData, Question, MasterTask, MasterTip, GuidanceRule, Condition, Calculation, ExternalResource } from "@/hooks/use-user-data";
import { tenureOptions } from '@/lib/guidance-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ChevronsUpDown, Wand2, LinkIcon, BrainCircuit, Check, Info } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert } from '@/components/ui/alert';

const taskCategories = ['Financial', 'Career', 'Health', 'Basics'];
const tipCategories = ['Financial', 'Career', 'Health', 'Basics'];

export function MultiSelectPopover({
    label,
    items,
    selectedIds,
    onSelectionChange,
    onAddNew,
    categories,
    popoverContentWidth = "w-[300px]"
}: {
    label: string,
    items: { id: string; name: string; category: string }[],
    onSelectionChange: (newIds: string[]) => void,
    onAddNew: () => void,
    selectedIds?: string[],
    categories: string[],
    popoverContentWidth?: string
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const validSelectedIds = selectedIds || [];

    const filteredItems = useMemo(() => {
        let list = items;

        if (categoryFilter) {
            list = list.filter(item => item.category === categoryFilter);
        }

        if (search) {
            list = list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
        }

        return list;
    }, [search, items, categoryFilter]);
    
    const handleSelect = (id: string) => {
        const newSelection = validSelectedIds.includes(id)
            ? validSelectedIds.filter(currentId => currentId !== id)
            : [...validSelectedIds, id];
        onSelectionChange(newSelection);
    }
    
    const displayLabel = useMemo(() => {
        if (validSelectedIds.length === 0) return `0 selected`;
        if (validSelectedIds.length <= 2) {
            return validSelectedIds.map(id => items.find(item => item.id === id)?.name).filter(Boolean).join(', ');
        }
        return `${validSelectedIds.length} selected`;
    }, [validSelectedIds, items]);

    const tooltipContent = useMemo(() => {
        return validSelectedIds.map(id => items.find(item => item.id === id)?.name).filter(Boolean).join(', ');
    }, [validSelectedIds, items]);


    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenu open={open} onOpenChange={setOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between font-normal">
                                    <span className="truncate">{displayLabel}</span> <ChevronsUpDown className="h-4 w-4 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className={popoverContentWidth} align="start">
                                <div className="p-2">
                                     <Input 
                                        placeholder={`Search ${label.toLowerCase()}...`}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                 <div className="p-2 pt-0 flex flex-wrap gap-1">
                                    <Button variant={!categoryFilter ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={() => setCategoryFilter(null)}>All</Button>
                                    {categories.map(cat => (
                                         <Button key={cat} variant={categoryFilter === cat ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={() => setCategoryFilter(cat)}>{cat}</Button>
                                    ))}
                                </div>
                                <DropdownMenuSeparator />
                                <ScrollArea className="max-h-64">
                                     {filteredItems.length > 0 ? filteredItems.map(item => (
                                        <DropdownMenuCheckboxItem
                                            key={item.id}
                                            checked={validSelectedIds.includes(item.id)}
                                            onCheckedChange={() => handleSelect(item.id)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <span className="truncate" title={item.name}>{item.name}</span>
                                        </DropdownMenuCheckboxItem>
                                    )) : (
                                        <p className="p-2 text-xs text-center text-muted-foreground">No items found.</p>
                                    )}
                                </ScrollArea>
                                <DropdownMenuSeparator />
                                 <DropdownMenuItem onSelect={(e) => {
                                    e.preventDefault();
                                    onAddNew();
                                    setOpen(false);
                                 }}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Create new {label.includes('Task') ? 'task...' : 'tip...'}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipTrigger>
                    {validSelectedIds.length > 0 && (
                        <TooltipContent>
                           <p className="max-w-xs">
                             {tooltipContent}
                           </p>
                        </TooltipContent>
                    )}
                 </Tooltip>
            </TooltipProvider>
            {validSelectedIds.length > 2 && <p className="text-xs text-muted-foreground pl-1">Hover to see all selections.</p>}
        </div>
    );
}


export default function GuidanceRuleForm({ question, allQuestions, existingRules, onSave, onDelete, masterTasks, masterTips, onAddNewTask, onAddNewTip, allResources, pendingItem, onPendingItemConsumed }: {
    question: Question | null;
    allQuestions: Question[];
    existingRules: GuidanceRule[];
    onSave: (rule: GuidanceRule) => void;
    onDelete: (ruleId: string) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
    onAddNewTask: () => void;
    onAddNewTip: () => void;
    allResources: ExternalResource[];
    pendingItem: { type: 'task' | 'tip'; item: MasterTask | MasterTip } | null;
    onPendingItemConsumed: () => void;
}) {
    const { toast } = useToast();
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [ruleType, setRuleType] = useState<'direct' | 'calculated'>('direct');
    
    // Direct mapping state
    const [directAnswers, setDirectAnswers] = useState<string[]>([]);
    const [directTasks, setDirectTasks] = useState<string[]>([]);
    const [directTips, setDirectTips] = useState<string[]>([]);
    const [isNoGuidanceDirect, setIsNoGuidanceDirect] = useState(false);
    const [isCatchAll, setIsCatchAll] = useState(false);
    
    // Calculated mapping state
    const [calculationType, setCalculationType] = useState<Calculation['type']>('tenure');
    const [calculationUnit, setCalculationUnit] = useState<'years' | 'days'>('years');
    const [startDateQuestion, setStartDateQuestion] = useState<string>('');
    const [endDateQuestion, setEndDateQuestion] = useState<string>('');
    const [ranges, setRanges] = useState<({ from: number, to: number, tasks:string[], tips:string[], noGuidanceRequired?: boolean})[]>([{ from: 0, to: 5, tasks:[], tips:[] }]);
    const [ruleName, setRuleName] = useState('');
    
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const [conflictingRule, setConflictingRule] = useState<GuidanceRule | null>(null);

    const dateQuestions = useMemo(() => allQuestions.filter(q => q.type === 'date'), [allQuestions]);

    const resetForm = () => {
        setRuleName('');
        setRuleType('direct');
        setDirectAnswers([]);
        setDirectTasks([]);
        setDirectTips([]);
        setIsNoGuidanceDirect(false);
        setIsCatchAll(false);
        setCalculationType('tenure');
        setCalculationUnit('years');
        setStartDateQuestion('');
        setEndDateQuestion('');
        setRanges([{ from: 0, to: 5, tasks:[], tips:[], noGuidanceRequired: false }]);
    }
    
    useEffect(() => {
        if (selectedRuleId) {
            const rule = existingRules.find(r => r.id === selectedRuleId);
            if (rule) {
                setRuleName(rule.name);
                setRuleType(rule.type);
                if (rule.type === 'direct') {
                    const answers = rule.conditions.map(c => c.answer || '');
                    setDirectAnswers(answers);
                    setDirectTasks(rule.assignments?.taskIds || []);
                    setDirectTips(rule.assignments?.tipIds || []);
                    setIsNoGuidanceDirect(rule.assignments?.noGuidanceRequired || false);
                    setIsCatchAll(answers.length === 0 && rule.conditions.some(c => c.answer === undefined));
                } else if (rule.type === 'calculated') {
                    setCalculationType(rule.calculation?.type || 'tenure');
                    setCalculationUnit(rule.calculation?.unit || 'years');
                    if(rule.calculation?.type === 'tenure') {
                        setStartDateQuestion(rule.calculation.startDateQuestionId || '');
                        setEndDateQuestion(rule.calculation.endDateQuestionId || '');
                    }
                    setRanges(rule.ranges?.map(r => ({ from: r.from, to: r.to, tasks: r.assignments.taskIds, tips: r.assignments.tipIds, noGuidanceRequired: r.assignments.noGuidanceRequired || false })) || [{ from: 0, to: 5, tasks:[], tips:[] }])
                }
            }
        } else {
            resetForm();
        }
    }, [selectedRuleId, existingRules]);

    useEffect(() => {
        if (pendingItem) {
            if (pendingItem.type === 'task') {
                setDirectTasks(prev => [...prev, pendingItem.item.id]);
            } else if (pendingItem.type === 'tip') {
                setDirectTips(prev => [...prev, pendingItem.item.id]);
            }
            onPendingItemConsumed(); // Clear the pending item
        }
    }, [pendingItem, onPendingItemConsumed]);

    useEffect(() => {
        if (ruleType === 'direct' && !selectedRuleId) {
            if (isCatchAll) {
                setRuleName(`${question?.label} - All Answers`);
            } else if (directAnswers.length > 0) {
                const answerText = directAnswers.length > 2 ? `${directAnswers.length} answers` : directAnswers.join(', ');
                setRuleName(`${question?.label} - ${answerText}`);
            } else {
                setRuleName('');
            }
        }
    }, [directAnswers, isCatchAll, ruleType, question?.label, selectedRuleId]);
    
    if (!question) return null;

    const mappedAnswersInOtherRules = new Set(
        existingRules
            .filter(r => r.id !== selectedRuleId)
            .flatMap(r => r.conditions.map(c => c.answer))
    );

    const catchAllRuleForQuestion = existingRules.find(r => r.id !== selectedRuleId && r.conditions.some(c => c.answer === undefined));

    const finishSave = (finalTasks: string[], finalTips: string[], finalIsNoGuidance: boolean) => {
        const id = selectedRuleId || uuidv4();
        const rule: GuidanceRule = {
            id,
            questionId: question.id,
            name: ruleName || `${question.label} - ${isCatchAll ? 'All Answers' : directAnswers.join(', ')}`,
            type: 'direct',
            conditions: isCatchAll ? [{ type: 'question', questionId: question.id }] : directAnswers.map(ans => ({ type: 'question', questionId: question.id, answer: ans })),
            assignments: { taskIds: finalTasks, tipIds: finalTips, noGuidanceRequired: finalIsNoGuidance }
        };
        onSave(rule);
        setSelectedRuleId(null);
        resetForm();
    }
    
    const handleSaveDirectRule = () => {
        if (!isCatchAll && directAnswers.length === 0 && !isNoGuidanceDirect) {
            toast({ title: "No answers selected", description: "Please select at least one answer to map or check 'Apply to all'.", variant: "destructive" });
            return;
        }

        const otherRules = existingRules.filter(r => r.id !== selectedRuleId);
        
        // --- CHECK FOR CONFLICTS ---
        // 1. Check if trying to create a catch-all when one already exists.
        if (isCatchAll) {
            if (otherRules.some(r => r.conditions.some(c => c.answer === undefined))) {
                toast({ title: "Mapping Conflict", description: "A 'catch-all' rule already exists for this question.", variant: "destructive" });
                return;
            }
        } else {
        // 2. Check if a specific answer is already mapped in another rule.
            const conflict = directAnswers.find(ans => mappedAnswersInOtherRules.has(ans));
            if (conflict) {
                toast({ title: "Mapping Conflict", description: `The answer "${conflict}" is already mapped in another rule.`, variant: "destructive" });
                return;
            }
        }

        // 3. Check if any selected answer is already covered by a catch-all rule
        const catchAllRule = otherRules.find(r => r.conditions.some(c => c.answer === undefined));
        if (catchAllRule && !isCatchAll && directAnswers.length > 0) {
            setConflictingRule(catchAllRule);
            setIsMergeDialogOpen(true);
            return;
        }
        
        // --- If no conflicts, save directly ---
        finishSave(directTasks, directTips, isNoGuidanceDirect);
    }
    
    const handleMergeDecision = (decision: 'merge' | 'replace') => {
        if (!conflictingRule) return;

        let finalTasks = directTasks;
        let finalTips = directTips;

        if (decision === 'merge') {
            const baseTasks = conflictingRule.assignments?.taskIds || [];
            const baseTips = conflictingRule.assignments?.tipIds || [];
            finalTasks = [...new Set([...baseTasks, ...directTasks])];
            finalTips = [...new Set([...baseTips, ...directTips])];
        }
        
        finishSave(finalTasks, finalTips, isNoGuidanceDirect);
        setIsMergeDialogOpen(false);
        setConflictingRule(null);
    }
    
    const handleSaveCalculatedRule = () => {
        if (!ruleName) {
            toast({ title: 'Rule Name Required', variant: 'destructive' });
            return;
        }
        if (calculationType === 'tenure' && (!startDateQuestion || !endDateQuestion)) {
            toast({ title: 'Date Questions Required', description: 'Please select both a start and end date question for tenure calculation.', variant: "destructive" });
            return;
        }

        const id = selectedRuleId || uuidv4();
        const rule: GuidanceRule = {
            id,
            questionId: question.id,
            name: ruleName,
            type: 'calculated',
            conditions: [], // Conditions are implicit in the calculation
            calculation: {
                type: calculationType,
                unit: calculationUnit,
                startDateQuestionId: calculationType === 'tenure' ? startDateQuestion : undefined,
                endDateQuestionId: calculationType === 'tenure' ? endDateQuestion : undefined,
            },
            ranges: ranges.map(r => ({
                from: r.from,
                to: r.to,
                assignments: { taskIds: r.tasks, tipIds: r.tips, noGuidanceRequired: r.noGuidanceRequired || false }
            })),
            assignments: { taskIds: [], tipIds: [] } // Base assignments not used for calculated rules
        };
        onSave(rule);
        setSelectedRuleId(null);
        resetForm();
    };

    const handleUpdateRange = (index: number, field: keyof typeof ranges[0], value: any) => {
        const newRanges = [...ranges];
        (newRanges[index] as any)[field] = value;
        setRanges(newRanges);
    };

    const handleAddRange = () => {
        const lastRange = ranges[ranges.length - 1];
        const newFrom = lastRange ? lastRange.to : 0;
        setRanges([...ranges, { from: newFrom, to: newFrom + (calculationUnit === 'years' ? 5 : 30), tasks: [], tips: [] }]);
    };
    
    const handleRemoveRange = (index: number) => {
        const newRanges = ranges.filter((_, i) => i !== index);
        setRanges(newRanges);
    };

    const handleDelete = () => {
        if (selectedRuleId) {
            onDelete(selectedRuleId);
            setSelectedRuleId(null);
            resetForm();
        }
    };

    return (
        <div>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="col-span-1 space-y-2">
                         <Label>Existing Rules</Label>
                        <ScrollArea className="h-96">
                            <div className="space-y-1 pr-2">
                                {existingRules.map(rule => (
                                    <TooltipProvider key={rule.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant={selectedRuleId === rule.id ? 'secondary' : 'ghost'} className="w-full justify-start text-left h-auto py-1" onClick={() => setSelectedRuleId(rule.id)}>
                                                    <span className="truncate">{rule.name}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" align="start">
                                                <p className="max-w-xs">{rule.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button variant="outline" className="w-full" onClick={() => setSelectedRuleId(null)}><PlusCircle className="mr-2"/> New Rule</Button>
                    </div>
                    <div className="col-span-3 border-l pl-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{selectedRuleId ? 'Edit Rule' : 'Create New Rule'}</h3>
                             {selectedRuleId && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2" /> Delete Rule</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the rule "{ruleName}". This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>Yes, Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        
                        <div>
                            <Label>Rule Type</Label>
                            <Select value={ruleType} onValueChange={(v) => setRuleType(v as 'direct' | 'calculated')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="direct"><LinkIcon className="mr-2" />Direct Answer Mapping</SelectItem>
                                    <SelectItem value="calculated"><BrainCircuit className="mr-2" />Calculated Value (Range-based)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {ruleType === 'direct' && (
                             <div className="space-y-4 p-4 border rounded-md mt-4">
                                {mappedAnswersInOtherRules.size > 0 && (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <p className="text-xs">
                                            {mappedAnswersInOtherRules.size} answer(s) already have guidance in other rules and cannot be selected.
                                        </p>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Answers to Map</Label>
                                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setDirectAnswers(question.options?.filter(o => !mappedAnswersInOtherRules.has(o)) || [])} disabled={isCatchAll}>Select All Available</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Select one or more answers to apply the same guidance to.</p>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="catch-all" checked={isCatchAll} onCheckedChange={(c) => setIsCatchAll(!!c)} />
                                        <Label htmlFor="catch-all">Apply this rule to all answers for this question</Label>
                                    </div>
                                    <ScrollArea className="h-40">
                                        <fieldset disabled={isCatchAll}>
                                            <div className="grid grid-cols-2 gap-2 p-4 border rounded-md">
                                                {question.options?.map(option => {
                                                    const isSelected = directAnswers.includes(option);
                                                    const isMappedInAnotherRule = mappedAnswersInOtherRules.has(option);
                                                    const isCoveredByCatchAll = !!catchAllRuleForQuestion && !isMappedInAnotherRule && !directAnswers.includes(option);
                                                    return (
                                                        <div 
                                                            key={option} 
                                                            className={cn(
                                                                "flex items-center space-x-2 p-2 rounded-md border", 
                                                                isMappedInAnotherRule && "text-muted-foreground bg-muted/50 cursor-not-allowed",
                                                                isSelected && "bg-primary/10 border-primary"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                id={`answer-${option}`}
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => {
                                                                    setDirectAnswers(prev => checked ? [...prev, option] : prev.filter(a => a !== option));
                                                                }}
                                                                disabled={isMappedInAnotherRule}
                                                            />
                                                            <Label htmlFor={`answer-${option}`} className={cn("font-normal flex-1", isMappedInAnotherRule && "line-through")}>{option}</Label>
                                                            {isCoveredByCatchAll && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>This answer is covered by the rule:<br/>"{catchAllRuleForQuestion.name}"</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </fieldset>
                                    </ScrollArea>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id="no-guidance-direct" checked={isNoGuidanceDirect} onCheckedChange={(c) => setIsNoGuidanceDirect(!!c)} />
                                    <Label htmlFor="no-guidance-direct">No guidance required for these answers</Label>
                                </div>
                                <fieldset disabled={isNoGuidanceDirect} className="grid grid-cols-2 gap-4">
                                     <MultiSelectPopover
                                        label="Tasks to Assign"
                                        items={(masterTasks || []).map(t => ({id: t.id, name: t.name, category: t.category}))}
                                        selectedIds={directTasks}
                                        onSelectionChange={setDirectTasks}
                                        onAddNew={onAddNewTask}
                                        categories={taskCategories}
                                    />
                                    <MultiSelectPopover
                                        label="Tips to Show"
                                        items={(masterTips || []).map(t => ({id: t.id, name: t.text, category: t.category}))}
                                        selectedIds={directTips}
                                        onSelectionChange={setDirectTips}
                                        onAddNew={onAddNewTip}
                                        categories={tipCategories}
                                    />
                                </fieldset>
                                <div className="space-y-2">
                                    <Label htmlFor="rule-name">Rule Name</Label>
                                    <Input id="rule-name" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g., Tenure-based COBRA advice" />
                                </div>
                                <Button onClick={handleSaveDirectRule}>Save Direct Rule</Button>
                            </div>
                        )}
                        
                        {ruleType === 'calculated' && (
                            <div className="space-y-4 p-4 border rounded-md mt-4">
                                <div className="space-y-2 mb-4">
                                    <Label htmlFor="rule-name">Rule Name</Label>
                                    <Input id="rule-name" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g., Tenure-based COBRA advice" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Calculation Type</Label>
                                        <Select value={calculationType} onValueChange={(v) => setCalculationType(v as Calculation['type'])}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tenure">Tenure (End Date - Start Date)</SelectItem>
                                                <SelectItem value="age">Age (Today - {question.label})</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unit</Label>
                                        <Select value={calculationUnit} onValueChange={(v) => setCalculationUnit(v as 'years' | 'days')}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="years">Years</SelectItem>
                                                <SelectItem value="days">Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {calculationType === 'tenure' && (
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Date Question</Label>
                                            <Select value={startDateQuestion} onValueChange={setStartDateQuestion}>
                                                <SelectTrigger><SelectValue placeholder="Select Start Date..." /></SelectTrigger>
                                                <SelectContent>
                                                    {dateQuestions.map(q => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>End Date Question</Label>
                                            <Select value={endDateQuestion} onValueChange={setEndDateQuestion}>
                                                <SelectTrigger><SelectValue placeholder="Select End Date..." /></SelectTrigger>
                                                <SelectContent>
                                                     {dateQuestions.map(q => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                     </div>
                                )}
                                <Separator />
                                <Label>Ranges</Label>
                                <ScrollArea className="h-64">
                                <div className="space-y-4 pr-4">
                                    {ranges.map((range, index) => (
                                        <Card key={index} className="p-4 bg-muted/50">
                                            <div className="flex items-start gap-4">
                                                <div className="grid grid-cols-2 gap-2 flex-grow">
                                                    <div className="space-y-1">
                                                        <Label>From ({calculationUnit})</Label>
                                                        <Input type="number" value={range.from} onChange={e => handleUpdateRange(index, 'from', Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>To ({calculationUnit})</Label>
                                                        <Input type="number" value={range.to} onChange={e => handleUpdateRange(index, 'to', Number(e.target.value))} />
                                                    </div>
                                                    <fieldset disabled={range.noGuidanceRequired} className="col-span-2 grid grid-cols-2 gap-2">
                                                         <MultiSelectPopover
                                                            label="Tasks to Assign"
                                                            items={(masterTasks || []).map(t => ({id: t.id, name: t.name, category: t.category}))}
                                                            selectedIds={range.tasks}
                                                            onSelectionChange={(newIds) => handleUpdateRange(index, 'tasks', newIds)}
                                                            onAddNew={() => onAddNewTask()}
                                                            categories={taskCategories}
                                                        />
                                                         <MultiSelectPopover
                                                            label="Tips to Show"
                                                            items={(masterTips || []).map(t => ({id: t.id, name: t.text, category: t.category}))}
                                                            selectedIds={range.tips}
                                                            onSelectionChange={(newIds) => handleUpdateRange(index, 'tips', newIds)}
                                                            onAddNew={() => onAddNewTip()}
                                                            categories={tipCategories}
                                                        />
                                                    </fieldset>
                                                    <div className="flex items-center space-x-2 col-span-2">
                                                        <Checkbox id={`no-guidance-range-${index}`} checked={range.noGuidanceRequired} onCheckedChange={(c) => handleUpdateRange(index, 'noGuidanceRequired', !!c)} />
                                                        <Label htmlFor={`no-guidance-range-${index}`}>No guidance required for this range</Label>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => handleRemoveRange(index)}><Trash2/></Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                </ScrollArea>
                                <div className="flex justify-between items-center mt-4">
                                    <Button variant="outline" size="sm" onClick={handleAddRange}><PlusCircle className="mr-2" /> Add Range</Button>
                                    <Button onClick={handleSaveCalculatedRule}>Save Calculated Rule</Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </CardContent>
            
             <AlertDialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Guidance Conflict Detected</AlertDialogTitle>
                        <AlertDialogDescription>
                            The answer(s) you selected are already covered by a general "Apply to all answers" rule.
                            How would you like to handle the tasks and tips for this new, more specific rule?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction variant="secondary" onClick={() => handleMergeDecision('replace')}>Replace</AlertDialogAction>
                        <AlertDialogAction onClick={() => handleMergeDecision('merge')}>Merge</AlertDialogAction>
                        <AlertDialogCancel onClick={() => setConflictingRule(null)}>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
