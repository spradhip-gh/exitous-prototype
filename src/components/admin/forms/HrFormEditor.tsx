

'use client';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUserData, CompanyConfig, Question, ReviewQueueItem, MasterTask, MasterTip, ExternalResource, CompanyAssignment } from "@/hooks/use-user-data";
import { buildQuestionTreeFromMap } from '@/hooks/use-end-user-data';
import { getDefaultQuestions, getDefaultProfileQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlusCircle, ShieldAlert, Star, FilePenLine, History, Edit, Bug, ArchiveRestore, Trash2 } from "lucide-react";
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
import { Pencil } from "lucide-react";
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
    const { reviewQueue, saveReviewQueue, companyAssignments } = useUserData();
    const { toast } = useToast();

    const companyAssignmentForHr = useMemo(() => {
        return companyAssignments.find(c => c.companyName === auth?.companyName);
    }, [companyAssignments, auth?.companyName]);

    const mySuggestions = useMemo(() => {
        if (!companyAssignmentForHr?.companyId) return [];
        return reviewQueue
            .filter(item => item.company_id === companyAssignmentForHr.companyId)
            .sort((a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime());
    }, [reviewQueue, companyAssignmentForHr?.companyId]);

    const handleWithdraw = (itemId: string) => {
        const updatedQueue = reviewQueue.filter(item => item.id !== itemId);
        saveReviewQueue(updatedQueue);
        toast({ title: "Suggestion Withdrawn", description: "Your suggestion has been removed from the review queue." });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
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
                                <TableCell className="font-medium">{item.change_details?.questionLabel}</TableCell>
                                <TableCell>
                                    <div className="text-xs space-y-1">
                                        {item.type === 'custom_question_guidance' && <div className="text-blue-700">New Question Guidance</div>}
                                        {item.change_details?.reason && <div className="italic text-muted-foreground">Reason: "{item.change_details.reason}"</div>}
                                        {item.change_details?.optionsToAdd?.length > 0 && <div className="text-green-700">+ Add: {item.change_details.optionsToAdd.map((o: any) => `"${o.option}"`).join(', ')}</div>}
                                        {item.change_details?.optionsToRemove?.length > 0 && <div className="text-red-700">- Remove: {item.change_details.optionsToRemove.join(', ')}</div>}
                                        {item.rejection_reason && <div className="text-red-700">Rejection Reason: "{item.rejection_reason}"</div>}
                                    </div>
                                </TableCell>
                                <TableCell>{format(parseISO(item.created_at), 'PPp')}</TableCell>
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
    canWrite,
    onAddNewTask,
    onAddNewTip,
    companyConfig,
    companyName
}: {
    questionType: 'profile' | 'assessment';
    canWrite: boolean;
    onAddNewTask: (callback: (item: any) => void) => void;
    onAddNewTip: (callback: (item: any) => void) => void;
    companyConfig?: CompanyConfig;
    companyName: string;
}) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const {
        companyConfigs,
        saveCompanyConfig,
        masterQuestions,
        masterProfileQuestions,
        isLoading,
        getCompanyConfig,
        addReviewQueueItem,
        getMasterQuestionConfig,
        reviewQueue,
        companyAssignments,
    } = useUserData();

    const [orderedSections, setOrderedSections] = useState<HrOrderedSection[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewCustom, setIsNewCustom] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    const companyAssignmentForHr = useMemo(() => {
        return companyAssignments.find(c => c.companyName === auth?.companyName);
    }, [companyAssignments, auth?.companyName]);

    const pendingSuggestionsByQuestionId = useMemo(() => {
        const map = new Map<string, ReviewQueueItem>();
        if (!companyAssignmentForHr?.companyId) return map;

        reviewQueue.forEach(item => {
            if (item.company_id === companyAssignmentForHr.companyId && item.status === 'pending' && item.change_details?.questionId) {
                map.set(item.change_details.questionId, item);
            }
        });
        return map;
    }, [reviewQueue, companyAssignmentForHr?.companyId]);

    useEffect(() => {
        if (isLoading || !companyName) {
            setOrderedSections([]);
            return;
        }

        const questionTree = getCompanyConfig(companyName, false, questionType);
        
        const sectionsMap: Record<string, Question[]> = {};
        const masterConfig = getMasterQuestionConfig(questionType);
        const sectionOrder = masterConfig?.section_order || [];
        
        questionTree.forEach(q => {
            if (q.parentId) return;
            const sectionName = q.section || "Uncategorized";
            if (!sectionsMap[sectionName]) {
                sectionsMap[sectionName] = [];
            }
            sectionsMap[sectionName].push(q);
        });
        
        const masterSectionSet = new Set(sectionOrder);
        Object.keys(sectionsMap).forEach(sectionName => {
            if (!masterSectionSet.has(sectionName)) {
                sectionOrder.push(sectionName);
                masterSectionSet.add(sectionName);
            }
        });

        const sections = sectionOrder
            .map(sectionName => {
                const questionsInSection = sectionsMap[sectionName];
                if (!questionsInSection || questionsInSection.length === 0) return null;
                
                const topCustom = questionsInSection.filter(q => q.isCustom && q.position === 'top').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                const master = questionsInSection.filter(q => !q.isCustom).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                const bottomCustom = questionsInSection.filter(q => q.isCustom && q.position !== 'top').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                return { id: sectionName, questions: [...topCustom, ...master, ...bottomCustom] };
            })
            .filter((s): s is HrOrderedSection => s !== null);

        setOrderedSections(sections);

    }, [companyName, isLoading, companyConfig, questionType, getCompanyConfig, getMasterQuestionConfig]);


    const handleToggleQuestion = (questionId: string) => {
        if (!companyConfig) return;
        const newConfig = JSON.parse(JSON.stringify(companyConfig));
        
        if (!newConfig.questions) {
            newConfig.questions = {};
        }

        const currentOverride = newConfig.questions[questionId] || {};
        const masterQuestion = masterQuestions[questionId] || masterProfileQuestions[questionId];
        
        const currentIsActive = currentOverride.isActive === undefined ? masterQuestion.isActive : currentOverride.isActive;
        currentOverride.isActive = !currentIsActive;
        
        newConfig.questions[questionId] = currentOverride;

        saveCompanyConfig(companyName, newConfig);
        toast({ title: 'Configuration Saved' });
    };
    
    const handleDeleteCustom = (questionId: string) => {
        if (!companyConfig) return;
        const newConfig = JSON.parse(JSON.stringify(companyConfig));
        if (newConfig.customQuestions && newConfig.customQuestions[questionId]) {
            delete newConfig.customQuestions[questionId];
        }
        saveCompanyConfig(companyName, newConfig);
        toast({ title: 'Custom Question Deleted' });
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
            formType: questionType,
            position: 'bottom', // Default to bottom
        });
        setIsNewCustom(true);
        setIsEditing(true);
    };

    const handleSaveEdit = (questionToSave: Partial<Question>, newSectionName?: string) => {
        if (!questionToSave || !companyName) return;
    
        const currentCompanyConfig = companyConfigs[companyName] || {};
        let finalConfig: CompanyConfig = JSON.parse(JSON.stringify(currentCompanyConfig));
    
        const allMasterQuestions = { ...masterQuestions, ...masterProfileQuestions };
        const masterQuestion = allMasterQuestions[questionToSave.id!];
    
        const isSuggestionMode = !!masterQuestion?.isLocked && !questionToSave.isCustom;
    
        if (isSuggestionMode) {
            const suggestedOptionsToAdd = (questionToSave.options || []).filter(opt => !(masterQuestion?.options || []).includes(opt));
             
             if (suggestedOptionsToAdd.length === 0 && !questionToSave.answerGuidance) {
                toast({ title: "No Changes Suggested", description: "Please suggest an addition, removal, or guidance mapping.", variant: "destructive" });
                return;
            }

             const reviewItem: Omit<ReviewQueueItem, 'id' | 'created_at' | 'company_id'> & { companyName?: string } = {
                user_email: auth?.email || 'unknown-hr',
                type: 'question_edit_suggestion',
                status: 'pending',
                companyName: auth?.companyName,
                change_details: {
                    questionId: questionToSave.id,
                    questionLabel: questionToSave.label,
                    optionsToAdd: suggestedOptionsToAdd.map(opt => ({ option: opt, guidance: questionToSave.answerGuidance?.[opt] })),
                },
            };
            addReviewQueueItem(reviewItem);
            toast({ title: "Suggestion Submitted", description: "Your suggested changes have been sent for review."});
        } else {
            let finalQuestion: Question = {
                ...questionToSave,
                lastUpdated: new Date().toISOString(),
                formType: questionType,
            } as Question;
    
            if (finalQuestion.isCustom) {
                 if (isNewCustom) {
                    finalQuestion.id = finalQuestion.id || `custom-${uuidv4()}`;
                    const customQuestionsInSection = Object.values(currentCompanyConfig.customQuestions || {}).filter(q => q.section === finalQuestion.section && q.position === finalQuestion.position);
                    finalQuestion.sortOrder = (customQuestionsInSection.length > 0 ? Math.max(...customQuestionsInSection.map(q => q.sortOrder || 0)) : 0) + 1;
                }
                if (newSectionName) {
                    finalQuestion.section = newSectionName;
                }
                if (!finalConfig.customQuestions) {
                    finalConfig.customQuestions = {};
                }
                finalConfig.customQuestions[finalQuestion.id] = finalQuestion;
            } else {
                if (!finalConfig.questions) {
                    finalConfig.questions = {};
                }
                const override: Partial<QuestionOverride> = {};
                if (finalQuestion.label !== masterQuestion.label) override.label = finalQuestion.label;
                if (finalQuestion.description !== masterQuestion.description) override.description = finalQuestion.description;
                
                 if (!override.optionOverrides) {
                    override.optionOverrides = { add: [], remove: [] };
                }

                const masterOptions = new Set(masterQuestion.options || []);
                const finalOptions = new Set(finalQuestion.options || []);

                const added = (finalQuestion.options || []).filter(o => !masterOptions.has(o));
                const removed = (masterQuestion.options || []).filter(o => !finalOptions.has(o));

                if (added.length > 0) override.optionOverrides.add = added;
                if (removed.length > 0) override.optionOverrides.remove = removed;

                if(added.length === 0 && removed.length === 0) {
                     delete override.optionOverrides;
                }
                
                override.lastUpdated = finalQuestion.lastUpdated;
                finalConfig.questions[finalQuestion.id] = override;
            }
    
            if (finalQuestion.answerGuidance || finalQuestion.projectAnswerGuidance) {
                if (!finalConfig.answerGuidanceOverrides) finalConfig.answerGuidanceOverrides = {};
                
                Object.entries(finalQuestion.answerGuidance || {}).forEach(([answer, guidance]) => {
                    if (!finalConfig.answerGuidanceOverrides![finalQuestion.id!]) {
                        finalConfig.answerGuidanceOverrides![finalQuestion.id!] = {};
                    }
                    finalConfig.answerGuidanceOverrides![finalQuestion.id!][answer] = guidance;
                });
                
                if (!finalConfig.projectConfigs) finalConfig.projectConfigs = {};
                Object.entries(finalQuestion.projectAnswerGuidance || {}).forEach(([answer, projectGuidances]) => {
                    Object.entries(projectGuidances).forEach(([projectId, guidance]) => {
                        if (!finalConfig.projectConfigs![projectId]) finalConfig.projectConfigs![projectId] = {};
                        if (!finalConfig.projectConfigs![projectId].answerGuidanceOverrides) finalConfig.projectConfigs![projectId].answerGuidanceOverrides = {};
                        if (!finalConfig.projectConfigs![projectId].answerGuidanceOverrides![finalQuestion.id!]) finalConfig.projectConfigs![projectId].answerGuidanceOverrides![finalQuestion.id!] = {};
                        finalConfig.projectConfigs![projectId].answerGuidanceOverrides![finalQuestion.id!][answer] = guidance;
                    });
                });
            }
    
            saveCompanyConfig(companyName, finalConfig);
            toast({ title: "Question Saved", description: "Your changes have been saved to the company configuration." });
        }
    
        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const handleMoveQuestion = (questionId: string, direction: 'up' | 'down' | 'to_top' | 'to_bottom') => {
        if (!companyConfig?.customQuestions) return;

        const currentQuestion = companyConfig.customQuestions[questionId];
        if (!currentQuestion) return;

        const newConfig = JSON.parse(JSON.stringify(companyConfig));

        if (direction === 'to_top' || direction === 'to_bottom') {
            newConfig.customQuestions[questionId].position = direction === 'to_top' ? 'top' : 'bottom';
        } else {
            const siblings = Object.values(newConfig.customQuestions as Record<string, Question>)
                .filter(q => q.section === currentQuestion.section && q.position === currentQuestion.position)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            const currentIndex = siblings.findIndex(q => q.id === questionId);
            if (currentIndex === -1) return;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= siblings.length) return;

            // Swap sortOrder
            const currentSortOrder = siblings[currentIndex].sortOrder || 0;
            const targetSortOrder = siblings[targetIndex].sortOrder || 0;

            newConfig.customQuestions[questionId].sortOrder = targetSortOrder;
            newConfig.customQuestions[siblings[targetIndex].id].sortOrder = currentSortOrder;
        }

        saveCompanyConfig(companyName, newConfig);
        toast({ title: 'Order Saved' });
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
                    <CardDescription>Enable, disable, or edit questions. For custom questions (<Star className="inline h-4 w-4 text-amber-500" />), you can use the arrows to reorder them within their position (top/bottom of section).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {orderedSections.map((section) => {
                        const customQuestionsTop = section.questions.filter(q => q.isCustom && q.position === 'top');
                        const customQuestionsBottom = section.questions.filter(q => q.isCustom && q.position !== 'top');

                        return (
                            <div key={section.id} className="space-y-2">
                                <h3 className="font-semibold text-lg">{section.id}</h3>
                                <div className="pl-2 space-y-2 py-2">
                                    {section.questions.map((question, index) => {
                                        const allMasterQuestions = { ...masterQuestions, ...masterProfileQuestions };
                                        const masterQ = allMasterQuestions[question.id];
                                        const hasBeenUpdated = !!(masterQ && question.lastUpdated && masterQ.lastUpdated && new Date(masterQ.lastUpdated) > new Date(question.lastUpdated));
                                        
                                        const relevantCustomGroup = question.position === 'top' ? customQuestionsTop : customQuestionsBottom;
                                        const customIndex = relevantCustomGroup.findIndex(q => q.id === question.id);
                                        const pendingSuggestion = pendingSuggestionsByQuestionId.get(question.id);

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
                                                canWrite={canWrite}
                                                isFirstCustom={question.isCustom && customIndex === 0}
                                                isLastCustom={question.isCustom && customIndex === relevantCustomGroup.length - 1}
                                                pendingSuggestion={pendingSuggestion}
                                                companyConfig={companyConfig}
                                                projects={companyAssignmentForHr?.projects || []}
                                            />
                                        )
                                    })}
                                </div>
                                <Separator className="my-6" />
                            </div>
                        )
                    })}
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button variant="outline" onClick={() => handleAddNewCustomClick()} disabled={!canWrite}><PlusCircle className="mr-2" /> Add Custom Question</Button>
                </CardFooter>
            </Card>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <EditQuestionDialog
                    isNew={isNewCustom}
                    question={currentQuestion}
                    onSave={handleSaveEdit}
                    onClose={() => setIsEditing(false)}
                    masterQuestionForEdit={masterQuestionForEdit}
                    existingSections={availableSections}
                    onAddNewTask={onAddNewTask}
                    onAddNewTip={onAddNewTip}
                    allCompanyTasks={companyConfig?.companyTasks || []}
                    allCompanyTips={companyConfig?.companyTips || []}
                    formType={questionType}
                    projects={companyAssignmentForHr?.projects || []}
                />
            </Dialog>
        </>
    );
}

