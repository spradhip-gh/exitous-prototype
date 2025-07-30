

'use client';
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { BellDot, Copy, Link, Wand2, Lock, PlusCircle, Trash2, Star, HelpCircle, Lightbulb, ListChecks, Settings, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Question, MasterTask, MasterTip, CompanyConfig, AnswerGuidance, ReviewQueueItem } from "@/hooks/use-user-data";
import { useUserData } from "@/hooks/use-user-data";
import { buildQuestionTreeFromMap } from "@/hooks/use-user-data";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import TaskForm from "../tasks/TaskForm";
import TipForm from "../tips/TipForm";
import { MultiSelectPopover } from "./GuidanceRuleForm";
import { v4 as uuidv4 } from 'uuid';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const taskCategories = ['Financial', 'Career', 'Health', 'Basics'];
const tipCategories = ['Financial', 'Career', 'Health', 'Basics'];

interface AnswerGuidanceDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    questionLabel: string;
    answer: string;
    onSaveGuidance: (answer: string, taskIds: string[], tipIds: string[], noGuidanceRequired: boolean) => void;
    onAddNewTask: (callback: (item: any) => void) => void;
    onAddNewTip: (callback: (item: any) => void) => void;
    allCompanyTasks: MasterTask[];
    allCompanyTips: MasterTip[];
    currentGuidance: AnswerGuidance;
}

function AnswerGuidanceDialog({
    isOpen, onOpenChange, questionLabel, answer,
    onSaveGuidance, onAddNewTask, onAddNewTip, allCompanyTasks, allCompanyTips,
    currentGuidance
}: AnswerGuidanceDialogProps) {

    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [selectedTips, setSelectedTips] = useState<string[]>([]);
    const [noGuidanceRequired, setNoGuidanceRequired] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedTasks(currentGuidance.tasks || []);
            setSelectedTips(currentGuidance.tips || []);
            setNoGuidanceRequired(currentGuidance.noGuidanceRequired || false);
        }
    }, [isOpen, currentGuidance]);


    const handleSave = () => {
        onSaveGuidance(answer, selectedTasks, selectedTips, noGuidanceRequired);
        onOpenChange(false);
    }
    
    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Set Guidance for:{" "}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="font-bold inline-block max-w-xs truncate align-bottom">"{answer}"</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{answer}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DialogTitle>
                    <DialogDescription>
                        For the question: "{questionLabel}"
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="no-guidance-required" 
                            checked={noGuidanceRequired} 
                            onCheckedChange={(checked) => setNoGuidanceRequired(!!checked)}
                        />
                        <Label htmlFor="no-guidance-required">No specific guidance required for this answer</Label>
                    </div>
                     <fieldset disabled={noGuidanceRequired} className="space-y-4">
                        <MultiSelectPopover
                            label="Tasks to Assign"
                            items={allCompanyTasks.map(t => ({id: t.id, name: t.name, category: t.category}))}
                            selectedIds={selectedTasks}
                            onSelectionChange={setSelectedTasks}
                            onAddNew={() => onAddNewTask((newTask) => setSelectedTasks(prev => [...prev, newTask.id]))}
                            categories={taskCategories}
                        />
                         <MultiSelectPopover
                            label="Tips to Show"
                            items={allCompanyTips.map(t => ({id: t.id, name: t.text, category: t.category}))}
                            selectedIds={selectedTips}
                            onSelectionChange={setSelectedTips}
                            onAddNew={() => onAddNewTip((newTip) => setSelectedTips(prev => [...prev, newTip.id]))}
                            categories={tipCategories}
                        />
                    </fieldset>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Guidance</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface EditQuestionDialogProps {
    isOpen: boolean;
    isNew: boolean;
    question: Partial<Question> | null;
    existingSections?: string[];
    onSave: (question: Partial<Question>, newSectionName?: string, suggestedEdits?: any, isAutoApproved?: boolean) => void;
    onClose: () => void;
    masterQuestionForEdit?: Question | null;
}

