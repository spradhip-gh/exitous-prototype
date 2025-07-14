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
import { Pencil, BellDot, PlusCircle, Trash2, Copy, ShieldAlert, Star, ArrowUp, ArrowDown, CornerDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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

function HrQuestionItem({ question, onToggleActive, onEdit, onDelete, onAddSub, hasBeenUpdated, onMove, isFirst, isLast }: { question: Question, onToggleActive: (id: string, parentId?: string) => void, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSub: (parentId: string) => void, hasBeenUpdated: boolean, onMove: (questionId: string, direction: 'up' | 'down') => void, isFirst: boolean, isLast: boolean }) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div className={cn("p-2 rounded-lg my-1", question.isCustom ? "bg-primary/5" : "bg-background")}>
            <div className="flex items-center space-x-2 group pr-2">
                 <div className="flex flex-col w-5">
                    {question.isCustom && (
                        <>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMove(question.id, 'up')} disabled={isFirst}>
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMove(question.id, 'down')} disabled={isLast}>
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </>
                    )}
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

    const generateAndSaveConfig = useCallback((sections: HrOrderedSection[]) => {
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

        sections.forEach(section => {
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
    }, [companyName, masterQuestions, getAllCompanyConfigs, saveCompanyConfig, toast]);


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

                let savedOrder = (companyQuestionOrder[sectionName] || []).filter(id => questionsInSection.some(q => q.id === id));
                
                // If there's no saved order, create a default one
                if (savedOrder.length === 0) {
                    const defaultOrderedIds = getDefaultQuestions()
                        .filter(q => q.section === sectionName && !q.parentId)
                        .map(q => q.id);
                    savedOrder = [...defaultOrderedIds, ...questionsInSection.filter(q => q.isCustom).map(q => q.id)];
                } else {
                    // Ensure all current questions are in the order array
                    const orderedIdSet = new Set(savedOrder);
                    questionsInSection.forEach(q => {
                        if (!orderedIdSet.has(q.id)) {
                             // Find the last default question in this section and insert after it, or at the end
                            const masterIdsInSection = new Set(getDefaultQuestions().filter(q => q.section === sectionName).map(q => q.id));
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
                     // Clean up any IDs that no longer exist
                     savedOrder = savedOrder.filter(id => questionsInSection.some(q => q.id === id));
                }
                
                const questionsForSection = savedOrder
                    .map(id => questionsInSection.find(q => q.id === id))
                    .filter((q): q is Question => !!q);


                return { id: sectionName, questions: questionsForSection };
            }).filter((s): s is HrOrderedSection => s !== null);

            setOrderedSections(sections);
        }
    }, [companyName, isUserDataLoading, getCompanyConfig, getAllCompanyConfigs, masterQuestions]);

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
        generateAndSaveConfig(newSections);
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
        generateAndSaveConfig(newSections);
    };

    const handleSaveEdit = () => {
        if (!currentQuestion) return;

        let newQuestion = { ...currentQuestion, lastUpdated: new Date().toISOString() } as Question;
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
        generateAndSaveConfig(newSections);
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
                    generateAndSaveConfig(newSections);
                }
                break;
            }
        }
    };
    
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
                    <p className="text-muted-foreground">Manage the assessment form for <span className="font-bold">{companyName}</span>. Changes are saved automatically.</p>
                </div>
                <Card>
                    <CardHeader><CardTitle>Manage Questions</CardTitle><CardDescription>Enable, disable, or edit questions. Use arrows to reorder custom questions. Questions marked with <Star className="inline h-4 w-4 text-amber-500"/> are custom to your company.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        {orderedSections.map(({ id: section, questions: sectionQuestions }) => (
                            <div key={section}>
                                <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                <div className="space-y-2">
                                    {sectionQuestions.map((question, index) => {
                                        const masterQ = masterQuestions[question.id];
                                        const hasBeenUpdated = masterQ && question.lastUpdated && masterQ.lastUpdated && new Date(masterQ.lastUpdated) > new Date(question.lastUpdated);
                                        
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
            </div>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{isNewCustom ? 'Add Custom Question' : 'Edit Question'}</DialogTitle><DialogDescription>{isNewCustom ? 'Create a new question for your company.' : 'Modify the question text, answer options, and default value.'}</DialogDescription></DialogHeader>
                    {currentQuestion && (
                        <div className="space-y-6 py-4">
                            {hasUpdateForCurrentQuestion && masterQuestionForEdit && (
                                <Alert variant="default" className="bg-primary/5 border-primary/50"><BellDot className="h-4 w-4 !text-primary" /><AlertTitle>Update Available</AlertTitle><AlertDescription className="space-y-2">The master version of this question has changed. You can apply updates.<div className="text-xs space-y-1 pt-2"><p><strong className="text-foreground">New Text:</strong> {masterQuestionForEdit.label}</p>{masterQuestionForEdit.options && <p><strong className="text-foreground">New Options:</strong> {masterQuestionForEdit.options.join(', ')}</p>}</div><Button size="sm" variant="outline" className="mt-2" onClick={() => { setCurrentQuestion({ ...currentQuestion, label: masterQuestionForEdit.label, options: masterQuestionForEdit.options, lastUpdated: masterQuestionForEdit.lastUpdated }); toast({ title: "Updates Applied" }); }}><Copy className="mr-2 h-3 w-3" /> Apply Updates</Button></AlertDescription></Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="question-label">Question Text</Label>
                                <Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion({ ...currentQuestion, label: e.target.value })}/>
                            </div>
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
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="question-options">Answer Options (one per line)</Label>
                                    </div>
                                    <Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, options: e.target.value.split('\n') })} rows={currentQuestion.options?.length || 3}/>
                                </div>
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


function AdminQuestionItem({ question, onEdit, onDelete, onAddSubQuestion, onMove, isFirst, isLast }: { question: Question, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSubQuestion: (parentId: string) => void, onMove: (questionId: string, direction: 'up' | 'down') => void, isFirst: boolean, isLast: boolean }) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div className="bg-background rounded-lg my-1">
            <div className="flex items-center space-x-3 group p-2">
                <div className="flex flex-col">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMove(question.id, 'up')} disabled={isFirst}>
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMove(question.id, 'down')} disabled={isLast}>
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
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

function AdminFormEditor() {
    const { toast } = useToast();
    const { masterQuestions, saveMasterQuestions } = useUserData();
    const [orderedSections, setOrderedSections] = useState<OrderedSection[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");

    const updateOrderedSectionsAndSave = useCallback((newMaster: Record<string, Question>, showToast = true) => {
        const rootQuestions = buildQuestionTreeFromMap(newMaster);
        const sectionsMap: Record<string, Question[]> = {};
    
        const defaultQuestions = getDefaultQuestions().filter(q => !q.parentId);
        const defaultSectionOrder = [...new Set(defaultQuestions.map(q => q.section))];
        const masterQuestionOrder = [...new Set(Object.values(newMaster).filter(q=>!q.parentId).map(q => q.section))];
        const finalSectionOrder = [...defaultSectionOrder];
        masterQuestionOrder.forEach(s => {
            if (!finalSectionOrder.includes(s)) finalSectionOrder.push(s);
        });

        finalSectionOrder.forEach(s => sectionsMap[s] = []);
        rootQuestions.forEach(q => {
            const sectionName = q.section || 'Uncategorized';
            if (!sectionsMap[sectionName]) sectionsMap[sectionName] = [];
            sectionsMap[sectionName].push(q);
        });

        const sections = finalSectionOrder.map(sectionName => {
            const questionsInSection = sectionsMap[sectionName];
            return { id: sectionName, questions: questionsInSection || [] };
        }).filter((s): s is OrderedSection => s !== null);


        setOrderedSections(sections);
        saveMasterQuestions(newMaster);
        if (showToast) {
            toast({ title: "Master Configuration Saved" });
        }
    }, [saveMasterQuestions, toast]);
    
    useEffect(() => {
        if (Object.keys(masterQuestions).length > 0 && orderedSections.length === 0) {
            updateOrderedSectionsAndSave(masterQuestions, false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [masterQuestions]);

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
            Object.values(newMaster).forEach((q: any) => {
                if (q.subQuestions) {
                    q.subQuestions = q.subQuestions.filter((sub: any) => sub.id !== idToDelete);
                }
            });

        }

        deleteRecursive(questionId);
        updateOrderedSectionsAndSave(newMaster);
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
       
        updateOrderedSectionsAndSave(newMaster);

        setIsEditing(false); setCurrentQuestion(null); setIsCreatingNewSection(false); setNewSectionName("");
    };

    const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
        const newSections = JSON.parse(JSON.stringify(orderedSections));
        for (const section of newSections) {
            const index = section.questions.findIndex((q: Question) => q.id === questionId);
            if (index !== -1) {
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex >= 0 && newIndex < section.questions.length) {
                    const [movedQuestion] = section.questions.splice(index, 1);
                    section.questions.splice(newIndex, 0, movedQuestion);

                    const newMaster: Record<string, Question> = {};
                    const processQuestion = (q: Question) => {
                         const { subQuestions, ...rest } = q;
                         newMaster[q.id] = { ...rest };
                         if (subQuestions) {
                            subQuestions.forEach(sq => processQuestion(sq));
                         }
                    }

                    newSections.forEach(sec => {
                        sec.questions.forEach(q => {
                           q.section = sec.id; // ensure section is correct
                           processQuestion(q);
                        });
                    });
                    
                    updateOrderedSectionsAndSave(newMaster);
                }
                break; 
            }
        }
    };
    
    const existingSections = [...new Set(Object.values(masterQuestions).filter(q=>!q.parentId).map(q => q.section))];

    return (
        <div className="p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-2"><h1 className="font-headline text-3xl font-bold">Master Question Editor</h1><p className="text-muted-foreground">Add, edit, or delete the default questions available to all companies. Use arrows to reorder. Changes are saved automatically.</p></div>
            <Card>
                <CardHeader><CardTitle>Master Question List</CardTitle><CardDescription>These changes will become the new defaults for all company configurations.</CardDescription></CardHeader>
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
                                        isFirst={index === 0}
                                        isLast={index === section.questions.length - 1}
                                    />
                                ))}
                            </div>
                            <Separator className="my-6" />
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="border-t pt-6"><Button variant="outline" onClick={() => handleAddNewClick()}><PlusCircle className="mr-2" />Add New Question</Button></CardFooter>
            </Card>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{isNewQuestion ? 'Add New Question' : 'Edit Question'}</DialogTitle></DialogHeader>
                    {currentQuestion && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2"><Label htmlFor="question-id">Question ID</Label><Input id="question-id" placeholder="kebab-case-unique-id" value={currentQuestion.id || ''} onChange={(e) => setCurrentQuestion(q => ({ ...q, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} disabled={!isNewQuestion}/><p className="text-xs text-muted-foreground">{isNewQuestion ? "Use a unique, kebab-case ID." : "ID cannot be changed after creation."}</p></div>
                            <div className="space-y-2">
                                <Label htmlFor="question-label">Question Text</Label>
                                <Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion(q => ({ ...q, label: e.target.value }))}/>
                            </div>
                            {currentQuestion.parentId && (
                                <div className="space-y-2"><Label htmlFor="trigger-value">Trigger Value</Label><Input id="trigger-value" value={currentQuestion.triggerValue || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, triggerValue: e.target.value })} placeholder="e.g., Yes"/><p className="text-xs text-muted-foreground">The answer from the parent question that will show this question.</p></div>
                            )}
                            {!currentQuestion.parentId && <div className="space-y-2"><Label htmlFor="question-section">Section</Label><Select onValueChange={(v) => { if (v === 'CREATE_NEW') { setIsCreatingNewSection(true); setCurrentQuestion(q => ({ ...q, section: '' })); } else { setIsCreatingNewSection(false); setCurrentQuestion(q => ({ ...q, section: v as any})); } }} value={isCreatingNewSection ? 'CREATE_NEW' : currentQuestion.section || ''}><SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger><SelectContent>{existingSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}<Separator className="my-1" /><SelectItem value="CREATE_NEW">Create new section...</SelectItem></SelectContent></Select></div>}
                            {isCreatingNewSection && (<div className="space-y-2"><Label htmlFor="new-section-name">New Section Name</Label><Input id="new-section-name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Enter the new section name" /></div>)}
                            <div className="space-y-2"><Label htmlFor="question-type">Question Type</Label><Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, type: v as any, options: [] }))} value={currentQuestion.type}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="select">Select</SelectItem><SelectItem value="radio">Radio</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem><SelectItem value="date">Date</SelectItem></SelectContent></Select></div>
                            {(currentQuestion.type === 'select' || currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                                <div className="space-y-2">
                                     <div className="flex justify-between items-center">
                                        <Label htmlFor="question-options">Answer Options (one per line)</Label>
                                    </div>
                                    <Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion(q => ({...q, options: e.target.value.split('\n')}))} rows={currentQuestion.options?.length || 3}/>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSaveEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div></div>
    );
}
