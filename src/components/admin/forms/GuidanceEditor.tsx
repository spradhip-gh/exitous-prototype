

'use client';
import { useState, useMemo } from "react";
import { useUserData, Question, buildQuestionTreeFromMap, MasterTask, MasterTip } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { PlusCircle, ChevronsUpDown } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import TaskForm from "../tasks/TaskForm";
import TipForm from "../tips/TipForm";

function ManageGuidanceDialog({ isOpen, onOpenChange, question, onSaveMappings, allTasks, allTips, onAddNewTask, onAddNewTip }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    question: Question | null;
    onSaveMappings: (questionId: string, answerValue: string, taskIds: string[], tipIds: string[], noGuidance: boolean) => void;
    allTasks: MasterTask[];
    allTips: MasterTip[];
    onAddNewTask: (answer: string) => void;
    onAddNewTip: (answer: string) => void;
}) {
    const { taskMappings, tipMappings } = useUserData();

    const getSelectedTasks = (answer: string) => {
        return taskMappings.filter(m => m.questionId === question?.id && m.answerValue === answer).map(m => m.taskId);
    };
    
    const getSelectedTips = (answer: string) => {
        return tipMappings.filter(m => m.questionId === question?.id && m.answerValue === answer).map(m => m.tipId);
    };

    const getIsNoGuidance = (answer: string) => {
        // "No guidance" is true if it's explicitly set, or if there are no task/tip mappings for this answer.
        // We'll use a special marker in the task mapping array. A mapping to a taskId of 'none' will indicate this.
        return taskMappings.some(m => m.questionId === question?.id && m.answerValue === answer && m.taskId === 'no-guidance');
    };

    const handleTaskToggle = (answer: string, taskId: string) => {
        const currentTasks = getSelectedTasks(answer);
        const currentTips = getSelectedTips(answer);
        const newTasks = currentTasks.includes(taskId) ? currentTasks.filter(id => id !== taskId) : [...currentTasks, taskId];
        onSaveMappings(question!.id, answer, newTasks, currentTips, false);
    };

    const handleTipToggle = (answer: string, tipId: string) => {
        const currentTasks = getSelectedTasks(answer);
        const currentTips = getSelectedTips(answer);
        const newTips = currentTips.includes(tipId) ? currentTips.filter(id => id !== tipId) : [...currentTips, tipId];
        onSaveMappings(question!.id, answer, currentTasks, newTips, false);
    };

    const handleNoGuidanceToggle = (answer: string, noGuidance: boolean) => {
        onSaveMappings(question!.id, answer, [], [], noGuidance);
    };

    const handleAllNoGuidance = (noGuidance: boolean) => {
        if (!question?.options) return;
        question.options.forEach(option => {
             onSaveMappings(question!.id, option, [], [], noGuidance);
        });
    };

    const areAllMarkedNoGuidance = useMemo(() => {
        if (!question?.options) return false;
        return question.options.every(opt => getIsNoGuidance(opt));
    }, [question, taskMappings]);
    
    if (!question) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Manage Guidance for "{question.label}"</DialogTitle>
                    <DialogDescription>Map tasks and tips to each possible answer for this question.</DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                            id={`all-no-guidance-${question.id}`}
                            checked={areAllMarkedNoGuidance}
                            onCheckedChange={(checked) => handleAllNoGuidance(!!checked)}
                        />
                        <Label htmlFor={`all-no-guidance-${question.id}`} className="font-semibold">Mark all answers as "No guidance required"</Label>
                    </div>
                </div>

                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    {question.options?.map(option => {
                        const noGuidance = getIsNoGuidance(option);
                        return (
                            <Card key={option} className={noGuidance ? "bg-muted/50" : ""}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Answer: "{option}"</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <fieldset disabled={noGuidance} className="col-span-2 grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tasks to Assign</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        <span>{getSelectedTasks(option).length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-64">
                                                    {allTasks.map(task => (
                                                        <DropdownMenuCheckboxItem
                                                            key={task.id}
                                                            checked={getSelectedTasks(option).includes(task.id)}
                                                            onCheckedChange={() => handleTaskToggle(option, task.id)}
                                                        >
                                                            {task.name}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => onAddNewTask(option)}>
                                                        <PlusCircle className="mr-2" />
                                                        Create new task...
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tips to Show</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        <span>{getSelectedTips(option).length} selected</span> <ChevronsUpDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                 <DropdownMenuContent className="w-64">
                                                    {allTips.map(tip => (
                                                        <TooltipProvider key={tip.id} delayDuration={100}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <DropdownMenuCheckboxItem
                                                                        checked={getSelectedTips(option).includes(tip.id)}
                                                                        onCheckedChange={() => handleTipToggle(option, tip.id)}
                                                                    >
                                                                        <span className="truncate">{tip.text}</span>
                                                                    </DropdownMenuCheckboxItem>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs">
                                                                    <p>{tip.text}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => onAddNewTip(option)}>
                                                        <PlusCircle className="mr-2" />
                                                        Create new tip...
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </fieldset>
                                </CardContent>
                                <DialogFooter className="p-4 pt-0">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`no-guidance-${question.id}-${option}`}
                                            checked={noGuidance}
                                            onCheckedChange={(checked) => handleNoGuidanceToggle(option, !!checked)}
                                        />
                                        <Label htmlFor={`no-guidance-${question.id}-${option}`} className="text-sm font-normal text-muted-foreground">No guidance required for this answer</Label>
                                    </div>
                                </DialogFooter>
                            </Card>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function GuidanceEditor({ questions }: {
    questions: Question[];
}) {
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);
    
    const { taskMappings, tipMappings, masterTasks, masterTips, saveTaskMappings, saveTipMappings, saveMasterTasks, saveMasterTips } = useUserData();
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isTipFormOpen, setIsTipFormOpen] = useState(false);
    const [preselectedAnswer, setPreselectedAnswer] = useState<string | null>(null);

    const handleManageGuidance = (question: Question) => {
        setSelectedQuestion(question);
        setIsGuidanceDialogOpen(true);
    };

    const handleSaveMappings = (questionId: string, answerValue: string, taskIds: string[], tipIds: string[], noGuidance: boolean) => {
        // Handle tasks
        let finalTaskIds = taskIds;
        if (noGuidance) {
            finalTaskIds = ['no-guidance']; // Use a special marker
        }

        const otherTaskMappings = taskMappings.filter(m => !(m.questionId === questionId && m.answerValue === answerValue));
        const newTaskMappings = finalTaskIds.map(taskId => ({ id: `${questionId}-${answerValue}-${taskId}`, questionId, answerValue, taskId }));
        saveTaskMappings([...otherTaskMappings, ...newTaskMappings]);

        // Handle tips
        const otherTipMappings = tipMappings.filter(m => !(m.questionId === questionId && m.answerValue === answerValue));
        const newTipMappings = tipIds.map(tipId => ({ id: `${questionId}-${answerValue}-${tipId}`, questionId, answerValue, tipId }));
        saveTipMappings([...otherTipMappings, ...newTipMappings]);
    };
    
    const handleAddNewTask = (answer: string) => {
        setPreselectedAnswer(answer);
        setIsTaskFormOpen(true);
    };

    const handleAddNewTip = (answer: string) => {
        setPreselectedAnswer(answer);
        setIsTipFormOpen(true);
    };

    const handleSaveNewTask = (task: MasterTask) => {
        saveMasterTasks([...masterTasks, task]);
        if (preselectedAnswer && selectedQuestion) {
            handleTaskToggle(selectedQuestion, preselectedAnswer, task.id);
        }
        setIsTaskFormOpen(false);
    };
    
    const handleSaveNewTip = (tip: MasterTip) => {
        saveMasterTips([...masterTips, tip]);
        if (preselectedAnswer && selectedQuestion) {
            handleTipToggle(selectedQuestion, preselectedAnswer, tip.id);
        }
        setIsTipFormOpen(false);
    };

    const handleTaskToggle = (question: Question, answer: string, taskId: string) => {
        const currentTasks = taskMappings.filter(m => m.questionId === question.id && m.answerValue === answer).map(m => m.taskId);
        const currentTips = tipMappings.filter(m => m.questionId === question.id && m.answerValue === answer).map(m => m.tipId);
        const newTasks = currentTasks.includes(taskId) ? currentTasks.filter(id => id !== taskId) : [...currentTasks, taskId];
        handleSaveMappings(question.id, answer, newTasks, currentTips, false);
    };

    const handleTipToggle = (question: Question, answer: string, tipId: string) => {
        const currentTasks = taskMappings.filter(m => m.questionId === question.id && m.answerValue === answer).map(m => m.taskId);
        const currentTips = tipMappings.filter(m => m.questionId === question.id && m.answerValue === answer).map(m => m.tipId);
        const newTips = currentTips.includes(tipId) ? currentTips.filter(id => id !== tipId) : [...currentTips, tipId];
        handleSaveMappings(question.id, answer, currentTasks, newTips, false);
    };

    const mappingCounts = useMemo(() => {
        const counts: Record<string, { mapped: number, total: number }> = {};
        questions.forEach(q => {
            if (q.options && q.options.length > 0) {
                let mappedAnswers = 0;
                q.options.forEach(opt => {
                    const hasTask = taskMappings.some(tm => tm.questionId === q.id && tm.answerValue === opt);
                    const hasTip = tipMappings.some(tm => tm.questionId === q.id && tm.answerValue === opt);
                    if (hasTask || hasTip) {
                        mappedAnswers++;
                    }
                });
                counts[q.id] = { mapped: mappedAnswers, total: q.options.length };
            }
        });
        return counts;
    }, [questions, taskMappings, tipMappings]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Guidance Editor</CardTitle>
                    <CardDescription>
                        Manage universal guidance rules. These rules determine which tasks and tips are shown to users based on their answers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {questions.filter(q => q.options && q.options.length > 0).map(q => {
                        const count = mappingCounts[q.id];
                        return (
                            <div key={q.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <span>{q.label}</span>
                                <div className="flex items-center gap-2">
                                    {count && <span className="text-xs text-muted-foreground">{count.mapped} of {count.total} mapped</span>}
                                    <Button variant="outline" size="sm" onClick={() => handleManageGuidance(q)}>Manage Guidance</Button>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
            
            <ManageGuidanceDialog 
                isOpen={isGuidanceDialogOpen}
                onOpenChange={setIsGuidanceDialogOpen}
                question={selectedQuestion}
                onSaveMappings={handleSaveMappings}
                allTasks={masterTasks}
                allTips={masterTips}
                onAddNewTask={handleAddNewTask}
                onAddNewTip={handleAddNewTip}
            />

            <TaskForm 
                isOpen={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen}
                onSave={handleSaveNewTask}
                task={null}
                allResources={[]}
            />
             <TipForm 
                isOpen={isTipFormOpen}
                onOpenChange={setIsTipFormOpen}
                onSave={handleSaveNewTip}
                tip={null}
            />
        </>
    );
}