export default function EditQuestionDialog({
    isOpen, isNew, question, existingSections, onSave, onClose, masterQuestionForEdit
}: EditQuestionDialogProps) {
    
    // --- HOOKS ---
    const { toast } = useToast();
    const { auth } = useAuth();
    const {
        getAllCompanyConfigs,
        saveCompanyConfig,
        addReviewQueueItem,
    } = useUserData();
    
    // --- STATE ---
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [suggestedOptionsToAdd, setSuggestedOptionsToAdd] = useState<any[]>([]);
    const [suggestedOptionsToRemove, setSuggestedOptionsToRemove] = useState<string[]>([]);
    
    const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isTipFormOpen, setIsTipFormOpen] = useState(false);
    
    const [currentAnswerForGuidance, setCurrentAnswerForGuidance] = useState<string>('');
    const [currentGuidance, setCurrentGuidance] = useState<AnswerGuidance>({});

    const [answerGuidanceOverrides, setAnswerGuidanceOverrides] = useState<Record<string, AnswerGuidance>>({});
    
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | undefined>();
    
    const [newItemCallback, setNewItemCallback] = useState<((item: any) => void) | null>(null);
    
    // --- COMPUTED VALUES ---
    const { masterQuestions, masterProfileQuestions, externalResources } = useUserData();
    const isAdmin = auth?.role === 'admin';
    const isHrEditing = auth?.role === 'hr';
    const isCustomQuestion = !!question?.isCustom;
    const isSuggestionMode = isHrEditing && !isCustomQuestion;
    
    const allCompanyTasks = useMemo(() => companyConfig?.companyTasks || [], [companyConfig]);
    const allCompanyTips = useMemo(() => companyConfig?.companyTips || [], [companyConfig]);
    
    const dependencyQuestions = useMemo(() => {
        const profileQs = buildQuestionTreeFromMap(masterProfileQuestions);
        const assessmentQs = buildQuestionTreeFromMap(masterQuestions);
        return {
            profile: profileQs.filter(q => ['select', 'radio', 'checkbox'].includes(q.type)),
            assessment: assessmentQs.filter(q => ['select', 'radio', 'checkbox'].includes(q.type)),
        }
    }, [masterProfileQuestions, masterQuestions]);

    const sourceQuestionOptions = useMemo(() => {
        if (!currentQuestion?.dependencySource || !currentQuestion?.dependsOn) {
            return [];
        }
        const sourceMap = currentQuestion.dependencySource === 'profile' ? masterProfileQuestions : masterQuestions;
        return sourceMap[currentQuestion.dependsOn]?.options || [];
    }, [currentQuestion, masterProfileQuestions, masterQuestions]);

    const masterOptionsSet = useMemo(() => {
        if (!masterQuestionForEdit?.options) return new Set();
        return new Set(masterQuestionForEdit.options);
    }, [masterQuestionForEdit]);

    const hasUpdateForCurrentQuestion = masterQuestionForEdit && currentQuestion?.lastUpdated && masterQuestionForEdit.lastUpdated && new Date(masterQuestionForEdit.lastUpdated) > new Date(currentQuestion.lastUpdated);

    // --- EFFECTS ---
    useEffect(() => {
        if(auth?.companyName) {
            const config = getAllCompanyConfigs()[auth.companyName];
            setCompanyConfig(config);
             if (question?.id && config?.answerGuidanceOverrides?.[question.id]) {
                setAnswerGuidanceOverrides(config.answerGuidanceOverrides[question.id]);
            } else if (question?.answerGuidance) {
                setAnswerGuidanceOverrides(question.answerGuidance);
            } else {
                setAnswerGuidanceOverrides({});
            }
        }
    }, [auth?.companyName, getAllCompanyConfigs, isOpen, question]);

    useEffect(() => {
        if (isOpen) {
            setCurrentQuestion(question);
            setIsCreatingNewSection(false);
            setNewSectionName("");
            setSuggestedOptionsToAdd([]);
            setSuggestedOptionsToRemove([]);
        }
    }, [isOpen, question]);
    
    
    // --- CALLBACKS & HANDLERS ---
    const handleAddNewTask = useCallback((callback: (newTask: MasterTask) => void) => {
        setNewItemCallback(() => callback);
        setIsGuidanceDialogOpen(false);
        setIsTaskFormOpen(true);
    }, []);

    const handleAddNewTip = useCallback((callback: (newTip: MasterTip) => void) => {
        setNewItemCallback(() => callback);
        setIsGuidanceDialogOpen(false);
        setIsTipFormOpen(true);
    }, []);

    const handleSaveNewTask = useCallback((taskData: MasterTask) => {
        const companyName = auth?.companyName;
        const currentConfig = companyConfig;
        if (!companyName || !currentConfig) return;

        const newCompanyTasks = [...(currentConfig.companyTasks || []), taskData];
        const newConfig = { ...currentConfig, companyTasks: newCompanyTasks };
        
        saveCompanyConfig(companyName, newConfig);
        
        toast({ title: 'Task Added', description: `Task "${taskData.name}" has been added.` });
        
        if (newItemCallback) {
            newItemCallback(taskData);
        }
        
        setIsTaskFormOpen(false);
        setNewItemCallback(null);
        setIsGuidanceDialogOpen(true);
    }, [auth?.companyName, companyConfig, saveCompanyConfig, toast, newItemCallback]);

    const handleSaveNewTip = useCallback((tipData: MasterTip) => {
        const companyName = auth?.companyName;
        const currentConfig = companyConfig;
        if (!companyName || !currentConfig) return;
        
        const newCompanyTips = [...(currentConfig.companyTips || []), tipData];
        const newConfig = { ...currentConfig, companyTips: newCompanyTips };

        saveCompanyConfig(companyName, newConfig);
        
        toast({ title: 'Tip Added' });
        
        if (newItemCallback) {
            newItemCallback(tipData);
        }

        setIsTipFormOpen(false);
        setNewItemCallback(null);
        setIsGuidanceDialogOpen(true);
    }, [auth?.companyName, companyConfig, saveCompanyConfig, toast, newItemCallback]);
    
    const handleSave = useCallback(() => {
        if (!currentQuestion) return;

        // When saving, include the latest guidance overrides.
        const questionToSave = { ...currentQuestion, answerGuidance: answerGuidanceOverrides };

        if (isSuggestionMode) {
             if (suggestedOptionsToAdd.length === 0 && suggestedOptionsToRemove.length === 0 && Object.keys(answerGuidanceOverrides).length === 0) {
                toast({ title: "No Changes Suggested", description: "Please suggest an addition, removal, or guidance change.", variant: "destructive" });
                return;
            }
             const reviewItem = {
                id: `review-suggestion-${Date.now()}`,
                userEmail: auth?.email || 'unknown-hr',
                inputData: { 
                    type: 'question_edit_suggestion',
                    companyName: auth?.companyName,
                    questionId: currentQuestion.id,
                    questionLabel: currentQuestion.label,
                    suggestions: {
                        optionsToAdd: suggestedOptionsToAdd,
                        optionsToRemove: suggestedOptionsToRemove,
                        guidanceOverrides: answerGuidanceOverrides,
                    }
                },
                output: {},
                status: 'pending',
                createdAt: new Date().toISOString(),
            } as unknown as ReviewQueueItem;

            addReviewQueueItem(reviewItem);
            toast({ title: "Suggestion Submitted", description: "Your suggested changes have been sent for review."});
            onClose();
            return;
        }

        if (isCreatingNewSection && !newSectionName.trim()) {
            toast({ title: "New Section Required", variant: "destructive" });
            return;
        }
        
        onSave(questionToSave, isCreatingNewSection ? newSectionName : undefined, undefined, isHrEditing && isNew);
    }, [currentQuestion, isSuggestionMode, suggestedOptionsToAdd, suggestedOptionsToRemove, onSave, isCreatingNewSection, newSectionName, toast, answerGuidanceOverrides, isHrEditing, isNew, auth, addReviewQueueItem, onClose]);

    const handleDependsOnValueChange = useCallback((option: string, isChecked: boolean) => {
        setCurrentQuestion(prev => {
            if (!prev) return null;
            const existingValues = Array.isArray(prev.dependsOnValue) ? prev.dependsOnValue : (prev.dependsOnValue ? [prev.dependsOnValue] : []);
            let newValues: string[];
            if (isChecked) {
                newValues = [...existingValues, option];
            } else {
                newValues = existingValues.filter(v => v !== option);
            }
            return { ...prev, dependsOnValue: newValues };
        });
    }, []);
    
    const handleAddSuggestion = useCallback(() => {
        setSuggestedOptionsToAdd(prev => [...prev, { option: '' }]);
    }, []);
    
    const handleUpdateSuggestionOption = useCallback((index: number, value: string) => {
        setSuggestedOptionsToAdd(prev => prev.map((item, i) => i === index ? { ...item, option: value } : item));
    }, []);

    const handleRemoveSuggestion = useCallback((index: number) => {
        setSuggestedOptionsToAdd(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleToggleRemovalSuggestion = useCallback((option: string) => {
        setSuggestedOptionsToRemove(prev => 
            prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
        );
    }, []);
    
    const handleSaveAnswerGuidance = useCallback((answer: string, taskIds: string[], tipIds: string[], noGuidanceRequired: boolean) => {
        setAnswerGuidanceOverrides(prev => ({
            ...prev,
            [answer]: { tasks: taskIds, tips: tipIds, noGuidanceRequired }
        }));
    }, []);
    
    const openGuidanceDialog = useCallback((answer: string) => {
        setCurrentAnswerForGuidance(answer);
        setCurrentGuidance(answerGuidanceOverrides[answer] || { tasks: [], tips: [], noGuidanceRequired: false });
        setIsGuidanceDialogOpen(true);
    }, [answerGuidanceOverrides]);
    
    const isGuidanceSetForAnswer = useCallback((answer: string): boolean => {
        const guidance = answerGuidanceOverrides[answer];
        if (!guidance) return false;
        return guidance.noGuidanceRequired || (guidance.tasks && guidance.tasks.length > 0) || (guidance.tips && guidance.tips.length > 0);
    }, [answerGuidanceOverrides]);

    if (!isOpen || !currentQuestion) {
        return null;
    }

    return (
        <>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{isSuggestionMode ? 'Suggest Edits' : (isNew ? 'Add Custom Question' : 'Edit Question')}</DialogTitle>
                <DialogDescription>
                    {isSuggestionMode 
                        ? `This is a locked master question. You can suggest adding or removing answer choices, or mapping custom guidance to existing answers. Your suggestions will be sent for review.`
                        : (isNew ? 'Create a new question for your company.' : 'Modify the question text, answer options, and default value.')}
                </DialogDescription>
            </DialogHeader>

            <fieldset disabled={isSuggestionMode && !isHrEditing} className="space-y-6 py-4">
                 {isHrEditing && isCustomQuestion && (
                    <Alert variant="default" className="border-blue-300 bg-blue-50 text-blue-800">
                        <HelpCircle className="h-4 w-4 !text-blue-600"/>
                        <AlertTitle>Adding Custom Guidance</AlertTitle>
                        <AlertDescription>
                          For new custom questions or custom answers, it is important to provide guidance. Please suggest a corresponding task or tip for each new answer choice to ensure users receive relevant advice.
                        </AlertDescription>
                    </Alert>
                )}
                {hasUpdateForCurrentQuestion && masterQuestionForEdit && (
                    <Alert variant="default" className="bg-primary/5 border-primary/50">
                        <BellDot className="h-4 w-4 !text-primary" />
                        <AlertTitle>Update Available</AlertTitle>
                        <AlertDescription className="space-y-2">
                            The master version of this question has changed. You can apply updates.
                            <div className="text-xs space-y-1 pt-2">
                                <p><strong className="text-foreground">New Text:</strong> {masterQuestionForEdit.label}</p>
                                {masterQuestionForEdit.options && <p><strong className="text-foreground">New Options:</strong> {masterQuestionForEdit.options.join(', ')}</p>}
                            </div>
                            <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                                setCurrentQuestion(q => q ? { ...q, label: masterQuestionForEdit.label, options: masterQuestionForEdit.options, lastUpdated: masterQuestionForEdit.lastUpdated } : null);
                                toast({ title: "Updates Applied" });
                            }}><Copy className="mr-2 h-3 w-3" /> Apply Updates</Button>
                        </AlertDescription>
                    </Alert>
                )}

                {!isNew && (
                    <div className="space-y-2">
                        <Label htmlFor="question-id">Question ID</Label>
                        <Input id="question-id" value={currentQuestion.id || ''} disabled />
                        <p className="text-xs text-muted-foreground">ID cannot be changed after creation.</p>
                    </div>
                )}
                {isNew && (
                    <div className="space-y-2">
                        <Label htmlFor="question-id">Question ID</Label>
                        <Input id="question-id" placeholder="kebab-case-unique-id" value={currentQuestion.id || ''} onChange={(e) => setCurrentQuestion(q => q ? { ...q, id: e.target.value.toLowerCase().replace(/\s+/g, '-') } : null)} />
                        <p className="text-xs text-muted-foreground">Use a unique, kebab-case ID.</p>
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="question-label">Question Text</Label>
                    <Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion(q => q ? { ...q, label: e.target.value } : null)} />
                </div>
                
                 <div className="space-y-2">
                    <Label htmlFor="question-description">Question Tooltip (Description)</Label>
                    <Textarea id="question-description" value={currentQuestion.description || ''} onChange={(e) => setCurrentQuestion(q => q ? { ...q, description: e.target.value } : null)} placeholder="Why are we asking this? Explain what this information is used for."/>
                </div>

                {currentQuestion.parentId && (
                    <div className="space-y-2">
                        <Label htmlFor="trigger-value">Trigger Value</Label>
                        <Input id="trigger-value" value={currentQuestion.triggerValue || ''} onChange={(e) => setCurrentQuestion(q => q ? { ...q, triggerValue: e.target.value } : null)} placeholder="e.g., Yes" />
                        <p className="text-xs text-muted-foreground">The answer from the parent question that will show this question.</p>
                    </div>
                )}

                {currentQuestion.isCustom && !currentQuestion.parentId && existingSections && (
                    <div className="space-y-2">
                        <Label htmlFor="question-section">Section</Label>
                        <Select onValueChange={(v) => setCurrentQuestion(q => q ? { ...q, section: v as any } : null)} value={currentQuestion.section || ''}>
                            <SelectTrigger><SelectValue placeholder="Select a section..." /></SelectTrigger>
                            <SelectContent>{existingSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}

                {!currentQuestion.parentId && !currentQuestion.isCustom && existingSections && (
                    <div className="space-y-2">
                        <Label htmlFor="question-section">Section</Label>
                        <Select
                            onValueChange={(v) => {
                                if (v === 'CREATE_NEW') {
                                    setIsCreatingNewSection(true);
                                    setCurrentQuestion(q => q ? { ...q, section: '' } : null);
                                } else {
                                    setIsCreatingNewSection(false);
                                    setCurrentQuestion(q => q ? { ...q, section: v as any } : null);
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
                )}

                {isCreatingNewSection && (
                    <div className="space-y-2">
                        <Label htmlFor="new-section-name">New Section Name</Label>
                        <Input id="new-section-name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Enter the new section name" />
                    </div>
                )}

                {currentQuestion.isCustom && (
                    <div className="space-y-2">
                        <Label htmlFor="question-type">Question Type</Label>
                        <Select onValueChange={(v) => setCurrentQuestion(q => q ? { ...q, type: v as any, options: [] } : null)} value={currentQuestion.type}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <div className="space-y-4">
                        <Label>Answer Options & Guidance</Label>
                        
                        {(isAdmin || (isHrEditing && isCustomQuestion)) ? (
                            <div className="space-y-2">
                                {(currentQuestion.options || []).map((option, index) => (
                                     <div key={index} className="flex items-center gap-2">
                                         <Input value={option} onChange={(e) => setCurrentQuestion(q => {
                                             if (!q || !q.options) return q;
                                             const newOptions = [...q.options];
                                             newOptions[index] = e.target.value;
                                             return { ...q, options: newOptions };
                                         })} />
                                         <Button variant="outline" size="sm" onClick={() => openGuidanceDialog(option)}>
                                            <Settings className="mr-2 h-4 w-4" />Guidance {isGuidanceSetForAnswer(option) && <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>}
                                         </Button>
                                         <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setCurrentQuestion(q => q ? { ...q, options: q.options.filter((_, i) => i !== index) } : null)}><Trash2 className="h-4 w-4" /></Button>
                                     </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setCurrentQuestion(q => q ? { ...q, options: [...(q.options || []), ''] } : null)}><PlusCircle className="mr-2"/> Add Option</Button>
                            </div>
                        ) : (
                             <div className="space-y-2 rounded-md border p-4">
                                <Label>Current Answer Options</Label>
                                 {currentQuestion.options?.map(option => (
                                     <div key={option} className="flex items-center justify-between">
                                         <Label htmlFor={`remove-${option}`} className="font-normal">{option}</Label>
                                         <div className="flex items-center gap-2">
                                             <Button variant={isGuidanceSetForAnswer(option) ? 'secondary' : 'outline'} size="sm" onClick={() => openGuidanceDialog(option)}>
                                                 <Settings className="mr-2"/> Manage Guidance {isGuidanceSetForAnswer(option) && <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>}
                                             </Button>
                                             <Button size="sm" variant={suggestedOptionsToRemove.includes(option) ? "destructive" : "ghost"} className="text-destructive hover:text-destructive" onClick={() => handleToggleRemovalSuggestion(option)}>
                                                 <Trash2 className="mr-2 h-3 w-3" />
                                                 {suggestedOptionsToRemove.includes(option) ? 'Undo' : 'Suggest Removal'}
                                             </Button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        )}
                        
                        {(isSuggestionMode || (isHrEditing && isCustomQuestion)) && (
                             <div className="space-y-2">
                                <Label>Suggest New Options</Label>
                                <div className="space-y-4">
                                    {suggestedOptionsToAdd.map((suggestion, index) => (
                                        <div key={index} className="relative space-y-2 p-3 pr-10 bg-muted/50 rounded-md">
                                            <Input value={suggestion.option} onChange={(e) => handleUpdateSuggestionOption(index, e.target.value)} placeholder="New option name" />
                                            <Button variant="outline" size="sm" onClick={() => openGuidanceDialog(suggestion.option || `_new_option_${index}`)}><ListChecks className="mr-2"/> Suggest Guidance</Button>
                                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" onClick={() => handleRemoveSuggestion(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="mt-2" onClick={handleAddSuggestion}><PlusCircle className="mr-2"/> Suggest New Option</Button>
                            </div>
                        )}
                    </div>
                )}

                {'defaultValue' in currentQuestion && (
                    <div className="space-y-2">
                        <Label htmlFor="default-value">Default Value</Label>
                        <Input id="default-value" value={Array.isArray(currentQuestion.defaultValue) ? currentQuestion.defaultValue.join(',') : currentQuestion.defaultValue || ''} onChange={(e) => setCurrentQuestion(q => q ? { ...q, defaultValue: e.target.value } : null)} />
                        <p className="text-xs text-muted-foreground">For checkboxes, separate multiple default values with a comma.</p>
                    </div>
                )}
                
                <Separator />
                
                <div className="space-y-4 rounded-md border border-dashed p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Link className="text-muted-foreground"/>Conditional Logic (Optional)</h3>
                    <p className="text-xs text-muted-foreground">Only show this question if another question has a specific answer.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Source Form</Label>
                            <Select value={currentQuestion.dependencySource || ''} onValueChange={(v) => setCurrentQuestion(q => q ? { ...q, dependencySource: v as any, dependsOn: '', dependsOnValue: '' } : null)}>
                                <SelectTrigger><SelectValue placeholder="Select Source..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="profile">Profile Form</SelectItem>
                                    <SelectItem value="assessment">Assessment Form</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Source Question</Label>
                             <Select value={currentQuestion.dependsOn || ''} onValueChange={(v) => setCurrentQuestion(q => q ? { ...q, dependsOn: v as any, dependsOnValue: [] } : null)} disabled={!currentQuestion.dependencySource}>
                                <SelectTrigger><SelectValue placeholder="Select Question..." /></SelectTrigger>
                                <SelectContent>
                                    {(currentQuestion.dependencySource && dependencyQuestions[currentQuestion.dependencySource])?.map(q => (
                                        <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {sourceQuestionOptions.length > 0 && (
                        <div className="space-y-2">
                            <Label>Trigger Answer(s)</Label>
                            <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
                                {sourceQuestionOptions.map(option => {
                                    const isChecked = Array.isArray(currentQuestion.dependsOnValue) && currentQuestion.dependsOnValue.includes(option);
                                    return (
                                        <div key={option} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`trigger-${option}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => handleDependsOnValueChange(option, !!checked)}
                                            />
                                            <Label htmlFor={`trigger-${option}`} className="font-normal">{option}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">The answer(s) that will make this question appear.</p>
                        </div>
                    )}
                      <Button variant="outline" size="sm" onClick={() => setCurrentQuestion(q => q ? {...q, dependencySource: undefined, dependsOn: undefined, dependsOnValue: undefined } : null)}>Clear Logic</Button>
                </div>

                {isAdmin && !isNew && !currentQuestion.parentId && (
                    <div className="space-y-4 rounded-md border border-dashed p-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is-locked-switch" className="flex items-center gap-2 font-semibold">
                                <Lock className="text-muted-foreground" />
                                Lock this Question
                            </Label>
                            <Switch 
                                id="is-locked-switch"
                                checked={!!currentQuestion.isLocked}
                                onCheckedChange={(checked) => setCurrentQuestion(q => q ? { ...q, isLocked: checked } : null)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">When locked, HR Managers on Pro plans cannot disable or edit this question's text or options. It becomes read-only for them.</p>
                    </div>
                )}
            </fieldset>

            <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
                <Button onClick={handleSave}>
                    {isSuggestionMode ? 'Submit Suggestions for Review' : 'Save Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>

        <AnswerGuidanceDialog
            isOpen={isGuidanceDialogOpen}
            onOpenChange={setIsGuidanceDialogOpen}
            questionLabel={currentQuestion?.label || ''}
            answer={currentAnswerForGuidance}
            onSaveGuidance={handleSaveAnswerGuidance}
            onAddNewTask={handleAddNewTask}
            onAddNewTip={handleAddNewTip}
            allCompanyTasks={allCompanyTasks}
            allCompanyTips={allCompanyTips}
            currentGuidance={currentGuidance}
        />
        
        <TaskForm 
            isOpen={isTaskFormOpen}
            onOpenChange={(open) => {
                setIsTaskFormOpen(open);
                if (!open) {
                    setIsGuidanceDialogOpen(true);
                }
            }}
            onSave={handleSaveNewTask}
            task={null}
            allResources={externalResources}
        />
        <TipForm 
            isOpen={isTipFormOpen}
            onOpenChange={(open) => {
                setIsTipFormOpen(open);
                if (!open) {
                    setIsGuidanceDialogOpen(true);
                }
            }}
            onSave={handleSaveNewTip}
            tip={null}
        />
        </>
    );
}

