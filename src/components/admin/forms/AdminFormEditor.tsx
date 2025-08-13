

'use client';
import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserData, Question, GuidanceRule, MasterTask, MasterTip, ExternalResource, MasterQuestionConfig } from "@/hooks/use-user-data";
import { buildQuestionTreeFromMap } from '@/hooks/use-end-user-data';
import { getDefaultQuestions, getDefaultProfileQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Archive, ArchiveRestore, Trash2, GripVertical } from "lucide-react";
import AdminQuestionItem from "./AdminQuestionItem";
import EditQuestionDialog from "./EditQuestionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuidanceEditor from './GuidanceEditor';
import TaskForm from '../tasks/TaskForm';
import TipForm from '../tips/TipForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

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
        masterProfileQuestions,
        guidanceRules,
        saveGuidanceRules,
        masterTasks,
        masterTips,
        externalResources,
        saveMasterTasks,
        saveMasterTips,
        saveMasterQuestions,
        isLoading,
    } = useUserData();

    const { toast } = useToast();
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);

    const [isTipFormOpen, setIsTipFormOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<Partial<MasterTip> | null>(null);

    const [newItemCallback, setNewItemCallback] = useState<((item: any) => void) | null>(null);

    const activeQuestions = useMemo(() => {
        const active: Question[] = [];
        const processQuestions = (qMap: Record<string, Question>) => {
            Object.values(qMap).forEach(q => {
                if (q.isActive) {
                   active.push(q);
                }
            });
        }
        processQuestions(masterProfileQuestions);
        processQuestions(masterQuestions);
        return buildQuestionTreeFromMap(active.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, Question>));
    }, [masterProfileQuestions, masterQuestions]);

    const { archivedProfileQuestions, archivedAssessmentQuestions } = useMemo(() => {
        const archivedProfile: Question[] = [];
        const archivedAssessment: Question[] = [];
        Object.values(masterProfileQuestions).forEach(q => { if (!q.isActive) archivedProfile.push(q); });
        Object.values(masterQuestions).forEach(q => { if (!q.isActive) archivedAssessment.push(q); });
        return { archivedProfileQuestions: archivedProfile, archivedAssessmentQuestions: archivedAssessment };
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

    const handleReactivateClick = (questionId: string, type: 'profile' | 'assessment') => {
        const questions = type === 'profile' ? { ...masterProfileQuestions } : { ...masterQuestions };
        questions[questionId].isActive = true;
        saveMasterQuestions(questions, type);
        toast({ title: "Question Reactivated" });
    };

    const handleDeleteClick = (questionId: string, type: 'profile' | 'assessment') => {
        const questions = type === 'profile' ? { ...masterProfileQuestions } : { ...masterQuestions };
        
        const deleteRecursive = (idToDelete: string, currentQuestions: Record<string, Question>) => {
            const questionToDelete = currentQuestions[idToDelete];
            if (!questionToDelete) return;

            Object.values(currentQuestions).forEach((q: any) => {
                if (q.parentId === idToDelete) {
                    deleteRecursive(q.id, currentQuestions);
                }
            });
            delete currentQuestions[idToDelete];
        }

        deleteRecursive(questionId, questions);
        saveMasterQuestions(questions, type);
        toast({ title: "Question Permanently Deleted" });
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Master Form Editor</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the default questions for both the Profile and the main Assessment. Changes are saved automatically.</p>
                </div>
                 {isLoading ? (
                    <Skeleton className="h-96 w-full" />
                ) : (
                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile">Profile Questions</TabsTrigger>
                        <TabsTrigger value="assessment">Assessment Questions</TabsTrigger>
                        <TabsTrigger value="guidance">Guidance Rules</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                        <QuestionEditor
                            questionType="profile"
                            questions={masterProfileQuestions}
                            saveMasterQuestions={saveMasterQuestions}
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
                            saveMasterQuestions={saveMasterQuestions}
                            onAddNewTask={handleAddNewTask}
                            onAddNewTip={handleAddNewTip}
                            masterTasks={masterTasks}
                            masterTips={masterTips}
                        />
                    </TabsContent>
                    <TabsContent value="guidance" className="mt-6">
                        <GuidanceEditor
                            questions={activeQuestions}
                            guidanceRules={guidanceRules}
                            saveGuidanceRules={saveGuidanceRules}
                            masterTasks={masterTasks}
                            masterTips={masterTips}
                            externalResources={externalResources}
                            saveMasterTasks={saveMasterTasks}
                            saveMasterTips={saveMasterTips}
                        />
                    </TabsContent>
                    <TabsContent value="archived" className="mt-6">
                       <Card>
                            <CardHeader>
                                <CardTitle>Archived Questions</CardTitle>
                                <CardDescription>
                                    These questions are inactive and will not appear in any forms. They can be reactivated or permanently deleted.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <h3 className="font-semibold text-lg mb-2">Profile Questions</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Question Text</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archivedProfileQuestions.length > 0 ? archivedProfileQuestions.map(q => (
                                            <TableRow key={q.id}>
                                                <TableCell>{q.label}</TableCell>
                                                <TableCell>{q.section}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleReactivateClick(q.id, 'profile')}>
                                                        <ArchiveRestore className="mr-2 h-4 w-4" /> Reactivate
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action will permanently delete the question "{q.label}". This cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteClick(q.id, 'profile')}>Yes, Permanently Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No archived profile questions.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <Separator className="my-6" />
                                 <h3 className="font-semibold text-lg mb-2">Assessment Questions</h3>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Question Text</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archivedAssessmentQuestions.length > 0 ? archivedAssessmentQuestions.map(q => (
                                            <TableRow key={q.id}>
                                                <TableCell>{q.label}</TableCell>
                                                <TableCell>{q.section}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleReactivateClick(q.id, 'assessment')}>
                                                        <ArchiveRestore className="mr-2 h-4 w-4" /> Reactivate
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action will permanently delete the question "{q.label}". This cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteClick(q.id, 'assessment')}>Yes, Permanently Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No archived assessment questions.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                )}
            </div>
             <TaskForm 
                isOpen={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen}
                task={null}
                onSave={handleSaveNewTask}
                allResources={externalResources}
                masterTasks={masterTasks}
            />

             <TipForm 
                isOpen={isTipFormOpen}
                onOpenChange={setIsTipFormOpen}
                tip={null}
                onSave={handleSaveNewTip}
                masterTips={masterTips}
            />
        </div>
    );
}

function SortableSection({ section, children }: { section: OrderedSection, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="space-y-2">
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab">
                    <GripVertical />
                </Button>
                <h3 className="font-semibold text-lg">{section.id}</h3>
            </div>
            <div className="pl-2 space-y-2 py-2">
                {children}
            </div>
            <Separator className="my-6" />
        </div>
    );
}

function QuestionEditor({ questionType, questions, saveMasterQuestions, onAddNewTask, onAddNewTip, masterTasks, masterTips }: {
    questionType: 'profile' | 'assessment';
    questions: Record<string, Question>;
    saveMasterQuestions: (questions: Record<string, Question>, type: 'profile' | 'assessment') => void;
    onAddNewTask: (callback: (item: any) => void) => void;
    onAddNewTip: (callback: (item: any) => void) => void;
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
}) {
    const { toast } = useToast();
    const { isLoading, saveMasterQuestionConfig, getMasterQuestionConfig } = useUserData();

    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [orderedSections, setOrderedSections] = useState<OrderedSection[]>([]);
    
    const sensors = useSensors(
        useSensor(PointerSensor)
    );
    
    const activeQuestions = useMemo(() => {
        if (!questions) return {};
        const active: Record<string, Question> = {};
        Object.values(questions).forEach(q => {
            if (q.isActive) {
                active[q.id] = q;
            }
        });
        return active;
    }, [questions]);


    useEffect(() => {
        if (isLoading || !activeQuestions || Object.keys(activeQuestions).length === 0) {
            setOrderedSections([]);
            return;
        }

        const rootQuestions = buildQuestionTreeFromMap(activeQuestions);
        const sectionsMap: Record<string, Question[]> = {};
        
        const masterQuestionConfig = getMasterQuestionConfig(questionType);
        let sectionOrder = masterQuestionConfig?.section_order;
        
        // If no saved order, create a default one
        if (!sectionOrder) {
            const defaultQuestionsFn = questionType === 'profile' ? getDefaultProfileQuestions : getDefaultQuestions;
            const defaultQs = defaultQuestionsFn().filter(q => !q.parentId);
            const defaultSectionOrder = [...new Set(defaultQs.map(q => q.section))];
            const masterQuestionOrder = [...new Set(Object.values(questions).filter(q => !q.parentId).map(q => q.section))];
            sectionOrder = [...defaultSectionOrder];
            masterQuestionOrder.forEach(s => {
               if (s && !sectionOrder!.includes(s)) sectionOrder!.push(s);
            });
        }
        
        // Ensure all existing sections are in the order, even if new
        const allCurrentSections = [...new Set(Object.values(activeQuestions).map(q => q.section).filter(Boolean))];
        allCurrentSections.forEach(s => {
            if (!sectionOrder!.includes(s)) {
                sectionOrder!.push(s);
            }
        });

        sectionOrder.forEach(s => sectionsMap[s] = []);
        rootQuestions.forEach(q => {
            const sectionName = q.section || 'Uncategorized';
            if (!sectionsMap[sectionName]) sectionsMap[sectionName] = [];
            sectionsMap[sectionName].push(q);
        });
        
        const sections = sectionOrder.map(sectionName => ({
            id: sectionName,
            questions: (sectionsMap[sectionName] || []).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        })).filter(s => s.questions.length > 0);
        
        setOrderedSections(sections);

    }, [isLoading, activeQuestions, questions, questionType, getMasterQuestionConfig]);


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
        setCurrentQuestion({ parentId, id: '', label: '', section, type: 'text', isActive: true, options: [], description: '', formType: questionType, sortOrder: 999 });
        setIsNewQuestion(true);
        setIsEditing(true);
    };

    const handleArchiveClick = (questionId: string) => {
        const newMaster = { ...questions };

        const archiveRecursive = (idToArchive: string) => {
            if (newMaster[idToArchive]) {
                newMaster[idToArchive].isActive = false;
                
                // Find sub-questions and archive them too
                Object.values(newMaster).forEach(q => {
                    if (q.parentId === idToArchive) {
                        archiveRecursive(q.id);
                    }
                });
            }
        };

        archiveRecursive(questionId);
        
        saveMasterQuestions(newMaster, questionType);
        toast({ title: "Question Archived", description: "The question and all its sub-questions have been archived." });
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

        const newMaster = { ...questions };
        newMaster[finalQuestion.id] = { ...newMaster[finalQuestion.id], ...finalQuestion };

        saveMasterQuestions(newMaster, questionType);
        toast({ title: "Master Configuration Saved" });

        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
        const newMaster = { ...questions };
        let questionSection = '';
        let questionParentId: string | undefined = undefined;

        // Find the question and its context (section or parent)
        for (const id in newMaster) {
            if (newMaster[id].id === questionId) {
                questionSection = newMaster[id].section || '';
                questionParentId = newMaster[id].parentId;
                break;
            }
        }
        
        let siblings: Question[];
        if (questionParentId) {
             siblings = Object.values(newMaster).filter(q => q.parentId === questionParentId).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        } else {
             siblings = Object.values(newMaster).filter(q => !q.parentId && q.section === questionSection).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        
        const currentIndex = siblings.findIndex(q => q.id === questionId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= siblings.length) return;
        
        // Swap sort orders
        const currentSortOrder = siblings[currentIndex].sortOrder || currentIndex;
        const targetSortOrder = siblings[targetIndex].sortOrder || targetIndex;

        newMaster[siblings[currentIndex].id].sortOrder = targetSortOrder;
        newMaster[siblings[targetIndex].id].sortOrder = currentSortOrder;
        
        saveMasterQuestions(newMaster, questionType);
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            let newOrder: OrderedSection[] = [];
            setOrderedSections((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over?.id);
                newOrder = arrayMove(items, oldIndex, newIndex);
                return newOrder;
            });

            saveMasterQuestionConfig(questionType, {
                section_order: newOrder.map(s => s.id)
            });
            toast({ title: 'Section order saved!' });
        }
    }
    
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
                        } Use arrows to reorder individual questions or the handle to reorder entire sections.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={orderedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {orderedSections.map(section => (
                                <SortableSection key={section.id} section={section}>
                                    {section.questions.map((question, index) => (
                                        <AdminQuestionItem
                                            key={question.id}
                                            question={question}
                                            onEdit={handleEditClick}
                                            onArchive={handleArchiveClick}
                                            onAddSubQuestion={handleAddNewClick}
                                            onMove={handleMoveQuestion}
                                            isFirst={index === 0}
                                            isLast={index === section.questions.length - 1}
                                        />
                                    ))}
                                </SortableSection>
                            ))}
                        </SortableContext>
                    </DndContext>
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
