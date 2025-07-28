
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUserData, Question, MasterTask, MasterTip, GuidanceRule, Condition } from "@/hooks/use-user-data";
import { tenureOptions } from '@/lib/guidance-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ChevronsUpDown, Wand2, LinkIcon, BrainCircuit } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

type RuleType = 'direct' | 'calculated';
type CalculationType = 'age' | 'tenure';
type Range = { from: number; to: number; tasks: string[]; tips: string[] };

export default function GuidanceRuleForm({ question, allQuestions, existingRules, onSave, onDelete, masterTasks, masterTips }: {
    question: Question | null;
    allQuestions: Question[];
    existingRules: GuidanceRule[];
    onSave: (rule: GuidanceRule) => void;
    onDelete: (ruleId: string) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
}) {
    const { toast } = useToast();
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [ruleType, setRuleType] = useState<RuleType>('direct');
    
    // Direct mapping state
    const [directAnswers, setDirectAnswers] = useState<string[]>([]);
    const [directTasks, setDirectTasks] = useState<string[]>([]);
    const [directTips, setDirectTips] = useState<string[]>([]);
    
    // Calculated mapping state
    const [calculationType, setCalculationType] = useState<CalculationType>('tenure');
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
        setCalculationType('tenure');
        setStartDateQuestion('');
        setEndDateQuestion('');
        setRanges([{ from: 0, to: 5, tasks:[], tips:[] }]);
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
                } else if (rule.type === 'calculated') {
                    setCalculationType(rule.calculation?.type || 'tenure');
                    if(rule.calculation?.type === 'tenure') {
                        setStartDateQuestion(rule.calculation.startDateQuestionId || '');
                        setEndDateQuestion(rule.calculation.endDateQuestionId || '');
                    }
                    setRanges(rule.ranges?.map(r => ({ from: r.from, to: r.to, tasks: r.assignments.taskIds, tips: r.assignments.tipIds })) || [{ from: 0, to: 5, tasks:[], tips:[] }])
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
            assignments: { taskIds: directTasks, tipIds: directTips }
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
                startDateQuestionId: calculationType === 'tenure' ? startDateQuestion : undefined,
                endDateQuestionId: calculationType === 'tenure' ? endDateQuestion : undefined,
            },
            ranges: ranges.map(r => ({
                from: r.from,
                to: r.to,
                assignments: { taskIds: r.tasks, tipIds: r.tips }
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
        setRanges([...ranges, { from: newFrom, to: newFrom + 5, tasks: [], tips: [] }]);
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
                        <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                            {existingRules.map(rule => (
                                <Button key={rule.id} variant={selectedRuleId === rule.id ? 'secondary' : 'ghost'} className="w-full justify-start text-left h-auto py-1" onClick={() => setSelectedRuleId(rule.id)}>
                                    {rule.name}
                                </Button>
                            ))}
                        </div>
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
                                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-md max-h-40 overflow-y-auto">
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
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tasks to Assign</Label>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    <span>{directTasks.length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64">
                                                {masterTasks.map(task => (
                                                    <DropdownMenuCheckboxItem
                                                        key={task.id}
                                                        checked={directTasks.includes(task.id)}
                                                        onCheckedChange={() => setDirectTasks(prev => prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id])}
                                                    >
                                                        {task.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tips to Show</Label>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    <span>{directTips.length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64">
                                                {masterTips.map(tip => (
                                                    <DropdownMenuCheckboxItem
                                                        key={tip.id}
                                                        checked={directTips.includes(tip.id)}
                                                        onCheckedChange={() => setDirectTips(prev => prev.includes(tip.id) ? prev.filter(id => id !== tip.id) : [...prev, tip.id])}
                                                    >
                                                        {tip.text}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <Button onClick={handleSaveDirectRule}>Save Direct Rule</Button>
                            </div>
                        )}
                        
                        {ruleType === 'calculated' && (
                            <div className="space-y-4 p-4 border rounded-md">
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
                                <Label>Ranges (in years)</Label>
                                <div className="space-y-4">
                                    {ranges.map((range, index) => (
                                        <Card key={index} className="p-4 bg-muted/50">
                                            <div className="flex items-end gap-4">
                                                <div className="grid grid-cols-2 gap-2 flex-grow">
                                                    <div className="space-y-1">
                                                        <Label>From</Label>
                                                        <Input type="number" value={range.from} onChange={e => handleUpdateRange(index, 'from', Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>To</Label>
                                                        <Input type="number" value={range.to} onChange={e => handleUpdateRange(index, 'to', Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Tasks</Label>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between"><span>{range.tasks.length} selected</span><ChevronsUpDown/></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent><DropdownMenuCheckboxItem onSelect={e => e.preventDefault()}>...</DropdownMenuCheckboxItem></DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Tips</Label>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between"><span>{range.tips.length} selected</span><ChevronsUpDown/></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent><DropdownMenuCheckboxItem onSelect={e => e.preventDefault()}>...</DropdownMenuCheckboxItem></DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveRange(index)}><Trash2/></Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center">
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

    