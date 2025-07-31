

'use client';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUserData, CompanyConfig, Question, ReviewQueueItem, buildQuestionTreeFromMap, MasterTask, MasterTip, ExternalResource } from "@/hooks/use-user-data";
import { getDefaultQuestions, getDefaultProfileQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { PlusCircle, ShieldAlert, Star, FilePenLine } from "lucide-react";
import HrQuestionItem from "./HrQuestionItem";
import EditQuestionDialog from "./EditQuestionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import TaskForm from "../tasks/TaskForm";
import TipForm from "../tips/TipForm";
import { Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


interface HrOrderedSection {
    id: string;
    questions: Question[];
}

function findQuestion(sections: HrOrderedSection[], questionId: string): Question | null {
    for (const section of sections) {
        const queue: Question[] = [...section.questions];
        while (queue.length > 0) {
            const q = queue.shift()!;
            if (q.id === questionId) return q;
            if (q.subQuestions) queue.push(...q.subQuestions);
        }
    }
    return null;
}

function MySuggestionsTab() {
    const { auth } = useAuth();
    const { reviewQueue, saveReviewQueue } = useUserData();
    const { toast } = useToast();

    const mySuggestions = useMemo(() => {
        if (!auth?.email || !auth.companyName) return [];
        return reviewQueue
            .filter(item => 
                (item.inputData?.type === 'question_edit_suggestion' || item.inputData?.type === 'custom_question_guidance') &&
                item.userEmail.toLowerCase() === auth.email!.toLowerCase() &&
                item.inputData?.companyName === auth.companyName
            )
            .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
    }, [reviewQueue, auth]);
    
    const handleWithdraw = (itemId: string) => {
        const updatedQueue = reviewQueue.filter(item => item.id !== itemId);
        saveReviewQueue(updatedQueue);
        toast({ title: "Suggestion Withdrawn", description: "Your suggestion has been removed from the review queue." });
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'approved': return <Badge variant="default" className="bg-green-600">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary">Pending</Badge>;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Submitted Suggestions</CardTitle>
                <CardDescription>A history of the suggestions you've submitted for review for {auth?.companyName}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead>Suggestion Details</TableHead>
                            <TableHead>Date Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mySuggestions.length > 0 ? mySuggestions.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.inputData.questionLabel}</TableCell>
                                <TableCell>
                                    <div className="text-xs space-y-1">
                                        {item.inputData.type === 'custom_question_guidance' && <div className="text-blue-700">New Question Guidance</div>}
                                        {item.inputData.suggestions?.optionsToAdd?.length > 0 && <div className="text-green-700">+ Add: {item.inputData.suggestions.optionsToAdd.map((o: any) => `"${o.option}"`).join(', ')}</div>}
                                        {item.inputData.suggestions?.optionsToRemove?.length > 0 && <div className="text-red-700">- Remove: {item.inputData.suggestions.optionsToRemove.join(', ')}</div>}
                                    </div>
                                </TableCell>
                                <TableCell>{format(parseISO(item.createdAt), 'PPp')}</TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell className="text-right">
                                     {item.status === 'pending' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">Withdraw</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Withdraw Suggestion?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will remove your suggestion from the review queue. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleWithdraw(item.id)}>Yes, Withdraw</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">You have not submitted any suggestions for this company.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function QuestionEditor({
    questionType,
    canWrite
}: {
    questionType: 'profile' | 'assessment';
    canWrite: boolean;
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { 
        getAllCompanyConfigs, 
        saveCompanyConfig, 
        masterQuestions, 
        masterProfileQuestions,
        isLoading, 
        getCompanyConfig, 
        addReviewQueueItem
    } = useUserData();

    const companyName = auth?.companyName;
    const [orderedSections, setOrderedSections] = useState<HrOrderedSection[]>([]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isNewCustom, setIsNewCustom] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    const companyConfig = useMemo(() => {
        return companyName ? getAllCompanyConfigs()[companyName] : undefined;
    }, [companyName, getAllCompanyConfigs]);
    
    const questionTree = useMemo(() => {
        if (companyName && !isLoading) {
            return getCompanyConfig(companyName, false, questionType);
        }
        return [];
    }, [companyName, isLoading, getCompanyConfig, questionType]);

    useEffect(() => {
        if (questionTree.length === 0) {
            setOrderedSections([]);
            return;
        }

        const companyQuestionOrder = companyConfig?.questionOrderBySection || {};
        const defaultQuestionsFn = questionType === 'profile' ? getDefaultProfileQuestions : getDefaultQuestions;

        const sectionsMap: Record<string, Question[]> = {};
        questionTree.forEach(q => {
            if (!q.section) return;
            if (!sectionsMap[q.section]) sectionsMap[q.section] = [];
            sectionsMap[q.section].push(q);
        });
        
        const masterSectionOrder = [...new Set(defaultQuestionsFn().filter(q => !q.parentId).map(q => q.section))];
        Object.keys(sectionsMap).forEach(s => {
            if (!masterSectionOrder.includes(s)) masterSectionOrder.push(s);
        });

        const sections = masterSectionOrder.map(sectionName => {
            const questionsInSection = sectionsMap[sectionName];
            if (!questionsInSection || questionsInSection.length === 0) return null;

            let savedOrder = (companyQuestionOrder[sectionName] || []).filter(id => questionsInSection.some(q => q.id === id));
            
            if (savedOrder.length === 0) {
                const defaultOrderedIds = defaultQuestionsFn()
                    .filter(q => q.section === sectionName && !q.parentId)
                    .map(q => q.id);
                savedOrder = [...defaultOrderedIds, ...questionsInSection.filter(q => q.isCustom).map(q => q.id)];
            } else {
                const orderedIdSet = new Set(savedOrder);
                questionsInSection.forEach(q => {
                    if (!orderedIdSet.has(q.id)) {
                        const masterIdsInSection = new Set(defaultQuestionsFn().filter(q => q.section === sectionName).map(q => q.id));
                        let lastMasterIndex = -1;
                        for (let i = savedOrder.length - 1; i >= 0; i--) {
                            if (masterIdsInSection.has(savedOrder[i])) {
                                lastMasterIndex = i;
                                break;
                            }
                        }
                        if (lastMasterIndex !== -1) {
                            savedOrder.splice(lastMasterIndex + 1, 0, q.id);
                        } else {
                            savedOrder.push(q.id);
                        }
                    }
                });
                 savedOrder = savedOrder.filter(id => questionsInSection.some(q => q.id === id));
            }
            
            const questionsForSection = savedOrder
                .map(id => questionsInSection.find(q => q.id === id))
                .filter((q): q is Question => !!q);


            return { id: sectionName, questions: questionsForSection };
        }).filter((s): s is HrOrderedSection => s !== null);

        setOrderedSections(sections);

    }, [questionTree, companyConfig, questionType]);

    const generateAndSaveConfig = useCallback((sections: HrOrderedSection[], isAutoApproved: boolean = false) => {
        if (!companyName) return;
        
        const allCompanyConfigs = getAllCompanyConfigs();
        const currentConfig = allCompanyConfigs[companyName] || {};
        
        let newConfig: CompanyConfig = JSON.parse(JSON.stringify(currentConfig));

        const companyOverrides: Record<string, Partial<Question>> = newConfig.questions || {};
        const customQuestions: Record<string, Question> = newConfig.customQuestions || {};
        const questionOrderBySection: Record<string, string[]> = newConfig.questionOrderBySection || {};

        const allMasterQuestions = { ...masterQuestions, ...masterProfileQuestions };

        const processQuestionForSave = (q: Question) => {
            if (q.isCustom) {
                customQuestions[q.id] = q;
            } else {
                const masterQ = allMasterQuestions[q.id];
                if (!masterQ) {
                    if(q.parentId) { // It's a custom sub-question on a master question
                         customQuestions[q.id] = q;
                    }
                } else {
                    const override: Partial<Question> = {};
                    let hasChanged = false;
                    const fieldsToCompare: (keyof Question)[] = ['isActive', 'label', 'defaultValue', 'options', 'description'];
                    fieldsToCompare.forEach(field => {
                        if (JSON.stringify(q[field]) !== JSON.stringify(masterQ[field])) {
                            (override as any)[field] = q[field];
                            hasChanged = true;
                        }
                    });
                    if (q.lastUpdated) override.lastUpdated = q.lastUpdated;
                    
                    if (hasChanged) {
                        companyOverrides[q.id] = override;
                    } else {
                        delete companyOverrides[q.id]; // Remove override if it matches master
                    }
                }
            }
            q.subQuestions?.forEach(processQuestionForSave);
        };

        sections.forEach(section => {
            questionOrderBySection[section.id] = section.questions.map(q => q.id);
            section.questions.forEach(processQuestionForSave);
        });
        
        newConfig = {
            ...newConfig,
            questions: companyOverrides,
            customQuestions,
            questionOrderBySection,
        };

        saveCompanyConfig(companyName, newConfig);
        if (isAutoApproved) {
            toast({ title: "Configuration Saved", description: `Settings for ${companyName} have been updated.` });
        }

    }, [companyName, masterQuestions, masterProfileQuestions, getAllCompanyConfigs, saveCompanyConfig, toast]);


    const handleToggleQuestion = (questionId: string) => {
        const newSections = JSON.parse(JSON.stringify(orderedSections));
        const findAndToggle = (questions: Question[]) => {
            for (const q of questions) {
                if (q.id === questionId) {
                    q.isActive = !q.isActive;
                    return true;
                }
                if (q.subQuestions && findAndToggle(q.subQuestions)) {
                    return true;
                }
            }
            return false;
        }
        newSections.forEach((s: HrOrderedSection) => findAndToggle(s.questions));
        setOrderedSections(newSections);
        generateAndSaveConfig(newSections, true);
    };
    
    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsNewCustom(false);
        setIsEditing(true);
    };

    const handleAddNewCustomClick = (parentId?: string) => {
        const parentQuestion = parentId ? findQuestion(orderedSections, parentId) : null;
        setCurrentQuestion({
            parentId: parentId,
            label: '',
            section: parentQuestion ? parentQuestion.section : (orderedSections[0]?.id || ''),
            type: 'text',
            isActive: true,
            isCustom: true,
            options: [],
            triggerValue: '',
        });
        setIsNewCustom(true);
        setIsEditing(true);
    };
    
    const handleDeleteCustom = (questionId: string) => {
        const newSections = JSON.parse(JSON.stringify(orderedSections));
         const findAndDelete = (questions: Question[]) => {
            for (let i = 0; i < questions.length; i++) {
                if (questions[i].id === questionId) {
                    questions.splice(i, 1);
                    return true;
                }
                if (questions[i].subQuestions && findAndDelete(questions[i].subQuestions!)) {
                    return true;
                }
            }
            return false;
        };
        newSections.forEach((s: HrOrderedSection) => findAndDelete(s.questions));
        setOrderedSections(newSections);
        generateAndSaveConfig(newSections, true);
    };

    const handleSaveEdit = (questionToSave: Partial<Question>, newSectionName?: string, suggestedEdits?: any, isAutoApproved: boolean = false) => {
        if (!questionToSave) return;
        
        if (suggestedEdits) {
             const reviewItem = {
                id: `review-suggestion-${Date.now()}`,
                userEmail: auth?.email || 'unknown-hr',
                inputData: { 
                    type: 'question_edit_suggestion',
                    companyName: auth?.companyName,
                    questionId: questionToSave.id,
                    questionLabel: questionToSave.label,
                    suggestions: suggestedEdits
                },
                output: {}, // Not applicable here
                status: 'pending',
                createdAt: new Date().toISOString(),
            } as unknown as ReviewQueueItem;

            addReviewQueueItem(reviewItem);
            toast({ title: "Suggestion Submitted", description: "Your suggested changes have been sent for review."});

            setIsEditing(false);
            setCurrentQuestion(null);
            return;
        }

        let newQuestion = { ...questionToSave, lastUpdated: new Date().toISOString() } as Question;
        let newSections = JSON.parse(JSON.stringify(orderedSections));

        if (isNewCustom) {
            if (!companyName || !newQuestion.label || (!newQuestion.parentId && !newQuestion.section)) {
                toast({ title: "Missing Fields", description: "Label and Section are required.", variant: "destructive" });
                return;
            }
             if(newQuestion.parentId && !newQuestion.triggerValue) {
                toast({ title: "Missing Trigger", description: "Sub-questions must have a trigger value.", variant: "destructive" });
                return;
            }

            if (!newQuestion.id) {
                newQuestion.id = `custom-${uuidv4()}`;
            }
            
            if (newQuestion.parentId) {
                const findAndAdd = (questions: Question[]) => {
                    for (const q of questions) {
                        if (q.id === newQuestion.parentId) {
                            if (!q.subQuestions) q.subQuestions = [];
                            q.subQuestions.push(newQuestion);
                            return true;
                        }
                        if (q.subQuestions && findAndAdd(q.subQuestions)) return true;
                    }
                    return false;
                }
                newSections.forEach((s: HrOrderedSection) => findAndAdd(s.questions));
            } else {
                 let section = newSections.find((s: HrOrderedSection) => s.id === newQuestion.section);
                if (section) {
                    section.questions.push(newQuestion);
                } else {
                    newSections.push({ id: newQuestion.section!, questions: [newQuestion] });
                }
            }
            
            // A new custom question is saved immediately and enters the review queue for audit.
            const reviewItem: ReviewQueueItem = {
                id: `review-custom-q-${Date.now()}`,
                userEmail: auth?.email || 'unknown-hr',
                inputData: {
                    type: 'custom_question_guidance',
                    companyName: auth?.companyName,
                    questionLabel: newQuestion.label,
                    questionId: newQuestion.id,
                    question: newQuestion,
                },
                output: {},
                status: 'pending', // Pending Admin review
                createdAt: new Date().toISOString(),
            };
            addReviewQueueItem(reviewItem);
            toast({ title: "Custom Question Added", description: "Your new question is live and has been sent for administrative review." });
            

        } else { 
            const findAndUpdate = (questions: Question[]) => {
                for (let i = 0; i < questions.length; i++) {
                    if (questions[i].id === newQuestion.id) {
                        const subs = questions[i].subQuestions;
                        questions[i] = newQuestion;
                        if (subs) questions[i].subQuestions = subs;
                        return true;
                    }
                    if (questions[i].subQuestions && findAndUpdate(questions[i].subQuestions!)) {
                        return true;
                    }
                }
                return false;
            };
            newSections.forEach((s: HrOrderedSection) => findAndUpdate(s.questions));
        }
        
        setOrderedSections(newSections);
        generateAndSaveConfig(newSections, isAutoApproved);
        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
        const newSections = JSON.parse(JSON.stringify(orderedSections));
        for (const section of newSections) {
            const index = section.questions.findIndex((q: Question) => q.id === questionId);
            if (index !== -1) {
                const targetIndex = direction === 'up' ? index - 1 : index + 1;
                if (targetIndex >= 0 && targetIndex < section.questions.length) {
                    const [movedQuestion] = section.questions.splice(index, 1);
                    section.questions.splice(targetIndex, 0, movedQuestion);
                    setOrderedSections(newSections);
                    generateAndSaveConfig(newSections, true);
                }
                break;
            }
        }
    };
    
    const masterQuestionForEdit = useMemo(() => {
        const allMasterQuestions = { ...masterQuestions, ...masterProfileQuestions };
        return currentQuestion && !currentQuestion.isCustom && allMasterQuestions ? allMasterQuestions[currentQuestion.id!] : null;
    }, [currentQuestion, masterQuestions, masterProfileQuestions]);

    const availableSections = useMemo(() => [...new Set(Object.values(questionType === 'profile' ? masterProfileQuestions : masterQuestions).filter(q => !q.parentId).map(q => q.section))], [masterQuestions, masterProfileQuestions, questionType]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Questions</CardTitle>
                    <CardDescription>Enable, disable, or edit questions. Use arrows to reorder custom questions. Questions marked with <Star className="inline h-4 w-4 text-amber-500"/> are custom to your company.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {orderedSections.map(({ id: section, questions: sectionQuestions }) => (
                        <div key={section}>
                            <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                            <div className="space-y-2">
                                {sectionQuestions.map((question, index) => {
                                    const allMasterQuestions = { ...masterQuestions, ...masterProfileQuestions };
                                    const masterQ = allMasterQuestions[question.id];
                                    const hasBeenUpdated = !!(masterQ && question.lastUpdated && masterQ.lastUpdated && new Date(masterQ.lastUpdated) > new Date(question.lastUpdated));
                                    
                                    return (
                                        <HrQuestionItem
                                            key={question.id}
                                            question={question}
                                            onToggleActive={handleToggleQuestion}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteCustom}
                                            onAddSub={handleAddNewCustomClick}
                                            hasBeenUpdated={hasBeenUpdated}
                                            onMove={handleMoveQuestion}
                                            isFirst={index === 0 || !question.isCustom}
                                            isLast={index === sectionQuestions.length - 1 || !question.isCustom}
                                            canWrite={canWrite}
                                        />
                                    )
                                })}
                            </div>
                            <Separator className="my-6" />
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button variant="outline" onClick={() => handleAddNewCustomClick()}><PlusCircle className="mr-2" /> Add Custom Question</Button>
                </CardFooter>
            </Card>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <EditQuestionDialog
                    isOpen={isEditing}
                    isNew={isNewCustom}
                    question={currentQuestion}
                    onSave={handleSaveEdit}
                    onClose={() => setIsEditing(false)}
                    masterQuestionForEdit={masterQuestionForEdit}
                    existingSections={availableSections}
                />
            </Dialog>
        </>
    );
}

function CompanyContentTabs({ companyConfig, canWrite }: { companyConfig: CompanyConfig, canWrite: boolean }) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const companyName = auth!.companyName!;
    const { saveCompanyConfig, externalResources } = useUserData();

    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isTipFormOpen, setIsTipFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);
    const [editingTip, setEditingTip] = useState<Partial<MasterTip> | null>(null);
    
    const companyTasks = companyConfig.companyTasks || [];
    const companyTips = companyConfig.companyTips || [];

    const handleSaveTask = (task: MasterTask) => {
        const newTasks = [...companyTasks];
        const existingIndex = newTasks.findIndex(t => t.id === task.id);
        if (existingIndex > -1) {
            newTasks[existingIndex] = task;
        } else {
            newTasks.push(task);
        }
        saveCompanyConfig(companyName, { ...companyConfig, companyTasks: newTasks });
        toast({ title: "Company Task Saved" });
        setIsTaskFormOpen(false);
    };

    const handleDeleteTask = (taskId: string) => {
        const newTasks = companyTasks.filter(t => t.id !== taskId);
        saveCompanyConfig(companyName, { ...companyConfig, companyTasks: newTasks });
        toast({ title: "Company Task Deleted" });
    };

    const handleSaveTip = (tip: MasterTip) => {
        const newTips = [...companyTips];
        const existingIndex = newTips.findIndex(t => t.id === tip.id);
        if (existingIndex > -1) {
            newTips[existingIndex] = tip;
        } else {
            newTips.push(tip);
        }
        saveCompanyConfig(companyName, { ...companyConfig, companyTips: newTips });
        toast({ title: "Company Tip Saved" });
        setIsTipFormOpen(false);
    };

    const handleDeleteTip = (tipId: string) => {
        const newTips = companyTips.filter(t => t.id !== tipId);
        saveCompanyConfig(companyName, { ...companyConfig, companyTips: newTips });
        toast({ title: "Company Tip Deleted" });
    };

    return (
        <>
            <TabsContent value="company-tasks">
                <Card>
                    <CardHeader>
                        <CardTitle>Company-Specific Tasks</CardTitle>
                        <CardDescription>Manage custom tasks that can be assigned via guidance on your custom questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {companyTasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell className="max-w-md">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <p className="truncate">{task.name}</p>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{task.name}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{task.category}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingTask(task); setIsTaskFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => { setEditingTask(null); setIsTaskFormOpen(true); }}><PlusCircle className="mr-2" /> Add Company Task</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="company-tips">
                 <Card>
                    <CardHeader>
                        <CardTitle>Company-Specific Tips</CardTitle>
                        <CardDescription>Manage custom tips that can be assigned via guidance on your custom questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Text</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {companyTips.map(tip => (
                                    <TableRow key={tip.id}>
                                        <TableCell className="max-w-md">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <p className="truncate">{tip.text}</p>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">{tip.text}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{tip.category}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingTip(tip); setIsTipFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTip(tip.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => { setEditingTip(null); setIsTipFormOpen(true); }}><PlusCircle className="mr-2" /> Add Company Tip</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TaskForm 
                isOpen={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen}
                task={editingTask}
                onSave={(task) => handleSaveTask({ ...task, isCompanySpecific: true })}
                allResources={externalResources}
            />
            <TipForm
                isOpen={isTipFormOpen}
                onOpenChange={setIsTipFormOpen}
                tip={editingTip}
                onSave={(tip) => handleSaveTip({ ...tip, isCompanySpecific: true })}
            />
        </>
    )
}

export default function HrFormEditor() {
    const { auth } = useAuth();
    const { companyAssignmentForHr, isLoading, getAllCompanyConfigs } = useUserData();
    const companyName = auth?.companyName;
    const canWrite = auth?.permissions?.formEditor === 'write';

    const companyConfig = useMemo(() => {
        return companyName ? getAllCompanyConfigs()[companyName] : undefined;
    }, [companyName, getAllCompanyConfigs]);

    if (isLoading || companyAssignmentForHr === undefined || !companyConfig) {
        return <div className="p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-8"><Skeleton className="h-64 w-full" /></div></div>;
    }
    if (!companyName || !companyAssignmentForHr) {
        return <div className="p-4 md:p-8"><Card><CardHeader><CardTitle>No Company Assigned</CardTitle></CardHeader><CardContent><p>Your account is not assigned to a company. Please contact an administrator.</p></CardContent></Card></div>;
    }
    if ((companyAssignmentForHr.version || 'basic') === 'basic') {
        return <div className="p-4 md:p-8"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert /> Pro Feature</CardTitle></CardHeader><CardContent><p>Managing the assessment is only available in the Pro version.</p><p className="text-sm text-muted-foreground mt-2">To enable question editing, please contact sales@exitous.co to upgrade to the Pro version.</p></CardContent></Card></div>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Form Editor</h1>
                    <p className="text-muted-foreground">Manage the Profile and Assessment forms for <span className="font-bold">{companyName}</span>. Changes are saved automatically.</p>
                </div>
                 <Tabs defaultValue="assessment-questions">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="assessment-questions">Assessment Questions</TabsTrigger>
                        <TabsTrigger value="profile-questions">Profile Questions</TabsTrigger>
                        <TabsTrigger value="company-tasks">Company Tasks</TabsTrigger>
                        <TabsTrigger value="company-tips">Company Tips</TabsTrigger>
                        <TabsTrigger value="suggestions">My Suggestions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="assessment-questions" className="mt-6">
                       <QuestionEditor questionType="assessment" canWrite={canWrite} />
                    </TabsContent>
                    <TabsContent value="profile-questions" className="mt-6">
                        <QuestionEditor questionType="profile" canWrite={canWrite} />
                    </TabsContent>
                    <CompanyContentTabs companyConfig={companyConfig} canWrite={canWrite} />
                    <TabsContent value="suggestions" className="mt-6">
                       <MySuggestionsTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
