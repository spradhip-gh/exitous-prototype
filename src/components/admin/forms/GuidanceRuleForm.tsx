

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
import { PlusCircle, Trash2, ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';

type RuleType = 'direct' | 'calculated';
type CalculationType = 'age' | 'tenure';

export default function GuidanceRuleForm({ question, allQuestions, existingRules, onSave, onDelete, masterTasks, masterTips }: {
    question: Question | null;
    allQuestions: Question[];
    existingRules: GuidanceRule[];
    onSave: (rule: GuidanceRule) => void;
    onDelete: (ruleId: string) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
}) {
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [ruleType, setRuleType] = useState<RuleType>('direct');
    
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [selectedTips, setSelectedTips] = useState<string[]>([]);
    
    const [calculationType, setCalculationType] = useState<CalculationType>('tenure');
    const [startDateQuestion, setStartDateQuestion] = useState<string>('');
    const [endDateQuestion, setEndDateQuestion] = useState<string>('');
    const [ranges, setRanges] = useState<{from: number, to: number, tasks: string[], tips: string[]}[]>([{ from: 0, to: 5, tasks:[], tips:[] }]);

    const dateQuestions = useMemo(() => allQuestions.filter(q => q.type === 'date'), [allQuestions]);

    useEffect(() => {
        if (selectedRuleId) {
            const rule = existingRules.find(r => r.id === selectedRuleId);
            if (rule) {
                setRuleType(rule.type);
                if (rule.type === 'direct') {
                    setSelectedAnswers(rule.conditions.map(c => c.answer || ''));
                    setSelectedTasks(rule.assignments.taskIds);
                    setSelectedTips(rule.assignments.tipIds);
                } else if (rule.type === 'calculated') {
                    // Pre-fill calculation form state (to be implemented)
                }
            }
        } else {
            // Reset form when no rule is selected
            setRuleType('direct');
            setSelectedAnswers([]);
            setSelectedTasks([]);
            setSelectedTips([]);
        }
    }, [selectedRuleId, existingRules]);
    
    if (!question) return null;

    const handleSaveDirectRule = () => {
        const id = selectedRuleId || uuidv4();
        const rule: GuidanceRule = {
            id,
            questionId: question.id,
            name: `${question.label} - ${selectedAnswers.join(', ')}`,
            type: 'direct',
            conditions: selectedAnswers.map(ans => ({ type: 'question', questionId: question.id, answer: ans })),
            assignments: { taskIds: selectedTasks, tipIds: selectedTips }
        };
        onSave(rule);
        setSelectedRuleId(null);
    }
    
    return (
        <div>
            <CardHeader>
                <CardTitle>Manage Guidance for "{question.label}"</CardTitle>
                <CardDescription>
                    Define rules to assign tasks and tips. Rules can be based on direct answers or calculated values like age or tenure.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 space-y-2">
                         <Label>Existing Rules</Label>
                        <div className="space-y-1">
                            {existingRules.map(rule => (
                                <Button key={rule.id} variant={selectedRuleId === rule.id ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSelectedRuleId(rule.id)}>
                                    {rule.name}
                                </Button>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setSelectedRuleId(null)}><PlusCircle className="mr-2"/> New Rule</Button>
                    </div>
                    <div className="col-span-3 border-l pl-4">
                        <h3 className="font-semibold text-lg">{selectedRuleId ? 'Edit Rule' : 'Create New Rule'}</h3>
                        
                        <div className="my-4">
                            <Label>Rule Type</Label>
                            <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="direct">Direct Answer Mapping</SelectItem>
                                    <SelectItem value="calculated">Calculated Value (Range-based)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {ruleType === 'direct' && (
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Answers to Map</Label>
                                    <p className="text-xs text-muted-foreground">Select one or more answers to apply the same guidance to.</p>
                                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-md">
                                        {question.options?.map(option => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`answer-${option}`}
                                                    checked={selectedAnswers.includes(option)}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedAnswers(prev => checked ? [...prev, option] : prev.filter(a => a !== option));
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
                                                    <span>{selectedTasks.length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64">
                                                {masterTasks.map(task => (
                                                    <DropdownMenuCheckboxItem
                                                        key={task.id}
                                                        checked={selectedTasks.includes(task.id)}
                                                        onCheckedChange={() => setSelectedTasks(prev => prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id])}
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
                                                    <span>{selectedTips.length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64">
                                                {masterTips.map(tip => (
                                                    <DropdownMenuCheckboxItem
                                                        key={tip.id}
                                                        checked={selectedTips.includes(tip.id)}
                                                        onCheckedChange={() => setSelectedTips(prev => prev.includes(tip.id) ? prev.filter(id => id !== tip.id) : [...prev, tip.id])}
                                                    >
                                                        {tip.text}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <Button onClick={handleSaveDirectRule}>Save Direct Mapping Rule</Button>
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
                                            <SelectItem value="age">Age (Today - Birth Year)</SelectItem>
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
                                <Button>Save Calculated Rule</Button>
                            </div>
                        )}

                    </div>
                </div>
            </CardContent>
        </div>
    )
}
