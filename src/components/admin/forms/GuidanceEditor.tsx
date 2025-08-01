

'use client';
import { useState, useMemo, useCallback } from "react";
import { useUserData, Question, MasterTask, MasterTip, GuidanceRule, ExternalResource } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import GuidanceRuleForm from "./GuidanceRuleForm";
import TaskForm from '../tasks/TaskForm';
import TipForm from '../tips/TipForm';

export default function GuidanceEditor({ questions, guidanceRules, saveGuidanceRules, masterTasks, masterTips, externalResources, saveMasterTasks, saveMasterTips }: {
    questions: Question[];
    guidanceRules: GuidanceRule[];
    saveGuidanceRules: (rules: GuidanceRule[]) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
    externalResources: ExternalResource[];
    saveMasterTasks: (tasks: MasterTask[]) => void;
    saveMasterTips: (tips: MasterTip[]) => void;
}) {
    const { toast } = useToast();
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isTipFormOpen, setIsTipFormOpen] = useState(false);

    // State to manage passing a newly created item back to the rule form
    const [pendingItemForGuidance, setPendingItemForGuidance] = useState<{ type: 'task' | 'tip'; item: MasterTask | MasterTip } | null>(null);


    const handleManageGuidance = (question: Question) => {
        setSelectedQuestion(question);
        setIsRuleFormOpen(true);
    };

    const handleSaveRule = (newRule: GuidanceRule) => {
        let newRules;
        const existingRuleIndex = guidanceRules.findIndex(r => r.id === newRule.id);
        if (existingRuleIndex > -1) {
            newRules = [...guidanceRules];
            newRules[existingRuleIndex] = newRule;
        } else {
            newRules = [...guidanceRules, newRule];
        }
        saveGuidanceRules(newRules);
        toast({ title: "Guidance Rule Saved" });
    };

    const handleDeleteRule = (ruleId: string) => {
        const newRules = guidanceRules.filter(r => r.id !== ruleId);
        saveGuidanceRules(newRules);
        toast({ title: "Guidance Rule Deleted" });
    };

    const mappingCounts = useMemo(() => {
        const counts: Record<string, { mapped: number, total: number }> = {};
        questions.forEach(q => {
            if (q.options && q.options.length > 0) {
                const mappedAnswers = new Set<string>();
                guidanceRules.forEach(rule => {
                    const isRelevantDirectRule = rule.type === 'direct' && rule.questionId === q.id;
                    if (isRelevantDirectRule) {
                        rule.conditions.forEach(c => {
                            if (c.answer) {
                                mappedAnswers.add(c.answer);
                            }
                        });
                    }
                });
                counts[q.id] = { mapped: mappedAnswers.size, total: q.options.length };
            }
        });
        return counts;
    }, [questions, guidanceRules]);

    const handleAddNewTask = useCallback(() => {
        setIsRuleFormOpen(false); // Close the rule form
        setIsTaskFormOpen(true);   // Open the task form
    }, []);

    const handleAddNewTip = useCallback(() => {
        setIsRuleFormOpen(false); // Close the rule form
        setIsTipFormOpen(true);    // Open the tip form
    }, []);
    
    const handleSaveNewTask = (taskData: MasterTask) => {
        const newTasks = [...masterTasks, taskData];
        saveMasterTasks(newTasks);
        toast({ title: 'Task Added', description: `Task "${taskData.name}" has been added.` });
        setPendingItemForGuidance({ type: 'task', item: taskData });
        setIsTaskFormOpen(false);
        setIsRuleFormOpen(true); // Re-open the rule form
    };

    const handleSaveNewTip = (tipData: MasterTip) => {
        const newTips = [...masterTips, tipData];
        saveMasterTips(newTips);
        toast({ title: 'Tip Added' });
        setPendingItemForGuidance({ type: 'tip', item: tipData });
        setIsTipFormOpen(false);
        setIsRuleFormOpen(true); // Re-open the rule form
    };
    
    const handleCloseRuleForm = () => {
        setIsRuleFormOpen(false);
        setPendingItemForGuidance(null); // Clear pending item when dialog is manually closed
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Guidance Editor</CardTitle>
                    <CardDescription>
                        Manage universal guidance rules. These rules determine which tasks and tips are shown to users based on their answers or calculated values like age and tenure.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {questions.filter(q => (q.options && q.options.length > 0) || q.type === 'date' || q.id === 'birthYear').map(q => {
                        const count = mappingCounts[q.id];
                        return (
                            <div key={q.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <span>{q.label}</span>
                                <div className="flex items-center gap-2">
                                    {count && <span className="text-xs text-muted-foreground">{count.mapped} of {count.total} answers mapped</span>}
                                    <Button variant="outline" size="sm" onClick={() => handleManageGuidance(q)}>Manage Guidance</Button>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <Dialog open={isRuleFormOpen} onOpenChange={handleCloseRuleForm}>
                <DialogContent className="max-w-4xl">
                     <DialogHeader>
                        <DialogTitle>Manage Guidance for "{selectedQuestion?.label}"</DialogTitle>
                        <DialogDescription>
                            Define rules to assign tasks and tips. Rules can be based on direct answers or calculated values like age or tenure.
                        </DialogDescription>
                    </DialogHeader>
                    <GuidanceRuleForm
                        question={selectedQuestion}
                        allQuestions={questions}
                        existingRules={guidanceRules.filter(r => r.questionId === selectedQuestion?.id)}
                        onSave={handleSaveRule}
                        onDelete={handleDeleteRule}
                        masterTasks={masterTasks}
                        masterTips={masterTips}
                        onAddNewTask={handleAddNewTask}
                        onAddNewTip={handleAddNewTip}
                        allResources={externalResources}
                        pendingItem={pendingItemForGuidance}
                        onPendingItemConsumed={() => setPendingItemForGuidance(null)}
                    />
                </DialogContent>
            </Dialog>
            
            <TaskForm 
                isOpen={isTaskFormOpen}
                onOpenChange={(open) => {
                    setIsTaskFormOpen(open);
                    if (!open) setIsRuleFormOpen(true); // Re-open rule form if task form is cancelled
                }}
                onSave={handleSaveNewTask}
                task={null}
                allResources={externalResources}
            />

             <TipForm 
                isOpen={isTipFormOpen}
                onOpenChange={(open) => {
                    setIsTipFormOpen(open);
                    if (!open) setIsRuleFormOpen(true); // Re-open rule form if tip form is cancelled
                }}
                onSave={handleSaveNewTip}
                tip={null}
            />
        </>
    );
}
