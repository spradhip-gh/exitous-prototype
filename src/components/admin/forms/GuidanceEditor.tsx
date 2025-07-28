
'use client';
import { useState, useMemo } from "react";
import { useUserData, Question, MasterTask, MasterTip, GuidanceRule } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import GuidanceRuleForm from "./GuidanceRuleForm";

export default function GuidanceEditor({ questions, guidanceRules, saveGuidanceRules, masterTasks, masterTips }: {
    questions: Question[];
    guidanceRules: GuidanceRule[];
    saveGuidanceRules: (rules: GuidanceRule[]) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
}) {
    const { toast } = useToast();
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);

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
    }

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
                    if (rule.questionId === q.id && rule.type === 'direct') {
                        rule.conditions.forEach(c => {
                            if (c.answer) mappedAnswers.add(c.answer);
                        });
                    }
                });
                counts[q.id] = { mapped: mappedAnswers.size, total: q.options.length };
            }
        });
        return counts;
    }, [questions, guidanceRules]);

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

            <Dialog open={isRuleFormOpen} onOpenChange={setIsRuleFormOpen}>
                <DialogContent className="max-w-4xl">
                    <GuidanceRuleForm
                        question={selectedQuestion}
                        allQuestions={questions}
                        existingRules={guidanceRules.filter(r => r.questionId === selectedQuestion?.id)}
                        onSave={handleSaveRule}
                        onDelete={handleDeleteRule}
                        masterTasks={masterTasks}
                        masterTips={masterTips}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
