
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUserData, Question, MasterTask, MasterTip, GuidanceRule, Condition, Calculation } from "@/hooks/use-user-data";
import { tenureOptions } from '@/lib/guidance-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ChevronsUpDown, Wand2, LinkIcon, BrainCircuit, Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type RuleType = 'direct' | 'calculated';
type CalculationType = 'age' | 'tenure';
type Range = { from: number; to: number; tasks: string[]; tips: string[], noGuidanceRequired?: boolean };

function MultiSelectPopover({
    label,
    items,
    selectedIds,
    onSelectionChange,
    onAddNew,
}: {
    label: string,
    items: { id: string; name: string }[],
    onSelectionChange: (newIds: string[]) => void,
    onAddNew: () => void,
    selectedIds?: string[],
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const validSelectedIds = selectedIds || [];

    const filteredItems = useMemo(() => {
        if (!search) return items;
        return items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    }, [search, items]);
    
    const handleSelect = (id: string) => {
        const newSelection = validSelectedIds.includes(id)
            ? validSelectedIds.filter(currentId => currentId !== id)
            : [...validSelectedIds, id];
        onSelectionChange(newSelection);
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        <span>{validSelectedIds.length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px]" align="start">
                    <div className="p-2">
                         <Input 
                            placeholder={`Search ${label.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-64">
                         {filteredItems.map(item => (
                            <DropdownMenuCheckboxItem
                                key={item.id}
                                checked={validSelectedIds.includes(item.id)}
                                onCheckedChange={() => handleSelect(item.id)}
                                onSelect={(e) => e.preventDefault()} // Prevents menu from closing
                            >
                                {item.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </ScrollArea>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onSelect={() => {
                        onAddNew();
                        setOpen(false);
                     }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create new {label.toLowerCase().slice(0, -1)}...
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}


export default function GuidanceRuleForm({ question, allQuestions, existingRules, onSave, onDelete, masterTasks, masterTips, onAddNewTask, onAddNewTip, allResources }: {
    question: Question | null;
    allQuestions: Question[];
    existingRules: GuidanceRule[];
    onSave: (rule: GuidanceRule) => void;
    onDelete: (ruleId: string) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
    onAddNewTask: (callback: (newTask: MasterTask) => void) => void;
    onAddNewTip: (callback: (newTip: MasterTip) => void) => void;
    allResources: any[];
}) {
    const { toast } = useToast();
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [ruleType, setRuleType] = useState<RuleType>('direct');
    
    // Direct mapping state
    const [directAnswers, setDirectAnswers] = useState<string[]>([]);
    const [directTasks, setDirectTasks] = useState<string[]>([]);
    const [directTips, setDirectTips] = useState<string[]>([]);
    const [isNoGuidanceDirect, setIsNoGuidanceDirect] = useState(false);
    
    // Calculated mapping state
    const [calculationType, setCalculationType] = useState<CalculationType>('tenure');
    const [calculationUnit, setCalculationUnit] = useState<'years' | 'days'>('years');
    const [startDateQuestion, setStartDateQuestion] = useState<string>('');
    const [endDateQuestion, setEndDateQuestion] = useState<string>('');
    const [ranges, setRanges] = useState<Range[]>([{ from: 0, to: 5, tasks:[], tips:[] }]);
    const [ruleName, setRuleName] = useState('');

    const dateQuestions = useMemo(() => allQuestions.filter(q => q.type === 'date'), [allQuestions]);

    const resetForm = () => {
        setRuleName('');
        setRuleType('direct');
        setDirectAnswers([]);
        setDirectTasks([]);
        setDirectTips([]);
        setIsNoGuidanceDirect(false);
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
                    setDirectAnswers(rule.conditions.map(c => c.answer || ''));
                    setDirectTasks(rule.assignments?.taskIds || []);
                    setDirectTips(rule.assignments?.tipIds || []);
                    setIsNoGuidanceDirect(rule.assignments?.noGuidanceRequired || false);
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
    
    if (!question) return null;

    const handleSaveDirectRule = () => {
        if (directAnswers.length === 0) {
            toast({ title: "No answers selected", description: "Please select at least one answer to map.", variant: "destructive" });
            return;
        }
        const id = selectedRuleId || uuidv4();
        const rule: GuidanceRule = {
            id,
            questionId: question.id,
            name: ruleName || `${question.label} - ${directAnswers.join(', ')}`,
            type: 'direct',
            conditions: directAnswers.map(ans => ({ type: 'question', questionId: question.id, answer: ans })),
            assignments: { taskIds: directTasks, tipIds: directTips, noGuidanceRequired: isNoGuidanceDirect }
        };
        onSave(rule);
        setSelectedRuleId(null);
        resetForm();
    }
    
    const handleSaveCalculatedRule = () => {
        if (!ruleName) {
            toast({ title: 'Rule Name Required', variant: 'destructive' });
            return;
        }
        if (calculationType === 'tenure' && (!startDateQuestion || !endDateQuestion)) {
            toast({ title: 'Date Questions Required', description: 'Please select both a start and end date question for tenure calculation.', variant: 'destructive' });
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

    const handleUpdateRange = (index: number, field: keyof Range, value: any) => {
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

    return (
        <div>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="col-span-1 space-y-2">
                         <Label>Existing Rules</Label>
                        <ScrollArea className="h-96">
                            <div className="space-y-1 pr-2">
                                {existingRules.map(rule => (
                                    <Button key={rule.id} variant={selectedRuleId === rule.id ? 'secondary' : 'ghost'} className="w-full justify-start text-left h-auto py-1" onClick={() => setSelectedRuleId(rule.id)}>
                                        {rule.name}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button variant="outline" className="w-full" onClick={() => setSelectedRuleId(null)}><PlusCircle className="mr-2"/> New Rule</Button>
                    </div>
                    <div className="col-span-3 border-l pl-6">
                        <h3 className="font-semibold text-lg mb-2">{selectedRuleId ? 'Edit Rule' : 'Create New Rule'}</h3>
                        
                        <div className="space-y-2 mb-4">
                            <Label htmlFor="rule-name">Rule Name</Label>
                            <Input id="rule-name" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g., Tenure-based COBRA advice" />
                        </div>
                        
                        <div className="my-4">
                            <Label>Rule Type</Label>
                            <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="direct"><LinkIcon className="mr-2" />Direct Answer Mapping</SelectItem>
                                    <SelectItem value="calculated"><BrainCircuit className="mr-2" />Calculated Value (Range-based)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {ruleType === 'direct' && (
                             <div className="space-y-4 p-4 border rounded-md">
                                <div className="space-y-2">
                                    <Label>Answers to Map</Label>
                                    <p className="text-xs text-muted-foreground">Select one or more answers to apply the same guidance to.</p>
                                    <ScrollArea className="h-40">
                                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-md">
                                            {question.options?.map(option => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`answer-${option}`}
                                                        checked={directAnswers.includes(option)}
                                                        onCheckedChange={(checked) => {
                                                            setDirectAnswers(prev => checked ? [...prev, option] : prev.filter(a => a !== option));
                                                        }}
                                                    />
                                                    <Label htmlFor={`answer-${option}`} className="font-normal">{option}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id="no-guidance-direct" checked={isNoGuidanceDirect} onCheckedChange={(c) => setIsNoGuidanceDirect(!!c)} />
                                    <Label htmlFor="no-guidance-direct">No guidance required for these answers</Label>
                                </div>
                                <fieldset disabled={isNoGuidanceDirect} className="grid grid-cols-2 gap-4">
                                     <MultiSelectPopover
                                        label="Tasks to Assign"
                                        items={masterTasks.map(t => ({id: t.id, name: t.name}))}
                                        selectedIds={directTasks}
                                        onSelectionChange={setDirectTasks}
                                        onAddNew={() => onAddNewTask((newTask) => setDirectTasks(prev => [...prev, newTask.id]))}
                                    />
                                    <MultiSelectPopover
                                        label="Tips to Show"
                                        items={masterTips.map(t => ({id: t.id, name: t.text}))}
                                        selectedIds={directTips}
                                        onSelectionChange={setDirectTips}
                                        onAddNew={() => onAddNewTip((newTip) => setDirectTips(prev => [...prev, newTip.id]))}
                                    />
                                </fieldset>
                                <Button onClick={handleSaveDirectRule}>Save Direct Rule</Button>
                            </div>
                        )}
                        
                        {ruleType === 'calculated' && (
                            <div className="space-y-4 p-4 border rounded-md">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Calculation Type</Label>
                                        <Select value={calculationType} onValueChange={(v) => setCalculationType(v as CalculationType)}>
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
                                                            items={masterTasks.map(t => ({id: t.id, name: t.name}))}
                                                            selectedIds={range.tasks}
                                                            onSelectionChange={(newIds) => handleUpdateRange(index, 'tasks', newIds)}
                                                            onAddNew={() => onAddNewTask((newTask) => handleUpdateRange(index, 'tasks', [...range.tasks, newTask.id]))}
                                                        />
                                                         <MultiSelectPopover
                                                            label="Tips to Show"
                                                            items={masterTips.map(t => ({id: t.id, name: t.text}))}
                                                            selectedIds={range.tips}
                                                            onSelectionChange={(newIds) => handleUpdateRange(index, 'tips', newIds)}
                                                            onAddNew={() => onAddNewTip((newTip) => handleUpdateRange(index, 'tips', [...range.tips, newTip.id]))}
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
        </div>
    )
}
