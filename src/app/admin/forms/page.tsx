'use client';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyConfig, Question, buildQuestionTreeFromMap } from "@/hooks/use-user-data";
import { getDefaultQuestions } from "@/lib/questions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, BellDot, PlusCircle, Trash2, Copy, ShieldAlert, GripVertical, CornerDownRight, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


export default function FormEditorSwitchPage() {
    const { auth } = useAuth();

    if (auth?.role === 'admin') {
        return <AdminFormEditor />;
    }

    if (auth?.role === 'hr') {
        return <HrFormEditor />;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                 <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}


// ##################################
// #         HR FORM EDITOR         #
// ##################################

interface HrOrderedSection {
    id: string;
    questions: Question[];
}

function HrSubQuestionItem({ question, parentId, level, onToggleActive, onEdit, onDelete, onAddSub }: { question: Question, parentId: string, level: number, onToggleActive: (id: string, parentId?: string) => void, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSub: (parentId: string) => void }) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div className="space-y-2">
            <div className={cn("flex items-center space-x-2 group p-2 rounded-md", question.isCustom ? "bg-primary/5" : "bg-muted/50")} style={{ marginLeft: `${level * 1.5}rem`}}>
                <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Checkbox id={question.id} checked={question.isActive} onCheckedChange={() => onToggleActive(question.id, parentId)} />
                <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                {question.triggerValue && <Badge variant="outline" className="text-xs">On: {question.triggerValue}</Badge>}
                <div className="flex items-center">
                    {canHaveSubquestions && (
                         <Button variant="ghost" size="sm" onClick={() => onAddSub(question.id)}><PlusCircle className="h-4 w-4 mr-2" /> Sub</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                    {question.isCustom && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Custom Sub-Question?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{question.label}". This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(question.id)}>Yes, Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
             {question.subQuestions && question.subQuestions.length > 0 && (
                <div className="space-y-2">
                    {question.subQuestions.map(subQ => (
                        <HrSubQuestionItem
                            key={subQ.id}
                            question={subQ}
                            level={level + 1}
                            parentId={question.id}
                            onToggleActive={onToggleActive}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function HrSortableQuestionItem({ question, onToggleActive, onEdit, onDelete, onAddSub, hasBeenUpdated }: { question: Question, onToggleActive: (id: string, parentId?: string) => void, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSub: (parentId: string) => void, hasBeenUpdated: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
        id: question.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div ref={setNodeRef} style={style} className={cn("p-2 rounded-lg my-1", question.isCustom ? "bg-primary/5" : "bg-background")}>
            <div className="flex items-center space-x-2 group pr-2">
                <div {...attributes} {...listeners} className={cn("p-2 text-muted-foreground cursor-grab")}>
                    <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {hasBeenUpdated && !question.isCustom && <BellDot className="h-4 w-4 text-primary flex-shrink-0" />}
                    {question.isCustom && <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                </div>
                <Checkbox id={question.id} checked={question.isActive} onCheckedChange={() => onToggleActive(question.id)} />
                <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                <div className="flex items-center">
                    {canHaveSubquestions && (
                         <Button variant="ghost" size="sm" onClick={() => onAddSub(question.id)}><PlusCircle className="h-4 w-4 mr-2" /> Sub</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                    {question.isCustom && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Custom Question?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{question.label}" and any sub-questions. This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(question.id)}>Yes, Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
             {question.subQuestions && question.subQuestions.length > 0 && (
                <div className="pl-12 pt-2 space-y-2">
                    {question.subQuestions.map(subQ => (
                         <HrSubQuestionItem
                            key={subQ.id}
                            question={subQ}
                            level={0}
                            parentId={question.id}
                            onToggleActive={onToggleActive}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                         />
                    ))}
                </div>
            )}
        </div>
    );
}

const findAndModifyQuestion = (questions: Question[], id: string, modifyFn: (q: Question, collection?: Question[]) => any): Question[] => {
    let modified = false;
    const newQuestions = JSON.parse(JSON.stringify(questions));

    const traverse = (qs: Question[], parentId?: string): Question[] => {
        for (let i = 0; i < qs.length; i++) {
            let q = qs[i];
            if (q.id === id) {
                const result = modifyFn(q, qs);
                if (result === 'DELETE') {
                    qs.splice(i, 1);
                } else if (result) {
                    qs[i] = result;
                }
                modified = true;
                return qs;
            }
            if (q.subQuestions) {
                const newSubQuestions = traverse(q.subQuestions, q.id);
                if (modified) {
                    q.subQuestions = newSubQuestions;
                    return qs;
                }
            }
        }
        return qs;
    };

    return traverse(newQuestions);
};

function HrFormEditor() {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { 
        getAllCompanyConfigs, 
        saveCompanyConfig, 
        masterQuestions, 
        isLoading: isUserDataLoading, 
        companyAssignmentForHr,
        getCompanyConfig, 
    } = useUserData();
    
    const companyName = auth?.companyName;
    const [orderedSections, setOrderedSections] = useState<HrOrderedSection[]>([]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isNewCustom, setIsNewCustom] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    useEffect(() => {
        if (companyName && !isUserDataLoading && Object.keys(masterQuestions).length > 0) {
            const questionTree = getCompanyConfig(companyName, false);
            const companyData = getAllCompanyConfigs()[companyName] as CompanyConfig | undefined;
            const companyQuestionOrder = companyData?.questionOrderBySection || {};

            const sectionsMap: Record<string, Question[]> = {};
            questionTree.forEach(q => {
                if (!q.section) return;
                if (!sectionsMap[q.section]) sectionsMap[q.section] = [];
                sectionsMap[q.section].push(q);
            });
            
            const masterSectionOrder = [...new Set(getDefaultQuestions().filter(q => !q.parentId).map(q => q.section))];
            Object.keys(sectionsMap).forEach(s => {
                if (!masterSectionOrder.includes(s)) masterSectionOrder.push(s);
            });

            const sections = masterSectionOrder.map(sectionName => {
                const questionsInSection = sectionsMap[sectionName];
                if (!questionsInSection || questionsInSection.length === 0) return null;

                const savedOrder = companyQuestionOrder[sectionName] || [];
                const currentIds = new Set(questionsInSection.map(q => q.id));
                let orderedIds = savedOrder.filter(id => currentIds.has(id));
                const orderedIdsSet = new Set(orderedIds);
                
                questionsInSection.forEach(q => {
                    if (!orderedIdsSet.has(q.id)) {
                         orderedIds.push(q.id);
                    }
                });
                
                const questionsForSection = orderedIds.map(id => questionsInSection.find(q => q.id === id)).filter(Boolean) as Question[];
                return { id: sectionName, questions: questionsForSection };
            }).filter((s): s is HrOrderedSection => s !== null);

            setOrderedSections(sections);
        }
    }, [companyName, isUserDataLoading, getCompanyConfig, getAllCompanyConfigs, masterQuestions]);

    const handleSaveConfig = () => {
        if (!companyName) return;

        const companyOverrides: Record<string, Partial<Question>> = {};
        const customQuestions: Record<string, Question> = {};
        const questionOrderBySection: Record<string, string[]> = {};

        const processQuestionForSave = (q: Question) => {
            if (q.isCustom) {
                customQuestions[q.id] = q;
            } else {
                const masterQ = masterQuestions[q.id];
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
                    if (hasChanged) companyOverrides[q.id] = override;
                }
            }
            q.subQuestions?.forEach(processQuestionForSave);
        };

        orderedSections.forEach(section => {
            questionOrderBySection[section.id] = section.questions.map(q => q.id);
            section.questions.forEach(processQuestionForSave);
        });
        
        const currentConfig = getAllCompanyConfigs()[companyName] || {};
        const newConfig: CompanyConfig = {
            ...currentConfig,
            questions: companyOverrides,
            customQuestions,
            questionOrderBySection,
        };

        saveCompanyConfig(companyName, newConfig);
        toast({ title: "Configuration Saved", description: `Settings for ${companyName} have been updated.` });
    };

    const handleToggleQuestion = (questionId: string, parentId?: string) => {
        setOrderedSections(prev => {
            const newSections = JSON.parse(JSON.stringify(prev));
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
            return newSections;
        });
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

    const findQuestion = (sections: HrOrderedSection[], questionId: string): Question | null => {
        for (const section of sections) {
            const queue: Question[] = [...section.questions];
            while(queue.length > 0) {
                const q = queue.shift()!;
                if (q.id === questionId) return q;
                if(q.subQuestions) queue.push(...q.subQuestions);
            }
        }
        return null;
    }
    
    const handleDeleteCustom = (questionId: string) => {
        setOrderedSections(prev => {
            const newSections = JSON.parse(JSON.stringify(prev));
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
            return newSections;
        });
        toast({ title: "Custom Question Removed", description: "Remember to save your changes." });
    };

    const handleSaveEdit = () => {
        if (!currentQuestion) return;

        let newQuestion = { ...currentQuestion, lastUpdated: new Date().toISOString() } as Question;

        if (isNewCustom) {
            if (!companyName || !newQuestion.label || (!newQuestion.parentId && !newQuestion.section)) {
                toast({ title: "Missing Fields", description: "Label and Section are required.", variant: "destructive" });
                return;
            }
             if(newQuestion.parentId && !newQuestion.triggerValue) {
                toast({ title: "Missing Trigger", description: "Sub-questions must have a trigger value.", variant: "destructive" });
                return;
            }

            const customQuestionPrefix = `${companyName.toLowerCase().replace(/\s+/g, '-')}-custom-`;
            const allCustomIds = Object.keys(getAllCompanyConfigs()[companyName]?.customQuestions || {});
            let newIdNumber = 1;
            if (allCustomIds.length > 0) {
                const highestNumber = Math.max(0, ...allCustomIds.map(id => {
                    const numPart = id.replace(customQuestionPrefix, '');
                    return parseInt(numPart, 10) || 0;
                }));
                newIdNumber = highestNumber + 1;
            }
            newQuestion.id = `${customQuestionPrefix}${newIdNumber}`;
            
            if (newQuestion.parentId) {
                setOrderedSections(prev => {
                    const newSections = JSON.parse(JSON.stringify(prev));
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
                    return newSections;
                });
            } else {
                 setOrderedSections(prev => {
                    const newSections = JSON.parse(JSON.stringify(prev));
                    let section = newSections.find((s: HrOrderedSection) => s.id === newQuestion.section);
                    if (section) {
                        section.questions.push(newQuestion);
                    } else {
                        newSections.push({ id: newQuestion.section!, questions: [newQuestion] });
                    }
                    return newSections;
                });
            }
        } else { 
             setOrderedSections(prev => {
                const newSections = JSON.parse(JSON.stringify(prev));
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
                return newSections;
            });
        }
        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const sensors = useSensors( useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }) );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        let activeSectionIndex = -1;
        let overSectionIndex = -1;

        orderedSections.forEach((section, index) => {
            if (section.questions.some(q => q.id === activeId)) activeSectionIndex = index;
            if (section.questions.some(q => q.id === overId)) overSectionIndex = index;
        });

        if (activeSectionIndex === -1 || overSectionIndex === -1 || activeSectionIndex !== overSectionIndex) {
            return;
        }

        setOrderedSections(prevSections => {
            const newSections = [...prevSections];
            const section = newSections[activeSectionIndex];
            const oldIndex = section.questions.findIndex(q => q.id === activeId);
            const newIndex = section.questions.findIndex(q => q.id === overId);
            if (oldIndex !== -1 && newIndex !== -1) {
                section.questions = arrayMove(section.questions, oldIndex, newIndex);
            }
            return newSections;
        });
    }
    
    const masterQuestionForEdit = currentQuestion && !currentQuestion.isCustom && masterQuestions ? masterQuestions[currentQuestion.id!] : null;
    const hasUpdateForCurrentQuestion = masterQuestionForEdit && currentQuestion?.lastUpdated && masterQuestionForEdit.lastUpdated && new Date(masterQuestionForEdit.lastUpdated) > new Date(currentQuestion.lastUpdated);
    const availableSections = useMemo(() => [...new Set(Object.values(masterQuestions || {}).filter(q => !q.parentId).map(q => q.section))], [masterQuestions]);

    if (isUserDataLoading || companyAssignmentForHr === undefined) {
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
                    <h1 className="font-headline text-3xl font-bold">Assessment Question Editor</h1>
                    <p className="text-muted-foreground">Manage the assessment form for <span className="font-bold">{companyName}</span>.</p>
                </div>
                <Card>
                    <CardHeader><CardTitle>Manage Questions</CardTitle><CardDescription>Enable, disable, or edit questions. Drag and drop to reorder. Questions marked with <Star className="inline h-4 w-4 text-amber-500"/> are custom to your company.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            {orderedSections.map(({ id: section, questions: sectionQuestions }) => (
                                <div key={section}>
                                    <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                    <SortableContext items={sectionQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {sectionQuestions.map((question) => {
                                                const masterQ = masterQuestions[question.id];
                                                const hasBeenUpdated = masterQ && question.lastUpdated && masterQ.lastUpdated && new Date(masterQ.lastUpdated) > new Date(question.lastUpdated);
                                                return (
                                                    <HrSortableQuestionItem
                                                        key={question.id}
                                                        question={question}
                                                        onToggleActive={handleToggleQuestion}
                                                        onEdit={handleEditClick}
                                                        onDelete={handleDeleteCustom}
                                                        onAddSub={handleAddNewCustomClick}
                                                        hasBeenUpdated={hasBeenUpdated}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </SortableContext>
                                    <Separator className="my-6" />
                                </div>
                            ))}
                        </DndContext>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button variant="outline" onClick={() => handleAddNewCustomClick()}><PlusCircle className="mr-2" /> Add Custom Question</Button>
                    </CardFooter>
                </Card>
                 <Button onClick={handleSaveConfig} className="w-full">Save Configuration for {companyName}</Button>
            </div>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{isNewCustom ? 'Add Custom Question' : 'Edit Question'}</DialogTitle><DialogDescription>{isNewCustom ? 'Create a new question for your company.' : 'Modify the question text, answer options, and default value.'}</DialogDescription></DialogHeader>
                    {currentQuestion && (
                        <div className="space-y-6 py-4">
                            {hasUpdateForCurrentQuestion && masterQuestionForEdit && (
                                <Alert variant="default" className="bg-primary/5 border-primary/50"><BellDot className="h-4 w-4 !text-primary" /><AlertTitle>Update Available</AlertTitle><AlertDescription className="space-y-2">The master version of this question has changed. You can apply updates.<div className="text-xs space-y-1 pt-2"><p><strong className="text-foreground">New Text:</strong> {masterQuestionForEdit.label}</p>{masterQuestionForEdit.options && <p><strong className="text-foreground">New Options:</strong> {masterQuestionForEdit.options.join(', ')}</p>}</div><Button size="sm" variant="outline" className="mt-2" onClick={() => { setCurrentQuestion({ ...currentQuestion, label: masterQuestionForEdit.label, options: masterQuestionForEdit.options, lastUpdated: masterQuestionForEdit.lastUpdated }); toast({ title: "Updates Applied" }); }}><Copy className="mr-2 h-3 w-3" /> Apply Updates</Button></AlertDescription></Alert>
                            )}
                            <div className="space-y-2"><Label htmlFor="question-label">Question Text</Label><Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion({ ...currentQuestion, label: e.target.value })}/></div>
                            {currentQuestion.parentId && (
                                <div className="space-y-2"><Label htmlFor="trigger-value">Trigger Value</Label><Input id="trigger-value" value={currentQuestion.triggerValue || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, triggerValue: e.target.value })} placeholder="e.g., Yes"/><p className="text-xs text-muted-foreground">The answer from the parent question that will show this question.</p></div>
                            )}
                            {currentQuestion.isCustom && !currentQuestion.parentId && (
                                <div className="space-y-2"><Label htmlFor="question-section">Section</Label><Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, section: v as any}))} value={currentQuestion.section || ''}><SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger><SelectContent>{availableSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                            )}
                             {currentQuestion.isCustom && (
                                <div className="space-y-2"><Label htmlFor="question-type">Question Type</Label><Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, type: v as any, options: [] }))} value={currentQuestion.type}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="select">Select</SelectItem><SelectItem value="radio">Radio</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem><SelectItem value="date">Date</SelectItem></SelectContent></Select></div>
                            )}
                            {(currentQuestion.type === 'select' || currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                                <div className="space-y-2"><Label htmlFor="question-options">Answer Options (one per line)</Label><Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, options: e.target.value.split('\n') })} rows={currentQuestion.options?.length || 3}/></div>
                            )}
                             <div className="space-y-2"><Label htmlFor="default-value">Default Value</Label><Input id="default-value" value={Array.isArray(currentQuestion.defaultValue) ? currentQuestion.defaultValue.join(',') : currentQuestion.defaultValue || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, defaultValue: e.target.value })}/><p className="text-xs text-muted-foreground">For checkboxes, separate multiple default values with a comma.</p></div>
                        </div>
                    )}
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSaveEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// #####################################
// #         ADMIN FORM EDITOR         #
// #####################################

interface OrderedSection {
    id: string;
    questions: Question[];
}

function AdminSubQuestionItem({ question, level, onEdit, onDelete, onAddSubQuestion }: { question: Question, level: number, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSubQuestion: (parentId: string) => void }) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2 group bg-muted/50 p-2 rounded-md" style={{ marginLeft: `${level * 1.5}rem`}}>
                <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                {question.triggerValue && <Badge variant="outline" className="text-xs">On: {question.triggerValue}</Badge>}
                <div className="flex items-center">
                    {canHaveSubquestions && (
                         <Button variant="ghost" size="sm" onClick={() => onAddSubQuestion(question.id)}><PlusCircle className="h-4 w-4 mr-2" /> Sub</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Sub-Question?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete "{question.label}" and any of its own sub-questions. This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(question.id)}>Yes, Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
             {question.subQuestions && question.subQuestions.length > 0 && (
                <div className="space-y-2">
                    {question.subQuestions.map(subQ => (
                        <AdminSubQuestionItem
                            key={subQ.id}
                            question={subQ}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSubQuestion={onAddSubQuestion}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


function AdminSortableQuestionItem({ question, onEdit, onDelete, onAddSubQuestion }: { question: Question, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSubQuestion: (parentId: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div ref={setNodeRef} style={style} className="bg-background rounded-lg my-1">
            <div className="flex items-center space-x-3 group p-2">
                <div {...attributes} {...listeners} className="p-2 cursor-grab text-muted-foreground"><GripVertical className="h-5 w-5" /></div>
                <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                <div className="flex items-center">
                    {canHaveSubquestions && <Button variant="ghost" size="sm" onClick={() => onAddSubQuestion(question.id)}><PlusCircle className="mr-2 h-4 w-4"/>Sub</Button>}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete "{question.label}" and ALL its sub-questions. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(question.id)}>Yes, Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
             {question.subQuestions && question.subQuestions.length > 0 && (
                <div className="pl-12 pt-2 space-y-2">
                     {question.subQuestions.map(subQ => (
                        <AdminSubQuestionItem 
                            key={subQ.id} 
                            question={subQ}
                            level={0}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSubQuestion={onAddSubQuestion}
                         />
                    ))}
                </div>
            )}
        </div>
    );
}

function SortableSection({ section, onEditQuestion, onDeleteQuestion, onAddSubQuestion }: {
    section: OrderedSection;
    onEditQuestion: (question: Question) => void;
    onDeleteQuestion: (questionId: string) => void;
    onAddSubQuestion: (parentId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style}>
            <div className="flex items-center space-x-2" >
                <div {...attributes} {...listeners} className="p-2 cursor-grab text-muted-foreground"><GripVertical /></div>
                <h3 className="font-semibold text-lg">{section.id}</h3>
            </div>
            <div className="pl-8 space-y-2 py-2">
                <SortableContext items={section.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {section.questions.map(question => (
                        <AdminSortableQuestionItem
                            key={question.id}
                            question={question}
                            onEdit={onEditQuestion}
                            onDelete={onDeleteQuestion}
                            onAddSubQuestion={onAddSubQuestion}
                        />
                    ))}
                </SortableContext>
            </div>
            <Separator className="my-6" />
        </div>
    );
}

function AdminFormEditor() {
    const { toast } = useToast();
    const { masterQuestions, saveMasterQuestions } = useUserData();
    const [orderedSections, setOrderedSections] = useState<OrderedSection[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");

    const updateOrderedSections = useCallback((rootQuestions: Question[]) => {
        const sectionsMap: Record<string, Question[]> = {};
        const questionOrderMap: Record<string, string[]> = {};
    
        // Group questions by section
        rootQuestions.forEach(q => {
            const sectionName = q.section || 'Uncategorized';
            if (!sectionsMap[sectionName]) {
                sectionsMap[sectionName] = [];
            }
            sectionsMap[sectionName].push(q);
        });

        // Use a stable master order, adding any new sections at the end
        const defaultQuestions = getDefaultQuestions().filter(q => !q.parentId);
        const masterSectionOrder = [...new Set(defaultQuestions.map(q => q.section))];
        Object.keys(sectionsMap).forEach(s => {
            if (!masterSectionOrder.includes(s)) masterSectionOrder.push(s);
        });

        const sections = masterSectionOrder.map(sectionName => {
            const questionsInSection = sectionsMap[sectionName];
            if (!questionsInSection) return null;
            return { id: sectionName, questions: questionsInSection };
        }).filter((s): s is OrderedSection => s !== null);

        setOrderedSections(sections);
    }, []);

    useEffect(() => {
        if (Object.keys(masterQuestions).length > 0) {
            const rootQuestions = buildQuestionTreeFromMap(masterQuestions);
            updateOrderedSections(rootQuestions);
        }
    }, [masterQuestions, updateOrderedSections]);

    const handleSaveConfig = () => {
        const newQuestions: Record<string, Question> = {};
        
        const processQuestion = (q: Question, sectionId: string) => {
            const { subQuestions, ...rest } = q;
            newQuestions[q.id] = { ...rest, section: sectionId };
            if (q.subQuestions) {
                q.subQuestions.forEach(sq => processQuestion(sq, sectionId));
            }
        };

        orderedSections.forEach(section => {
            section.questions.forEach(question => {
                processQuestion(question, section.id);
            });
        });

        saveMasterQuestions(newQuestions);
        toast({ title: "Master Configuration Saved" });
    };

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question }); setIsNewQuestion(false); setIsEditing(true); setIsCreatingNewSection(false); setNewSectionName("");
    };
    
    const handleAddNewClick = (parentId?: string) => {
        let section = '';
        if(parentId) {
            const parent = findQuestionById(orderedSections, parentId);
            if(parent) section = parent.section;
        } else {
            section = orderedSections[0]?.id || '';
        }
        setCurrentQuestion({ parentId, id: '', label: '', section, type: 'text', isActive: true, options: [] });
        setIsNewQuestion(true); setIsEditing(true); setIsCreatingNewSection(false); setNewSectionName("");
    };
    
    const findQuestionById = (sections: OrderedSection[], id: string): Question | null => {
        for(const section of sections) {
            const queue: Question[] = [...section.questions];
            while(queue.length > 0) {
                const q = queue.shift()!;
                if (q.id === id) return q;
                if(q.subQuestions) queue.push(...q.subQuestions);
            }
        }
        return null;
    }


    const handleDeleteClick = (questionId: string) => {
        let newMaster = JSON.parse(JSON.stringify(masterQuestions));
        
        const deleteRecursive = (idToDelete: string) => {
            const questionToDelete = newMaster[idToDelete];
            if (!questionToDelete) return;
            
            Object.values(newMaster).forEach((q: any) => {
                if (q.parentId === idToDelete) {
                    deleteRecursive(q.id);
                }
            });
            
            delete newMaster[idToDelete];
        }

        deleteRecursive(questionId);
        
        saveMasterQuestions(newMaster);
        toast({ title: "Question Deleted" });
    };

    const handleSaveEdit = () => {
        if (!currentQuestion) return;
        let finalQuestion = { ...currentQuestion, lastUpdated: new Date().toISOString() } as Question;
        if (isCreatingNewSection) {
            if (!newSectionName.trim()) { toast({ title: "New Section Required", variant: "destructive" }); return; }
            finalQuestion.section = newSectionName.trim();
        }
        if (!finalQuestion.id && isNewQuestion) finalQuestion.id = finalQuestion.label.toLowerCase().replace(/\s+/g, '-').replace(/[?]/g, '');
        if (!finalQuestion.id || (!finalQuestion.section && !finalQuestion.parentId)) { toast({ title: "ID and Section/Parent are required.", variant: "destructive" }); return; }
        
        const newMaster = JSON.parse(JSON.stringify(masterQuestions));
        
        newMaster[finalQuestion.id] = { ...newMaster[finalQuestion.id], ...finalQuestion };
       
        saveMasterQuestions(newMaster);
        setIsEditing(false); setCurrentQuestion(null); setIsCreatingNewSection(false); setNewSectionName("");
    };

    const findQuestionInMap = (map: Record<string, Question>, id: string): Question | null => {
        return map[id] || null;
    }

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
    
        const activeId = String(active.id);
        const overId = String(over.id);
    
        setOrderedSections((sections) => {
            const newSections = JSON.parse(JSON.stringify(sections));
    
            const isSectionDrag = newSections.some(s => s.id === activeId);
    
            if (isSectionDrag) {
                const overIsSection = newSections.some(s => s.id === overId);
                if (overIsSection) {
                    const activeIndex = newSections.findIndex(s => s.id === activeId);
                    const overIndex = newSections.findIndex(s => s.id === overId);
                    return arrayMove(newSections, activeIndex, overIndex);
                }
            } else { // It's a question drag
                let activeSectionIndex = -1;
                let overSectionIndex = -1;
                let oldItemIndex = -1;
                let newItemIndex = -1;
                
                newSections.forEach((section, sIndex) => {
                    const qIndex = section.questions.findIndex(q => q.id === activeId);
                    if (qIndex !== -1) {
                        activeSectionIndex = sIndex;
                        oldItemIndex = qIndex;
                    }
                    const oIndex = section.questions.findIndex(q => q.id === overId);
                     if (oIndex !== -1) {
                        overSectionIndex = sIndex;
                        newItemIndex = oIndex;
                    }
                });

                if (activeSectionIndex !== -1 && overSectionIndex !== -1 && activeSectionIndex === overSectionIndex) {
                    // Dragging within the same section
                    const section = newSections[activeSectionIndex];
                    section.questions = arrayMove(section.questions, oldItemIndex, newItemIndex);
                    return newSections;
                }
            }
            
            return sections;
        });
    }

    const existingSections = [...new Set(Object.values(masterQuestions).filter(q=>!q.parentId).map(q => q.section))];

    return (
        <div className="p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-2"><h1 className="font-headline text-3xl font-bold">Master Question Editor</h1><p className="text-muted-foreground">Add, edit, or delete the default questions available to all companies. Drag and drop to reorder.</p></div>
            <Card>
                <CardHeader><CardTitle>Master Question List</CardTitle><CardDescription>These changes will become the new defaults for all company configurations.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={orderedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {orderedSections.map(section => (
                                <SortableSection key={section.id} section={section} onEditQuestion={handleEditClick} onDeleteQuestion={handleDeleteClick} onAddSubQuestion={handleAddNewClick} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </CardContent>
                <CardFooter className="border-t pt-6"><Button variant="outline" onClick={() => handleAddNewClick()}><PlusCircle className="mr-2" />Add New Question</Button></CardFooter>
            </Card>
            <Button onClick={handleSaveConfig} className="w-full">Save Master Configuration</Button>
            <Dialog open={isEditing} onOpenChange={setIsEditing}><DialogContent>
                <DialogHeader><DialogTitle>{isNewQuestion ? 'Add New Question' : 'Edit Question'}</DialogTitle></DialogHeader>
                {currentQuestion && (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2"><Label htmlFor="question-id">Question ID</Label><Input id="question-id" placeholder="kebab-case-unique-id" value={currentQuestion.id || ''} onChange={(e) => setCurrentQuestion(q => ({ ...q, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} disabled={!isNewQuestion}/><p className="text-xs text-muted-foreground">{isNewQuestion ? "Use a unique, kebab-case ID." : "ID cannot be changed after creation."}</p></div>
                        <div className="space-y-2"><Label htmlFor="question-label">Question Text</Label><Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion(q => ({ ...q, label: e.target.value }))}/></div>
                        {currentQuestion.parentId && (
                            <div className="space-y-2"><Label htmlFor="trigger-value">Trigger Value</Label><Input id="trigger-value" value={currentQuestion.triggerValue || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, triggerValue: e.target.value })} placeholder="e.g., Yes"/><p className="text-xs text-muted-foreground">The answer from the parent question that will show this question.</p></div>
                        )}
                        {!currentQuestion.parentId && <div className="space-y-2"><Label htmlFor="question-section">Section</Label><Select onValueChange={(v) => { if (v === 'CREATE_NEW') { setIsCreatingNewSection(true); setCurrentQuestion(q => ({ ...q, section: '' })); } else { setIsCreatingNewSection(false); setCurrentQuestion(q => ({ ...q, section: v as any})); } }} value={isCreatingNewSection ? 'CREATE_NEW' : currentQuestion.section || ''}><SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger><SelectContent>{existingSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}<Separator className="my-1" /><SelectItem value="CREATE_NEW">Create new section...</SelectItem></SelectContent></Select></div>}
                        {isCreatingNewSection && (<div className="space-y-2"><Label htmlFor="new-section-name">New Section Name</Label><Input id="new-section-name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Enter the new section name" /></div>)}
                        <div className="space-y-2"><Label htmlFor="question-type">Question Type</Label><Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, type: v as any, options: [] }))} value={currentQuestion.type}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="select">Select</SelectItem><SelectItem value="radio">Radio</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem><SelectItem value="date">Date</SelectItem></SelectContent></Select></div>
                        {(currentQuestion.type === 'select' || currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (<div className="space-y-2"><Label htmlFor="question-options">Answer Options (one per line)</Label><Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion(q => ({...q, options: e.target.value.split('\n')}))} rows={currentQuestion.options?.length || 3}/></div>)}
                    </div>
                )}
                <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSaveEdit}>Save Changes</Button></DialogFooter>
            </DialogContent></Dialog>
        </div></div>
    );
}