function CompanyContentTabs({ companyConfig, canWrite, onTaskEdit, onTipEdit, onTaskDelete, onTipDelete, onAddNewTask, onAddNewTip }: {
    companyConfig: CompanyConfig,
    canWrite: boolean,
    onTaskEdit: (task: MasterTask) => void;
    onTipEdit: (tip: MasterTip) => void;
    onTaskDelete: (taskId: string) => void;
    onTipDelete: (tipId: string) => void;
    onAddNewTask: () => void;
    onAddNewTip: () => void;
}) {

    const companyTasks = companyConfig.companyTasks || [];
    const companyTips = companyConfig.companyTips || [];

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
                                            <Button variant="ghost" size="icon" onClick={() => onTaskEdit(task)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onTaskDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={onAddNewTask}><PlusCircle className="mr-2" /> Add Company Task</Button>
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
                                            <Button variant="ghost" size="icon" onClick={() => onTipEdit(tip)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onTipDelete(tip.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={onAddNewTip}><PlusCircle className="mr-2" /> Add Company Tip</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </>
    )
}

export default function HrFormEditor() {
    const { auth } = useAuth();
    const { companyAssignmentForHr, isLoading, companyConfigs, saveCompanyConfig, externalResources, masterQuestions, masterProfileQuestions } = useUserData();
    const { toast } = useToast();
    
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<MasterTask> | null>(null);
    const [taskCallback, setTaskCallback] = useState<((item: any) => void) | null>(null);

    const [isTipFormOpen, setIsTipFormOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<Partial<MasterTip> | null>(null);
    const [tipCallback, setTipCallback] = useState<((item: any) => void) | null>(null);

    const companyName = auth?.companyName;
    const canWrite = auth?.permissions?.formEditor === 'write';

    const companyConfig = useMemo(() => {
        return companyName ? companyConfigs[companyName] : undefined;
    }, [companyName, companyConfigs]);

    const handleAddNewTask = useCallback((callback: (newTask: MasterTask) => void) => {
        setEditingTask(null);
        setTaskCallback(() => callback);
        setIsTaskFormOpen(true);
    }, []);

    const handleEditTask = useCallback((task: MasterTask) => {
        setEditingTask(task);
        setIsTaskFormOpen(true);
    }, []);

    const handleSaveTask = (task: MasterTask) => {
        if (!companyConfig || !companyName) return;
        const companyTasks = companyConfig.companyTasks || [];
        const newTasks = [...companyTasks];
        const existingIndex = newTasks.findIndex(t => t.id === task.id);
        if (existingIndex > -1) {
            newTasks[existingIndex] = task;
        } else {
            task.id = task.id || `ctask-${uuidv4()}`;
            newTasks.push(task);
        }
        saveCompanyConfig(companyName, { ...companyConfig, companyTasks: newTasks });
        toast({ title: "Company Task Saved" });

        if(taskCallback) {
            taskCallback(task);
        }
        setIsTaskFormOpen(false);
        setEditingTask(null);
        setTaskCallback(null);
    };

    const handleDeleteTask = (taskId: string) => {
        if (!companyConfig || !companyName) return;
        const newTasks = (companyConfig.companyTasks || []).filter(t => t.id !== taskId);
        saveCompanyConfig(companyName, { ...companyConfig, companyTasks: newTasks });
        toast({ title: "Company Task Deleted" });
    };

    const handleAddNewTip = useCallback((callback: (newTip: MasterTip) => void) => {
        setEditingTip(null);
        setTipCallback(() => callback);
        setIsTipFormOpen(true);
    }, []);
    
    const handleEditTip = useCallback((tip: MasterTip) => {
        setEditingTip(tip);
        setIsTipFormOpen(true);
    }, []);

    const handleSaveTip = (tip: MasterTip) => {
        if (!companyConfig || !companyName) return;
        const companyTips = companyConfig.companyTips || [];
        const newTips = [...companyTips];
        const existingIndex = newTips.findIndex(t => t.id === tip.id);
        if (existingIndex > -1) {
            newTips[existingIndex] = tip;
        } else {
            tip.id = tip.id || `ctip-${uuidv4()}`;
            newTips.push(tip);
        }
        saveCompanyConfig(companyName, { ...companyConfig, companyTips: newTips });
        toast({ title: "Company Tip Saved" });

        if(tipCallback) {
            tipCallback(tip);
        }
        setIsTipFormOpen(false);
        setEditingTip(null);
        setTipCallback(null);
    };

    const handleDeleteTip = (tipId: string) => {
        if (!companyConfig || !companyName) return;
        const newTips = (companyConfig.companyTips || []).filter(t => t.id !== tipId);
        saveCompanyConfig(companyName, { ...companyConfig, companyTips: newTips });
        toast({ title: "Company Tip Deleted" });
    };
    
    const { archivedQuestions, handleReactivateClick } = useMemo(() => {
        const archived: Question[] = [];
        const allMaster = { ...masterProfileQuestions, ...masterQuestions };
    
        Object.values(allMaster).forEach(q => {
          const override = companyConfig?.questions?.[q.id];
          if (override?.isActive === false) {
            archived.push({ ...q, ...override });
          }
        });
        
        const reactivate = (questionId: string) => {
            if (!companyConfig || !companyName) return;
            const newConfig = { ...companyConfig };
            if (newConfig.questions?.[questionId]) {
              newConfig.questions[questionId].isActive = true;
            }
            saveCompanyConfig(companyName, newConfig);
            toast({ title: 'Question re-enabled for your company.' });
        };
    
        return { archivedQuestions: archived, handleReactivateClick: reactivate };
      }, [masterProfileQuestions, masterQuestions, companyConfig, saveCompanyConfig, companyName, toast]);


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
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="assessment-questions">Assessment Questions</TabsTrigger>
                        <TabsTrigger value="profile-questions">Profile Questions</TabsTrigger>
                        <TabsTrigger value="company-tasks">Company Tasks</TabsTrigger>
                        <TabsTrigger value="company-tips">Company Tips</TabsTrigger>
                        <TabsTrigger value="suggestions">My Suggestions</TabsTrigger>
                        <TabsTrigger value="archived">Archived Questions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="assessment-questions" className="mt-6">
                        <QuestionEditor questionType="assessment" canWrite={canWrite} onAddNewTask={handleAddNewTask} onAddNewTip={handleAddNewTip} companyConfig={companyConfig} companyName={companyName} />
                    </TabsContent>
                    <TabsContent value="profile-questions" className="mt-6">
                        <QuestionEditor questionType="profile" canWrite={canWrite} onAddNewTask={handleAddNewTask} onAddNewTip={handleAddNewTip} companyConfig={companyConfig} companyName={companyName} />
                    </TabsContent>
                    <CompanyContentTabs 
                        companyConfig={companyConfig} 
                        canWrite={canWrite} 
                        onTaskEdit={handleEditTask}
                        onTipEdit={handleEditTip}
                        onTaskDelete={handleDeleteTask}
                        onTipDelete={handleDeleteTip}
                        onAddNewTask={() => handleAddNewTask(() => {})}
                        onAddNewTip={() => handleAddNewTip(() => {})}
                    />
                    <TabsContent value="suggestions" className="mt-6">
                        <MySuggestionsTab />
                    </TabsContent>
                     <TabsContent value="archived" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Archived Questions</CardTitle>
                                <CardDescription>This is a list of master questions that have been disabled for your company.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Question</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archivedQuestions.length > 0 ? (
                                            archivedQuestions.map(q => (
                                                <TableRow key={q.id}>
                                                    <TableCell>{q.label}</TableCell>
                                                    <TableCell>{q.section}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleReactivateClick(q.id)}><ArchiveRestore className="mr-2"/> Re-enable</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No questions have been archived.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <TaskForm
                    isOpen={isTaskFormOpen}
                    onOpenChange={setIsTaskFormOpen}
                    task={editingTask}
                    onSave={handleSaveTask}
                    allResources={externalResources}
                />
                <TipForm
                    isOpen={isTipFormOpen}
                    onOpenChange={setIsTipFormOpen}
                    tip={editingTip}
                    onSave={handleSaveTip}
                />
            </div>
        </div>
    );
}
