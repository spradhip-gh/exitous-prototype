
'use client';
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyConfig, Question } from "@/hooks/use-user-data.tsx";
import { getDefaultQuestions } from "@/lib/questions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, BellDot, PlusCircle, Trash2, Copy, ShieldAlert, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";


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

interface HrOrderedSection {
    id: string;
    questions: Question[];
}

function HrSortableQuestionItem({ question, onToggleActive, onEdit, onDelete }: { question: Question, onToggleActive: () => void, onEdit: () => void, onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
        id: question.id,
        disabled: !question.isCustom
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const masterQ = getDefaultQuestions().find(q => q.id === question.id);
    const hasBeenUpdated = masterQ && question.lastUpdated && masterQ.lastUpdated && new Date(masterQ.lastUpdated) > new Date(question.lastUpdated);

    return (
        <div ref={setNodeRef} style={style} className="flex items-center space-x-2 group bg-background rounded-lg pr-2">
            <div {...attributes} {...listeners} className={cn("p-2 text-muted-foreground", question.isCustom ? "cursor-grab" : "cursor-not-allowed", !question.isCustom && "opacity-50")}>
                <GripVertical className="h-5 w-5" />
            </div>
             <div className="flex-shrink-0 w-8 flex items-center justify-center">
                 {hasBeenUpdated && !question.isCustom && <BellDot className="h-4 w-4 text-primary flex-shrink-0" />}
             </div>
            <Checkbox id={question.id} checked={question.isActive} onCheckedChange={onToggleActive} />
            <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
            <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                {question.isCustom && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Custom Question?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the question "{question.label}". This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete}>Yes, Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
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
        companyAssignmentForHr 
    } = useUserData();
    
    const companyName = auth?.companyName;
    const [allQuestions, setAllQuestions] = useState<Record<string, Question>>({});
    const [orderedSections, setOrderedSections] = useState<HrOrderedSection[]>([]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isNewCustom, setIsNewCustom] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    useEffect(() => {
        if (companyName && !isUserDataLoading) {
            const allConfigs = getAllCompanyConfigs();
            const companyData = allConfigs[companyName] as CompanyConfig | undefined;
            const companyQuestionOverrides = companyData?.questions || {};
            const companyCustomQuestions = companyData?.customQuestions || {};
            const companyQuestionOrder = companyData?.questionOrderBySection || {};

            const combinedQuestions = { ...masterQuestions };
            // Apply overrides
            Object.keys(companyQuestionOverrides).forEach(id => {
                if (combinedQuestions[id]) {
                    combinedQuestions[id] = { ...combinedQuestions[id], ...companyQuestionOverrides[id] };
                }
            });
            // Add custom questions
            Object.assign(combinedQuestions, companyCustomQuestions);
            setAllQuestions(combinedQuestions);

            // Get all sections from both master and custom questions to avoid missing any
            const allSectionsFromMaster = [...new Set(Object.values(masterQuestions).map(q => q.section))];
            const allSectionsFromCustom = [...new Set(Object.values(companyCustomQuestions).map(q => q.section))];
            const allUniqueSections = [...new Set([...allSectionsFromMaster, ...allSectionsFromCustom])];

            const sections = allUniqueSections.map(sectionName => {
                // Determine all question IDs that should be in this section
                const masterIdsInSection = Object.values(masterQuestions)
                    .filter(q => q.section === sectionName)
                    .map(q => q.id);
                const customIdsInSection = Object.keys(companyCustomQuestions)
                    .filter(id => companyCustomQuestions[id].section === sectionName);
                
                const allCurrentIdsForSection = new Set([...masterIdsInSection, ...customIdsInSection]);

                // Start with the UNIQUE saved order, filtering out any stale IDs
                const uniqueSavedOrder = [...new Set(companyQuestionOrder[sectionName] || [])];
                let orderedIds = uniqueSavedOrder.filter(id => allCurrentIdsForSection.has(id));
                
                const orderedIdsSet = new Set(orderedIds);

                // Find any new master questions (not in saved order) and add them to the top
                const newMasterIds = masterIdsInSection.filter(id => !orderedIdsSet.has(id));
                orderedIds.unshift(...newMasterIds);
                
                // Find any new custom questions and add them to the bottom
                const newCustomIds = customIdsInSection.filter(id => !orderedIdsSet.has(id));
                orderedIds.push(...newCustomIds);
                
                const questionsForSection = orderedIds.map(id => combinedQuestions[id]).filter(Boolean);
                return { id: sectionName, questions: questionsForSection };
            });

            setOrderedSections(sections.filter(s => s.questions.length > 0));
        }
    }, [companyName, isUserDataLoading, getAllCompanyConfigs, masterQuestions]);

    const handleSaveConfig = () => {
        if (!companyName) return;

        const companyOverrides: Record<string, Partial<Question>> = {};
        const customQuestions: Record<string, Question> = {};
        const questionOrderBySection: Record<string, string[]> = {};

        orderedSections.forEach(section => {
            questionOrderBySection[section.id] = section.questions.map(q => q.id);
            section.questions.forEach(q => {
                if (q.isCustom) {
                    customQuestions[q.id] = q;
                } else {
                    // Only save overrides, not the full master question
                    const masterQ = masterQuestions[q.id];
                    const override: Partial<Question> = {};
                    let hasChanged = false;
                    
                    // Fields that can be overridden
                    const fieldsToCompare: (keyof Question)[] = ['isActive', 'label', 'defaultValue', 'options'];
                    fieldsToCompare.forEach(field => {
                        if (JSON.stringify(q[field]) !== JSON.stringify(masterQ[field])) {
                            (override as any)[field] = q[field];
                            hasChanged = true;
                        }
                    });

                    if (q.lastUpdated) { override.lastUpdated = q.lastUpdated }
                    
                    if (hasChanged) {
                        companyOverrides[q.id] = override;
                    }
                }
            });
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

    const handleToggleQuestion = (questionId: string) => {
        setAllQuestions(prev => ({...prev, [questionId]: {...prev[questionId], isActive: !prev[questionId].isActive }}));
        setOrderedSections(prev => prev.map(s => ({
            ...s,
            questions: s.questions.map(q => q.id === questionId ? {...q, isActive: !q.isActive} : q)
        })));
    };
    
    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsNewCustom(false);
        setIsEditing(true);
    };

    const handleAddNewCustomClick = () => {
        setCurrentQuestion({
            id: '', // Will be auto-generated
            label: '',
            section: orderedSections[0]?.id || '',
            type: 'text',
            isActive: true,
            isCustom: true,
            options: [],
        });
        setIsNewCustom(true);
        setIsEditing(true);
    };
    
    const handleDeleteCustom = (questionId: string) => {
        setAllQuestions(prev => {
            const next = {...prev};
            delete next[questionId];
            return next;
        });
        setOrderedSections(prev => prev.map(s => ({
            ...s,
            questions: s.questions.filter(q => q.id !== questionId)
        })));
        toast({ title: "Custom Question Removed", description: "Remember to save your changes." });
    };

    const handleSaveEdit = () => {
        if (!currentQuestion) return;

        if (isNewCustom) {
            if (!companyName || !currentQuestion.label || !currentQuestion.section) {
                toast({ title: "Missing Fields", description: "Label and Section are required.", variant: "destructive" });
                return;
            }

            const customQuestionPrefix = `${companyName.toLowerCase().replace(/\s+/g, '-')}-custom-`;
            const existingCustomIds = Object.keys(allQuestions).filter(id => id.startsWith(customQuestionPrefix));
            let newIdNumber = 1;
            if (existingCustomIds.length > 0) {
                const highestNumber = Math.max(0, ...existingCustomIds.map(id => {
                    const numPart = id.replace(customQuestionPrefix, '');
                    return parseInt(numPart, 10) || 0;
                }));
                newIdNumber = highestNumber + 1;
            }
            const newId = `${customQuestionPrefix}${newIdNumber}`;

            const newQuestion = { ...currentQuestion, id: newId, lastUpdated: new Date().toISOString() } as Question;
            setAllQuestions(prev => ({...prev, [newQuestion.id]: newQuestion }));
            
            setOrderedSections(prev => {
                const newSections = JSON.parse(JSON.stringify(prev));
                let sectionExists = false;
                newSections.forEach((section: HrOrderedSection) => {
                    if (section.id === newQuestion.section) {
                        section.questions.push(newQuestion);
                        sectionExists = true;
                    }
                });
                if (!sectionExists) {
                    newSections.push({ id: newQuestion.section!, questions: [newQuestion] });
                }
                return newSections;
            });

        } else { // It's an update
            const updatedQuestion = { ...allQuestions[currentQuestion.id!], ...currentQuestion, lastUpdated: new Date().toISOString() } as Question;
            if (updatedQuestion.isCustom) {
                 // if section changed, move it
                const oldSectionId = allQuestions[updatedQuestion.id!]?.section;
                if (oldSectionId !== updatedQuestion.section) {
                     setOrderedSections(prev => {
                        const newSections = JSON.parse(JSON.stringify(prev));
                        const questionToMove = { ...updatedQuestion };
                        
                        // Remove from old section
                        let oldSection = newSections.find((s: HrOrderedSection) => s.id === oldSectionId);
                        if (oldSection) {
                            oldSection.questions = oldSection.questions.filter((q: Question) => q.id !== updatedQuestion.id);
                        }

                        // Add to new section
                        let newSection = newSections.find((s: HrOrderedSection) => s.id === updatedQuestion.section);
                        if (newSection) {
                            newSection.questions.push(questionToMove);
                        } else {
                            // Create new section if it doesn't exist
                            newSections.push({ id: updatedQuestion.section!, questions: [questionToMove] });
                        }
                        
                        return newSections.filter((s: HrOrderedSection) => s.questions.length > 0);
                    });
                } else {
                     setOrderedSections(prev => prev.map(s => ({
                        ...s,
                        questions: s.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
                    })));
                }
            } else {
                 setOrderedSections(prev => prev.map(s => ({
                    ...s,
                    questions: s.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
                })));
            }
             setAllQuestions(prev => ({ ...prev, [updatedQuestion.id]: updatedQuestion }));

        }

        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
    
        if (over && active.id !== over.id) {
            const activeSection = orderedSections.find(s => s.questions.some(q => q.id === active.id));
            const overSection = orderedSections.find(s => s.questions.some(q => q.id === over.id));
        
            if (activeSection && overSection && activeSection.id !== overSection.id) {
                toast({ title: "Move sections via Edit", description: "To move a question to another section, please use the Edit dialog." });
                return;
            }

            setOrderedSections((sections) => {
                const activeSectionIndex = sections.findIndex(s => s.questions.some(q => q.id === active.id));
                const overSectionIndex = sections.findIndex(s => s.questions.some(q => q.id === over.id));
        
                if (activeSectionIndex === -1 || overSectionIndex === -1 || activeSectionIndex !== overSectionIndex) {
                    return sections;
                }
                
                const newSections = [...sections];
                const activeQuestionIndex = newSections[activeSectionIndex].questions.findIndex(q => q.id === active.id);
                const overQuestionIndex = newSections[overSectionIndex].questions.findIndex(q => q.id === over.id);
                
                newSections[activeSectionIndex].questions = arrayMove(newSections[activeSectionIndex].questions, activeQuestionIndex, overQuestionIndex);
                return newSections;
            });
        }
    }
    
    const masterQuestionForEdit = currentQuestion && !currentQuestion.isCustom ? masterQuestions[currentQuestion.id!] : null;
    const hasUpdateForCurrentQuestion = masterQuestionForEdit && currentQuestion?.lastUpdated && masterQuestionForEdit.lastUpdated && new Date(masterQuestionForEdit.lastUpdated) > new Date(currentQuestion.lastUpdated);
    const availableSections = useMemo(() => [...new Set(Object.values(masterQuestions).map(q => q.section))], [masterQuestions]);

    if (isUserDataLoading || companyAssignmentForHr === undefined) {
        return (
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-4xl space-y-8">
                     <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (!companyName || !companyAssignmentForHr) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader><CardTitle>No Company Assigned</CardTitle></CardHeader>
                    <CardContent><p>Your account is not assigned to a company. Please contact an administrator.</p></CardContent>
                </Card>
            </div>
        );
    }

    if ((companyAssignmentForHr.version || 'basic') === 'basic') {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert /> Pro Feature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Managing the assessment is only available in the Pro version.</p>
                        <p className="text-sm text-muted-foreground mt-2">To enable question editing, please contact sales@exitous.co to upgrade to the Pro version.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Assessment Question Editor</h1>
                    <p className="text-muted-foreground">Manage the assessment form for <span className="font-bold">{companyName}</span>.</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Questions</CardTitle>
                        <CardDescription>Enable, disable, or edit questions. Drag and drop custom questions to reorder.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            {orderedSections.map(({ id: section, questions: sectionQuestions }) => (
                                <div key={section}>
                                    <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                    <SortableContext items={sectionQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {sectionQuestions.map((question) => (
                                                <HrSortableQuestionItem
                                                    key={question.id}
                                                    question={question}
                                                    onToggleActive={() => handleToggleQuestion(question.id)}
                                                    onEdit={() => handleEditClick(question)}
                                                    onDelete={() => handleDeleteCustom(question.id)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                    <Separator className="my-6" />
                                </div>
                            ))}
                        </DndContext>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button variant="outline" onClick={handleAddNewCustomClick}>
                            <PlusCircle className="mr-2" /> Add Custom Question
                        </Button>
                    </CardFooter>
                </Card>
                 <Button onClick={handleSaveConfig} className="w-full">Save Configuration for {companyName}</Button>
            </div>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isNewCustom ? 'Add Custom Question' : 'Edit Question'}</DialogTitle>
                        <DialogDescription>
                            {isNewCustom ? 'Create a new question for your company.' : 'Modify the question text, answer options, and default value.'}
                        </DialogDescription>
                    </DialogHeader>
                    {currentQuestion && (
                        <div className="space-y-6 py-4">
                            {hasUpdateForCurrentQuestion && masterQuestionForEdit && (
                                <Alert variant="default" className="bg-primary/5 border-primary/50">
                                    <BellDot className="h-4 w-4 !text-primary" />
                                    <AlertTitle>Update Available</AlertTitle>
                                    <AlertDescription className="space-y-2">
                                        The master version of this question has changed. You can apply the updates below.
                                        <div className="text-xs space-y-1 pt-2">
                                            <p><strong className="text-foreground">New Text:</strong> {masterQuestionForEdit.label}</p>
                                            {masterQuestionForEdit.options && <p><strong className="text-foreground">New Options:</strong> {masterQuestionForEdit.options.join(', ')}</p>}
                                        </div>
                                        <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                                            setCurrentQuestion({
                                                ...currentQuestion,
                                                label: masterQuestionForEdit.label,
                                                options: masterQuestionForEdit.options,
                                                lastUpdated: masterQuestionForEdit.lastUpdated
                                            });
                                            toast({ title: "Updates Applied", description: "Remember to save your configuration." });
                                        }}><Copy className="mr-2 h-3 w-3" /> Apply Updates</Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="question-label">Question Text</Label>
                                <Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion({ ...currentQuestion, label: e.target.value })}/>
                            </div>
                            {currentQuestion.isCustom && (
                                <div className="space-y-2">
                                    <Label htmlFor="question-section">Section</Label>
                                    <Select 
                                        onValueChange={(v) => setCurrentQuestion(q => ({ ...q, section: v as any}))} 
                                        value={currentQuestion.section || ''}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                             {currentQuestion.isCustom && (
                                <div className="space-y-2">
                                <Label htmlFor="question-type">Question Type</Label>
                                <Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, type: v as any}))} value={currentQuestion.type}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="radio">Radio</SelectItem>
                                        <SelectItem value="checkbox">Checkbox</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            )}
                            {(currentQuestion.type === 'select' || currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                                <div className="space-y-2">
                                    <Label htmlFor="question-options">Answer Options (one per line)</Label>
                                    <Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, options: e.target.value.split('\n') })} rows={currentQuestion.options?.length || 3}/>
                                </div>
                            )}
                             <div className="space-y-2">
                                <Label htmlFor="default-value">Default Value</Label>
                                <Input id="default-value" value={Array.isArray(currentQuestion.defaultValue) ? currentQuestion.defaultValue.join(',') : currentQuestion.defaultValue || ''} onChange={(e) => setCurrentQuestion({ ...currentQuestion, defaultValue: e.target.value })}/>
                                <p className="text-xs text-muted-foreground">For checkboxes, separate multiple default values with a comma.</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface OrderedSection {
    id: string;
    questions: Question[];
}

function SortableQuestionItem({ question, onToggleActive, onEdit, onDelete }: { question: Question, onToggleActive: () => void, onEdit: () => void, onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center space-x-3 group bg-background rounded-lg">
            <div {...attributes} {...listeners} className="p-2 cursor-grab text-muted-foreground">
                <GripVertical className="h-5 w-5" />
            </div>
            <Checkbox id={question.id} checked={question.isActive} onCheckedChange={onToggleActive} />
            <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
            <Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
    );
}

function SortableSection({ section, onToggleQuestionActive, onEditQuestion, onDeleteQuestion }: {
    section: OrderedSection;
    onToggleQuestionActive: (questionId: string) => void;
    onEditQuestion: (question: Question) => void;
    onDeleteQuestion: (questionId: string) => void;
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
                        <SortableQuestionItem
                            key={question.id}
                            question={question}
                            onToggleActive={() => onToggleQuestionActive(question.id)}
                            onEdit={() => onEditQuestion(question)}
                            onDelete={() => onDeleteQuestion(question.id)}
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

    useEffect(() => {
        if (Object.keys(masterQuestions).length > 0) {
            const questionMap = { ...masterQuestions };
            const defaultSectionOrder = [...new Set(getDefaultQuestions().map(q => q.section))];
            const allKnownSections = [...new Set(Object.values(questionMap).map(q => q.section))];
            
            const sectionOrder = [...defaultSectionOrder];
            allKnownSections.forEach(s => {
                if (!sectionOrder.includes(s)) {
                    sectionOrder.push(s);
                }
            });

            const sections = sectionOrder.map(sectionName => {
                const questionsInSection = Object.values(questionMap).filter(q => q.section === sectionName);
                
                const defaultQuestionOrder = getDefaultQuestions().filter(q => q.section === sectionName).map(q => q.id);
                questionsInSection.sort((a, b) => {
                    const indexA = defaultQuestionOrder.indexOf(a.id);
                    const indexB = defaultQuestionOrder.indexOf(b.id);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.label.localeCompare(b.label);
                });

                return { id: sectionName, questions: questionsInSection };
            }).filter(s => s.questions.length > 0);

            setOrderedSections(sections);
        }
    }, [masterQuestions]);

    const handleSaveConfig = () => {
        const newQuestions: Record<string, Question> = {};
        orderedSections.forEach(section => {
            section.questions.forEach(question => {
                newQuestions[question.id] = { ...question, section: section.id };
            });
        });
        saveMasterQuestions(newQuestions);
        toast({ title: "Master Configuration Saved" });
    };

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsNewQuestion(false);
        setIsEditing(true);
        setIsCreatingNewSection(false);
        setNewSectionName("");
    };
    
    const handleAddNewClick = () => {
        setCurrentQuestion({
            id: '',
            label: '',
            section: '',
            type: 'text',
            isActive: true,
            options: [],
        });
        setIsNewQuestion(true);
        setIsEditing(true);
        setIsCreatingNewSection(false);
        setNewSectionName("");
    };

    const handleDeleteClick = (questionId: string) => {
        setOrderedSections(prev => prev.map(s => ({
            ...s,
            questions: s.questions.filter(q => q.id !== questionId)
        })).filter(s => s.questions.length > 0));
        toast({ title: "Question Deleted", description: "Remember to save your changes." });
    };

    const handleToggleQuestionActive = (questionId: string) => {
        setOrderedSections(prev => prev.map(s => ({
            ...s,
            questions: s.questions.map(q => q.id === questionId ? { ...q, isActive: !q.isActive } : q)
        })));
    };

    const handleSaveEdit = () => {
        if (!currentQuestion || !currentQuestion.id) {
            toast({ title: "Invalid ID", description: "Question ID cannot be empty.", variant: "destructive" });
            return;
        }
        
        const finalQuestion = { ...currentQuestion, lastUpdated: new Date().toISOString() };

        if (isCreatingNewSection) {
            if (!newSectionName.trim()) {
                toast({ title: "New Section Required", description: "Please enter a name for the new section.", variant: "destructive" });
                return;
            }
            finalQuestion.section = newSectionName.trim();
        }
        
        if (!finalQuestion.section) {
            toast({ title: "Section Required", description: "Please select or create a section for the question.", variant: "destructive" });
            return;
        }

        if (isNewQuestion && orderedSections.some(s => s.questions.some(q => q.id === currentQuestion.id))) {
            toast({ title: "Duplicate ID", description: "A question with this ID already exists.", variant: "destructive" });
            return;
        }

        setOrderedSections(prev => {
            const sections = JSON.parse(JSON.stringify(prev));
            // Remove from old position if it exists
            sections.forEach((s: OrderedSection) => {
                s.questions = s.questions.filter((q: Question) => q.id !== finalQuestion.id);
            });
            let targetSection = sections.find((s: OrderedSection) => s.id === finalQuestion.section);
            if (targetSection) {
                targetSection.questions.push(finalQuestion);
            } else {
                sections.push({ id: finalQuestion.section!, questions: [finalQuestion] });
            }
            return sections.filter((s: OrderedSection) => s.questions.length > 0 || s.id === finalQuestion.section);
        });

        setIsEditing(false);
        setCurrentQuestion(null);
        setIsCreatingNewSection(false);
        setNewSectionName("");
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const isSectionDrag = orderedSections.some(s => s.id === active.id);
        
        if (isSectionDrag) {
            setOrderedSections(items => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        } else { // It's a question drag
            const activeSection = orderedSections.find(s => s.questions.some(q => q.id === active.id));
            const overSection = orderedSections.find(s => s.questions.some(q => q.id === over.id));
            const overIsSectionHeader = orderedSections.some(s => s.id === over.id);

            if (!activeSection) return;

            if (overIsSectionHeader) { // Dropping question on a section header
                 setOrderedSections(sections => {
                    const newSections = JSON.parse(JSON.stringify(sections));
                    const activeSectionIdx = newSections.findIndex((s: OrderedSection) => s.id === activeSection.id);
                    const activeQuestionIdx = newSections[activeSectionIdx].questions.findIndex((q: Question) => q.id === active.id);
                    const [movedQuestion] = newSections[activeSectionIdx].questions.splice(activeQuestionIdx, 1);
                    const targetSectionIdx = newSections.findIndex((s: OrderedSection) => s.id === over.id);
                    newSections[targetSectionIdx].questions.push(movedQuestion);
                    return newSections.filter((s: OrderedSection) => s.questions.length > 0);
                });
            } else if (overSection) { // Dropping question on another question
                if (activeSection.id === overSection.id) { // Same section
                    setOrderedSections(sections => sections.map(s => {
                        if (s.id === activeSection.id) {
                            const oldIndex = s.questions.findIndex(q => q.id === active.id);
                            const newIndex = s.questions.findIndex(q => q.id === over.id);
                            return { ...s, questions: arrayMove(s.questions, oldIndex, newIndex) };
                        }
                        return s;
                    }));
                } else { // Different sections
                    setOrderedSections(sections => {
                        const newSections = JSON.parse(JSON.stringify(sections));
                        const activeSectionIdx = newSections.findIndex((s: OrderedSection) => s.id === activeSection.id);
                        const activeQuestionIdx = newSections[activeSectionIdx].questions.findIndex((q: Question) => q.id === active.id);
                        const [movedQuestion] = newSections[activeSectionIdx].questions.splice(activeQuestionIdx, 1);
                        
                        const overSectionIdx = newSections.findIndex((s: OrderedSection) => s.id === overSection.id);
                        const overQuestionIdx = newSections[overSectionIdx].questions.findIndex((q: Question) => q.id === over.id);
                        newSections[overSectionIdx].questions.splice(overQuestionIdx, 0, movedQuestion);

                        return newSections.filter((s: OrderedSection) => s.questions.length > 0);
                    });
                }
            }
        }
    };
    
    const existingSections = [...new Set(orderedSections.map(q => q.id))];

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Master Question Editor</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the default questions available to all companies. Drag and drop to reorder.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Master Question List</CardTitle>
                        <CardDescription>These changes will become the new defaults for all company configurations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={orderedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {orderedSections.map(section => (
                                    <SortableSection
                                        key={section.id}
                                        section={section}
                                        onToggleQuestionActive={handleToggleQuestionActive}
                                        onEditQuestion={handleEditClick}
                                        onDeleteQuestion={handleDeleteClick}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button variant="outline" onClick={handleAddNewClick}><PlusCircle className="mr-2" />Add New Question</Button>
                    </CardFooter>
                </Card>
                 <Button onClick={handleSaveConfig} className="w-full">Save Master Configuration</Button>
            </div>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isNewQuestion ? 'Add New Question' : 'Edit Question'}</DialogTitle>
                    </DialogHeader>
                    {currentQuestion && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="question-id">Question ID</Label>
                                <Input id="question-id" placeholder="kebab-case-unique-id" value={currentQuestion.id || ''} onChange={(e) => setCurrentQuestion(q => ({ ...q, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} disabled={!isNewQuestion}/>
                                {!isNewQuestion && <p className="text-xs text-muted-foreground">ID cannot be changed after creation.</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-label">Question Text</Label>
                                <Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion(q => ({ ...q, label: e.target.value }))}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-section">Section</Label>
                                <Select 
                                    onValueChange={(v) => {
                                        if (v === 'CREATE_NEW') {
                                            setIsCreatingNewSection(true);
                                            setCurrentQuestion(q => ({ ...q, section: '' }));
                                        } else {
                                            setIsCreatingNewSection(false);
                                            setCurrentQuestion(q => ({ ...q, section: v as any}));
                                        }
                                    }} 
                                    value={isCreatingNewSection ? 'CREATE_NEW' : currentQuestion.section || ''}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger>
                                    <SelectContent>
                                        {existingSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        <Separator className="my-1" />
                                        <SelectItem value="CREATE_NEW">Create new section...</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {isCreatingNewSection && (
                                <div className="space-y-2">
                                    <Label htmlFor="new-section-name">New Section Name</Label>
                                    <Input id="new-section-name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Enter the new section name" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="question-type">Question Type</Label>
                                <Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, type: v as any}))} value={currentQuestion.type}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="radio">Radio</SelectItem>
                                        <SelectItem value="checkbox">Checkbox</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {(currentQuestion.type === 'select' || currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                                <div className="space-y-2">
                                    <Label htmlFor="question-options">Answer Options (one per line)</Label>
                                    <Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion(q => ({...q, options: e.target.value.split('\n')}))} rows={currentQuestion.options?.length || 3}/>
                                </div>
                             )}
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    

    

    



