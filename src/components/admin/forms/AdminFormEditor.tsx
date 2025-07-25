

'use client';
import * as React from 'react';
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserData, Question, buildQuestionTreeFromMap, TaskMapping, MasterTask } from "@/hooks/use-user-data";
import { getDefaultQuestions, getDefaultProfileQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Link } from "lucide-react";
import AdminQuestionItem from "./AdminQuestionItem";
import EditQuestionDialog from "./EditQuestionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
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
    allMappings,
    saveMappingsFn
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    question: Question | null;
    allTasks: MasterTask[];
    allMappings: TaskMapping[];
    saveMappingsFn: (mappings: TaskMapping[]) => void;
}) {
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);

    React.useEffect(() => {
        if (!isOpen) {
            setSelectedAnswer('');
            setSelectedTasks(new Set());
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (question && selectedAnswer) {
            const tasksForAnswer = allMappings
                .filter(m => m.questionId === question.id && m.answerValue === selectedAnswer)
                .map(m => m.taskId);
            setSelectedTasks(new Set(tasksForAnswer));
        } else {
            setSelectedTasks(new Set());
        }
    }, [question, selectedAnswer, allMappings]);

    const handleSave = () => {
        if (!question || !selectedAnswer) return;

        // Remove old mappings for this question/answer pair
        const otherMappings = allMappings.filter(m => !(m.questionId === question.id && m.answerValue === selectedAnswer));
        
        // Add new mappings
        const newMappings: TaskMapping[] = Array.from(selectedTasks).map(taskId => ({
            id: `${question.id}-${selectedAnswer}-${taskId}`, // A simple unique ID
            questionId: question.id,
            answerValue: selectedAnswer,
            taskId: taskId
        }));

        saveMappingsFn([...otherMappings, ...newMappings]);
        onOpenChange(false);
    };

    if (!question) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Task Mappings for "{question.label}"</DialogTitle>
                    <DialogDescription>
                        Map specific tasks to be assigned when a user selects a particular answer.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>When the answer is...</Label>
                        <Select onValueChange={setSelectedAnswer} value={selectedAnswer}>
                            <SelectTrigger><SelectValue placeholder="Select an answer option..." /></SelectTrigger>
                            <SelectContent>
                                {question.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Assign these tasks...</Label>
                        <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isComboboxOpen}
                                    className="w-full justify-between"
                                >
                                    {selectedTasks.size > 0 ? `${selectedTasks.size} tasks selected` : "Select tasks..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Search tasks..." />
                                    <CommandList>
                                        <CommandEmpty>No tasks found.</CommandEmpty>
                                        <CommandGroup>
                                            {allTasks.map((task) => (
                                                <CommandItem
                                                    key={task.id}
                                                    value={task.name}
                                                    onSelect={() => {
                                                        setSelectedTasks(prev => {
                                                            const newSet = new Set(prev);
                                                            if (newSet.has(task.id)) {
                                                                newSet.delete(task.id);
                                                            } else {
                                                                newSet.add(task.id);
                                                            }
                                                            return newSet;
                                                        })
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedTasks.has(task.id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {task.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!selectedAnswer}>Save Mappings</Button>
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
    const { isLoading, masterTasks, taskMappings, saveTaskMappings } = useUserData();

    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [isMappingTasks, setIsMappingTasks] = useState(false);
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

    const handleMapTasksClick = (question: Question) => {
        setMappingQuestion(question);
        setIsMappingTasks(true);
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
                                        onMapTasks={handleMapTasksClick}
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
                isOpen={isMappingTasks}
                onOpenChange={setIsMappingTasks}
                question={mappingQuestion}
                allTasks={masterTasks}
                allMappings={taskMappings}
                saveMappingsFn={saveTaskMappings}
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
