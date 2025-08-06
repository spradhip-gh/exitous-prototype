

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
import { Separator } from "@/components/ui/separator";

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
    const { getMasterQuestionConfig } = useUserData();
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

    const { profileSections, assessmentSections } = useMemo(() => {
        const profileMap: Record<string, Question[]> = {};
        const assessmentMap: Record<string, Question[]> = {};

        questions.forEach(q => {
            if (!q.options && q.type !== 'date' && q.id !== 'birthYear') return;

            const target = q.formType === 'profile' ? profileMap : assessmentMap;
            if (!q.section) return;
            if (!target[q.section]) {
                target[q.section] = [];
            }
            target[q.section].push(q);
        });
        
        const profileOrder = getMasterQuestionConfig('profile')?.section_order || Object.keys(profileMap);
        const assessmentOrder = getMasterQuestionConfig('assessment')?.section_order || Object.keys(assessmentMap);

        const sortedProfile = profileOrder.map(sectionName => ({ sectionName, questions: profileMap[sectionName] })).filter(s => s.questions);
        const sortedAssessment = assessmentOrder.map(sectionName => ({ sectionName, questions: assessmentMap[sectionName] })).filter(s => s.questions);

        return { profileSections: sortedProfile, assessmentSections: sortedAssessment };
    }, [questions, getMasterQuestionConfig]);
    
    const mappingCounts = useMemo(() => {
        const counts: Record<string, { mapped: number, total: number }> = {};
        questions.forEach(q => {
            if (q.options && q.options.length > 0) {
                const rulesForQuestion = guidanceRules.filter(rule => rule.questionId === q.id && rule.type === 'direct');
                const catchAllRule = rulesForQuestion.find(rule => rule.conditions.some(c => c.answer === undefined));
                
                if (catchAllRule) {
                    // If a catch-all exists, all options are considered mapped.
                    counts[q.id] = { mapped: q.options.length, total: q.options.length };
                } else {
                    const mappedAnswers = new Set<string>();
                    rulesForQuestion.forEach(rule => {
                        rule.conditions.forEach(c => {
                            if (c.answer) {
                                mappedAnswers.add(c.answer);
                            }
                        });
                    });
                    counts[q.id] = { mapped: mappedAnswers.size, total: q.options.length };
                }
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

    const renderSection = (title: string, sections: { sectionName: string; questions: Question[] }[]) => (
         <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold tracking-tight">{title}</h2>
             {sections.map(({ sectionName, questions }) => (
                <div key={sectionName}>
                    <h3 className="font-semibold text-lg">{sectionName}</h3>
                    <div className="pl-2 space-y-2 py-2">
                        {questions.map(q => {
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
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Guidance Editor</CardTitle>
                    <CardDescription>
                        Manage universal guidance rules. These rules determine which tasks and tips are shown to users based on their answers or calculated values like age and tenure.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                   {renderSection("Profile Form", profileSections)}
                   <Separator />
                   {renderSection("Assessment Form", assessmentSections)}
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
                masterTasks={masterTasks}
            />

             <TipForm 
                isOpen={isTipFormOpen}
                onOpenChange={(open) => {
                    setIsTipFormOpen(open);
                    if (!open) setIsRuleFormOpen(true); // Re-open rule form if tip form is cancelled
                }}
                onSave={handleSaveNewTip}
                tip={null}
                masterTips={masterTips}
            />
        </>
    );
}
