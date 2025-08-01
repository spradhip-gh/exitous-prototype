
'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserData, Question, buildQuestionTreeFromMap, GuidanceRule, MasterTask, MasterTip, ExternalResource } from "@/hooks/use-user-data";
import { getDefaultQuestions, getDefaultProfileQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import AdminQuestionItem from "./AdminQuestionItem";
import EditQuestionDialog from "./EditQuestionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuidanceEditor from './GuidanceEditor';
import TaskForm from '../tasks/TaskForm';
import TipForm from '../tips/TipForm';


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

export default function AdminFormEditor() {
    const {
        masterQuestions,
        saveMasterQuestions,
        masterProfileQuestions,
        saveMasterProfileQuestions,
        guidanceRules,
        saveGuidanceRules,
        masterTasks,
        masterTips,
        externalResources,
        saveMasterTasks,
        saveMasterTips,
    } = useUserData();

    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);

    const [isTipFormOpen, setIsTipFormOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<Partial<MasterTip> | null>(null);

    const [newItemCallback, setNewItemCallback] = useState<((item: any) => void) | null>(null);

    const allQuestions = useMemo(() => {
        const profileQs = buildQuestionTreeFromMap(masterProfileQuestions);
        const assessmentQs = buildQuestionTreeFromMap(masterQuestions);
        return [...profileQs, ...assessmentQs];
    }, [masterProfileQuestions, masterQuestions]);

    const handleAddNewTask = useCallback((callback: (newTask: MasterTask) => void) => {
        setEditingTask(null);
        setNewItemCallback(() => callback);
        setIsTaskFormOpen(true);
    }, []);

    const handleAddNewTip = useCallback((callback: (newTip: MasterTip) => void) => {
        setEditingTip(null);
        setNewItemCallback(() => callback);
        setIsTipFormOpen(true);
    }, []);
    
    const handleSaveNewTask = (taskData: MasterTask) => {
        const newTasks = [...masterTasks, taskData];
        saveMasterTasks(newTasks);
        if (newItemCallback) {
            newItemCallback(taskData);
        }
        setIsTaskFormOpen(false);
        setNewItemCallback(null);
    };

    const handleSaveNewTip = (tipData: MasterTip) => {
        const newTips = [...masterTips, tipData];
        saveMasterTips(newTips);
        if (newItemCallback) {
            newItemCallback(tipData);
        }
        setIsTipFormOpen(false);
        setNewItemCallback(null);
    };


    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Master Form Editor</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the default questions for both the Profile and the main Assessment. Changes are saved automatically.</p>
                </div>
                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile Questions</TabsTrigger>
                        <TabsTrigger value="assessment">Assessment Questions</TabsTrigger>
                        <TabsTrigger value="guidance">Guidance Rules</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                        <QuestionEditor
                            questionType="profile"
                            questions={masterProfileQuestions}
                            saveFn={saveMasterProfileQuestions}
                            defaultQuestionsFn={getDefaultProfileQuestions}
                            onAddNewTask={handleAddNewTask}
                            onAddNewTip={handleAddNewTip}
                            masterTasks={masterTasks}
                            masterTips={masterTips}
                        />
                    </TabsContent>
                    <TabsContent value="assessment" className="mt-6">
                        <QuestionEditor
                            questionType="assessment"
                            questions={masterQuestions}
                            saveFn={saveMasterQuestions}
                            defaultQuestionsFn={getDefaultQuestions}
                            onAddNewTask={handleAddNewTask}
                            onAddNewTip={handleAddNewTip}
                            masterTasks={masterTasks}
                            masterTips={masterTips}
                        />
                    </TabsContent>
                    <TabsContent value="guidance" className="mt-6">
                        <GuidanceEditor
                            questions={allQuestions}
                            guidanceRules={guidanceRules}
                            saveGuidanceRules={saveGuidanceRules}
                            masterTasks={masterTasks}
                            masterTips={masterTips}
                            externalResources={externalResources}
                            saveMasterTasks={saveMasterTasks}
                            saveMasterTips={saveMasterTips}
                        />
                    </TabsContent>
                </Tabs>
            </div>
             <TaskForm 
                isOpen={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen}
                onSave={handleSaveNewTask}
                task={null}
                allResources={externalResources}
            />

             <TipForm 
                isOpen={isTipFormOpen}
                onOpenChange={setIsTipFormOpen}
                onSave={handleSaveNewTip}
                tip={null}
            />
        </div>
    );
}

function QuestionEditor({ questionType, questions, saveFn, defaultQuestionsFn, onAddNewTask, onAddNewTip, masterTasks, masterTips }: {
    questionType: 'profile' | 'assessment';
    questions: Record<string, Question>;
    saveFn: (questions: Record<string, Question>) => void;
    defaultQuestionsFn: () => Question[];
    onAddNewTask: (callback: (item: any) => void) => void;
    onAddNewTip: (callback: (item: any) => void) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
}) {
    const { toast } = useToast();
    const {
        isLoading,
    } = useUserData();

    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

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
            finalQuestion.id = finalQuestion.label?.toLowerCase().replace(/\s+/g, '-').replace(/[?]/g, '') || `q-${Date.now()}`;
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
                        } Use arrows to reorder.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {orderedSections.map(section => (
                        <div key={section.id}>
                            <h3 className="font-semibold text-lg">{section.id}</h3>
                            <div className="pl-2 space-y-2 py-2">
                                {section.questions.map((question, index) => {
                                    return (
                                        <AdminQuestionItem
                                            key={question.id}
                                            question={question}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteClick}
                                            onAddSubQuestion={handleAddNewClick}
                                            onMove={handleMoveQuestion}
                                            isFirst={index === 0}
                                            isLast={index === section.questions.length - 1}
                                        />
                                    )
                                })}
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
                    isNew={isNewQuestion}
                    question={currentQuestion}
                    existingSections={existingSections}
                    onSave={handleSaveEdit}
                    onClose={() => setIsEditing(false)}
                    onAddNewTask={onAddNewTask}
                    onAddNewTip={onAddNewTip}
                    allCompanyTasks={masterTasks}
                    allCompanyTips={masterTips}
                />
            </Dialog>
        </>
    );
}
