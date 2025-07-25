

'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserData, Question, buildQuestionTreeFromMap, TaskMapping, MasterTask, TipMapping, MasterTip } from "@/hooks/use-user-data";
import { getDefaultQuestions, getDefaultProfileQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Link, Check, ChevronsUpDown } from "lucide-react";
import AdminQuestionItem from "./AdminQuestionItem";
import EditQuestionDialog from "./EditQuestionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface OrderedSection {
    id: string;
    questions: Question[];
}

function findQuestionById(sections: OrderedSection[], id: string): Question | null {
    for (const section of sections) {
        const queue: Question[] = [...section.questions];
        while (queue.length > 0) {
            const q = queue.shift()!;
            if (q.id === id) return q;
            if (q.subQuestions) queue.push(...q.subQuestions);
        }
    }
    return null;
}

function ManageTaskMappingDialog({
    isOpen,
    onOpenChange,
    question,
    allTasks,
    allTips,
    allTaskMappings,
    allTipMappings,
    saveTaskMappingsFn,
    saveTipMappingsFn
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    question: Question | null;
    allTasks: MasterTask[];
    allTips: MasterTip[];
    allTaskMappings: TaskMapping[];
    allTipMappings: TipMapping[];
    saveTaskMappingsFn: (mappings: TaskMapping[]) => void;
    saveTipMappingsFn: (mappings: TipMapping[]) => void;
}) {
    const [taskMappings, setTaskMappings] = useState<Record<string, Set<string>>>({});
    const [tipMappings, setTipMappings] = useState<Record<string, Set<string>>>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    React.useEffect(() => {
        if (question && isOpen) {
            const initialTaskMappings: Record<string, Set<string>> = {};
            const initialTipMappings: Record<string, Set<string>> = {};

            question.options?.forEach(opt => {
                const tasksForAnswer = allTaskMappings
                    .filter(m => m.questionId === question.id && m.answerValue === opt)
                    .map(m => m.taskId);
                initialTaskMappings[opt] = new Set(tasksForAnswer);

                const tipsForAnswer = allTipMappings
                    .filter(m => m.questionId === question.id && m.answerValue === opt)
                    .map(m => m.tipId);
                initialTipMappings[opt] = new Set(tipsForAnswer);
            });
            setTaskMappings(initialTaskMappings);
            setTipMappings(initialTipMappings);
        } else if (!isOpen) {
            setTaskMappings({});
            setTipMappings({});
            setOpenDropdown(null);
        }
    }, [isOpen, question, allTaskMappings, allTipMappings]);

    const handleTaskToggle = (answer: string, taskId: string) => {
        setTaskMappings(prev => {
            const newMappings = { ...prev };
            const taskSet = new Set(newMappings[answer]);
            if (taskSet.has(taskId)) {
                taskSet.delete(taskId);
            } else {
                taskSet.add(taskId);
            }
            newMappings[answer] = taskSet;
            return newMappings;
        });
    };

    const handleTipToggle = (answer: string, tipId: string) => {
        setTipMappings(prev => {
            const newMappings = { ...prev };
            const tipSet = new Set(newMappings[answer]);
            if (tipSet.has(tipId)) {
                tipSet.delete(tipId);
            } else {
                tipSet.add(tipId);
            }
            newMappings[answer] = tipSet;
            return newMappings;
        });
    };
    
    const handleSave = () => {
        if (!question) return;

        // Remove all old mappings for this question
        const otherTaskMappings = allTaskMappings.filter(m => m.questionId !== question.id);
        const otherTipMappings = allTipMappings.filter(m => m.questionId !== question.id);
        
        // Create new mappings from the state
        const newTaskMappings: TaskMapping[] = [];
        Object.entries(taskMappings).forEach(([answerValue, taskIds]) => {
            taskIds.forEach(taskId => {
                newTaskMappings.push({
                    id: `${question.id}-${answerValue}-${taskId}`, // A simple unique ID
                    questionId: question.id,
                    answerValue,
                    taskId
                });
            });
        });
        saveTaskMappingsFn([...otherTaskMappings, ...newTaskMappings]);

        const newTipMappings: TipMapping[] = [];
        Object.entries(tipMappings).forEach(([answerValue, tipIds]) => {
            tipIds.forEach(tipId => {
                newTipMappings.push({
                    id: `${question.id}-${answerValue}-${tipId}`,
                    questionId: question.id,
                    answerValue,
                    tipId
                });
            });
        });
        saveTipMappingsFn([...otherTipMappings, ...newTipMappings]);

        onOpenChange(false);
    };

    const getButtonLabel = (option: string, type: 'task' | 'tip') => {
        const mappings = type === 'task' ? taskMappings[option] : tipMappings[option];
        const source = type === 'task' ? allTasks : allTips;
        
        if (!mappings || mappings.size === 0) {
            return `Select ${type}s...`;
        }
        
        const selectedItems = source.filter(item => mappings.has(item.id));
        
        if (selectedItems.length === 0) {
            return `Select ${type}s...`;
        }
        
        const itemNames = selectedItems.map(item => 'name' in item ? item.name : item.text.substring(0, 30) + '...');

        if (selectedItems.length <= 2) {
            return itemNames.join(', ');
        }
        return `${itemNames.slice(0, 2).join(', ')} +${selectedItems.length - 2} more`;
    };


    if (!question) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Mappings for "{question.label}"</DialogTitle>
                    <DialogDescription>
                        For each answer, select the task(s) and/or tip(s) that should be assigned to the user.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 overflow-y-auto flex-grow pr-4">
                    {question.options?.map(option => (
                        <div key={option} className="grid grid-cols-3 items-center gap-4">
                            <Label className="text-right">{option}</Label>
                            {/* Tasks Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                       <span className="truncate">{getButtonLabel(option, 'task')}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[400px]">
                                     {allTasks.map((task) => (
                                        <DropdownMenuCheckboxItem
                                            key={task.id}
                                            checked={taskMappings[option]?.has(task.id)}
                                            onCheckedChange={() => handleTaskToggle(option, task.id)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {task.name}
                                        </DropdownMenuCheckboxItem>
                                     ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                             {/* Tips Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                       <span className="truncate">{getButtonLabel(option, 'tip')}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[400px]">
                                     {allTips.map((tip) => (
                                        <DropdownMenuCheckboxItem
                                            key={tip.id}
                                            checked={tipMappings[option]?.has(tip.id)}
                                            onCheckedChange={() => handleTipToggle(option, tip.id)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {tip.text.substring(0, 50) + (tip.text.length > 50 ? '...' : '')}
                                        </DropdownMenuCheckboxItem>
                                     ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Mappings</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function QuestionEditor({ questionType, questions, saveFn, defaultQuestionsFn }: { 
    questionType: 'profile' | 'assessment';
    questions: Record<string, Question>;
    saveFn: (questions: Record<string, Question>) => void;
    defaultQuestionsFn: () => Question[];
}) {
    const { toast } = useToast();
    const { isLoading, masterTasks, taskMappings, saveTaskMappings, masterTips, tipMappings, saveTipMappings } = useUserData();

    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [isMapping, setIsMapping] = useState(false);
    const [mappingQuestion, setMappingQuestion] = useState<Question | null>(null);

    const orderedSections = useMemo(() => {
        if (isLoading || !questions || Object.keys(questions).length === 0) {
            return [];
        }

        const rootQuestions = buildQuestionTreeFromMap(questions);
        const sectionsMap: Record<string, Question[]> = {};

        const defaultQuestions = defaultQuestionsFn().filter(q => !q.parentId);
        const defaultSectionOrder = [...new Set(defaultQuestions.map(q => q.section))];
        const masterQuestionOrder = [...new Set(Object.values(questions).filter(q => !q.parentId).map(q => q.section))];

        const finalSectionOrder = [...defaultSectionOrder];
        masterQuestionOrder.forEach(s => {
            if (s && !finalSectionOrder.includes(s)) finalSectionOrder.push(s);
        });

        finalSectionOrder.forEach(s => sectionsMap[s] = []);
        rootQuestions.forEach(q => {
            const sectionName = q.section || 'Uncategorized';
            if (!sectionsMap[sectionName]) sectionsMap[sectionName] = [];
            sectionsMap[sectionName].push(q);
        });

        return finalSectionOrder.map(sectionName => ({
            id: sectionName,
            questions: sectionsMap[sectionName] || []
        })).filter(s => s.questions.length > 0);
    }, [isLoading, questions, defaultQuestionsFn]);

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsNewQuestion(false);
        setIsEditing(true);
    };

    const handleMapClick = (question: Question) => {
        setMappingQuestion(question);
        setIsMapping(true);
    };

    const handleAddNewClick = (parentId?: string) => {
        let section = '';
        if (parentId) {
            const parent = findQuestionById(orderedSections, parentId);
            if (parent) section = parent.section;
        } else {
            section = orderedSections[0]?.id || '';
        }
        setCurrentQuestion({ parentId, id: '', label: '', section, type: 'text', isActive: true, options: [], description: '' });
        setIsNewQuestion(true);
        setIsEditing(true);
    };

    const handleDeleteClick = (questionId: string) => {
        let newMaster = JSON.parse(JSON.stringify(questions));

        const deleteRecursive = (idToDelete: string) => {
            const questionToDelete = newMaster[idToDelete];
            if (!questionToDelete) return;

            Object.values(newMaster).forEach((q: any) => {
                if (q.parentId === idToDelete) {
                    deleteRecursive(q.id);
                }
            });

            delete newMaster[idToDelete];
            Object.values(newMaster).forEach((q: any) => {
                if (q.subQuestions) {
                    q.subQuestions = q.subQuestions.filter((sub: any) => sub.id !== idToDelete);
                }
            });
        }

        deleteRecursive(questionId);
        saveFn(newMaster);
        toast({ title: "Master Configuration Saved" });
    };

    const handleSaveEdit = (questionToSave: Partial<Question>, newSectionName?: string) => {
        let finalQuestion = { ...questionToSave, lastUpdated: new Date().toISOString() } as Question;

        if (newSectionName?.trim()) {
            finalQuestion.section = newSectionName.trim();
        }

        if (!finalQuestion.id && isNewQuestion) {
            finalQuestion.id = finalQuestion.label.toLowerCase().replace(/\s+/g, '-').replace(/[?]/g, '');
        }

        if (!finalQuestion.id || (!finalQuestion.section && !finalQuestion.parentId)) {
            toast({ title: "ID and Section/Parent are required.", variant: "destructive" });
            return;
        }

        const newMaster = JSON.parse(JSON.stringify(questions));
        newMaster[finalQuestion.id] = { ...newMaster[finalQuestion.id], ...finalQuestion };

        saveFn(newMaster);
        toast({ title: "Master Configuration Saved" });

        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
        let newMaster = JSON.parse(JSON.stringify(questions));
        const questionsArray = Object.values(newMaster).filter((q: any) => !q.parentId);
        const index = questionsArray.findIndex((q: any) => q.id === questionId);

        if (index === -1) return;

        const question = questionsArray[index] as Question;
        const questionsInSection = questionsArray.filter((q: any) => q.section === question.section);
        const sectionIndex = questionsInSection.findIndex((q: any) => q.id === questionId);

        const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

        if (targetIndex >= 0 && targetIndex < questionsInSection.length) {
            const [moved] = questionsInSection.splice(sectionIndex, 1);
            questionsInSection.splice(targetIndex, 0, moved);

            const allSections = [...new Set(questionsArray.map((q: any) => q.section))];
            const finalOrderedQuestions: Question[] = [];

            allSections.forEach(section => {
                if (section === question.section) {
                    finalOrderedQuestions.push(...questionsInSection as Question[]);
                } else {
                    finalOrderedQuestions.push(...questionsArray.filter((q: any) => q.section === section) as Question[]);
                }
            });

            const finalMaster: Record<string, Question> = {};
            const allQuestions = Object.values(newMaster) as Question[];

            finalOrderedQuestions.forEach(q => {
                const fullQuestion = allQuestions.find(fullQ => fullQ.id === q.id);
                if (fullQuestion) finalMaster[q.id] = fullQuestion;
            });

            allQuestions.forEach(q => {
                if (!finalMaster[q.id]) finalMaster[q.id] = q;
            });

            saveFn(finalMaster);
            toast({ title: "Master Configuration Saved" });
        }
    };
    
    const existingSections = useMemo(() => [...new Set(Object.values(questions).filter(q => !q.parentId).map(q => q.section))], [questions]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{questionType === 'profile' ? 'Profile' : 'Assessment'} Question List</CardTitle>
                    <CardDescription>
                        {questionType === 'profile' 
                            ? 'These questions appear in the initial "Create Your Profile" step.'
                            : 'These questions appear in the main "Exit Details" assessment.'
                        } Use arrows to reorder. Click <Link className="inline h-4 w-4 text-muted-foreground"/> to map tasks to answers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {orderedSections.map(section => (
                        <div key={section.id}>
                            <h3 className="font-semibold text-lg">{section.id}</h3>
                            <div className="pl-2 space-y-2 py-2">
                                {section.questions.map((question, index) => (
                                    <AdminQuestionItem
                                        key={question.id}
                                        question={question}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteClick}
                                        onAddSubQuestion={handleAddNewClick}
                                        onMove={handleMoveQuestion}
                                        onMapTasks={handleMapClick}
                                        isFirst={index === 0}
                                        isLast={index === section.questions.length - 1}
                                    />
                                ))}
                            </div>
                            <Separator className="my-6" />
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button variant="outline" onClick={() => handleAddNewClick()}>
                        <PlusCircle className="mr-2" />Add New Question
                    </Button>
                </CardFooter>
            </Card>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <EditQuestionDialog
                    isOpen={isEditing}
                    isNew={isNewQuestion}
                    question={currentQuestion}
                    existingSections={existingSections}
                    onSave={handleSaveEdit}
                    onClose={() => setIsEditing(false)}
                />
            </Dialog>
            <ManageTaskMappingDialog
                isOpen={isMapping}
                onOpenChange={setIsMapping}
                question={mappingQuestion}
                allTasks={masterTasks}
                allTips={masterTips}
                allTaskMappings={taskMappings}
                allTipMappings={tipMappings}
                saveTaskMappingsFn={saveTaskMappings}
                saveTipMappingsFn={saveTipMappings}
            />
        </>
    );
}


export default function AdminFormEditor() {
    const {
        masterQuestions, 
        saveMasterQuestions, 
        masterProfileQuestions,
        saveMasterProfileQuestions,
    } = useUserData();

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Master Form Editor</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the default questions for both the Profile and the main Assessment. Changes are saved automatically.</p>
                </div>
                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">Profile Questions</TabsTrigger>
                        <TabsTrigger value="assessment">Assessment Questions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                        <QuestionEditor
                            questionType="profile"
                            questions={masterProfileQuestions}
                            saveFn={saveMasterProfileQuestions}
                            defaultQuestionsFn={getDefaultProfileQuestions}
                        />
                    </TabsContent>
                    <TabsContent value="assessment" className="mt-6">
                        <QuestionEditor
                            questionType="assessment"
                            questions={masterQuestions}
                            saveFn={saveMasterQuestions}
                            defaultQuestionsFn={getDefaultQuestions}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
