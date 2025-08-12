

'use client';
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { BellDot, Copy, Link, Wand2, Lock, PlusCircle, Trash2, Star, HelpCircle, Lightbulb, ListChecks, Settings, ChevronsUpDown, Blocks, Pencil, Edit, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Question, MasterTask, MasterTip, CompanyConfig, AnswerGuidance, ReviewQueueItem, ExternalResource, GuidanceRule, Project, QuestionOverride } from "@/hooks/use-user-data";
import { useUserData } from "@/hooks/use-user-data";
import { buildQuestionTreeFromMap } from "@/hooks/use-end-user-data";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { v4 as uuidv4 } from 'uuid';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import TaskForm from '../tasks/TaskForm';
import TipForm from '../tips/TipForm';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ProjectAssignmentPopover } from "../settings/ProjectAssignmentPopover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

const taskCategories = ['Financial', 'Career', 'Health', 'Basics'];
const tipCategories = ['Financial', 'Career', 'Health', 'Basics'];

function truncateInMiddle(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    const half = Math.floor((maxLength - 3) / 2);
    return `${text.slice(0, half)}...${text.slice(text.length - half)}`;
}

function LocalMultiSelectPopover({
    label,
    items,
    selectedIds,
    onSelectionChange,
    onAddNew,
    categories,
    popoverContentWidth = "w-[300px]"
}: {
    label: string,
    items: { id: string; name: string; category: string }[],
    onSelectionChange: (newIds: string[]) => void,
    onAddNew: () => void,
    selectedIds?: string[],
    categories: string[],
    popoverContentWidth?: string
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const validSelectedIds = selectedIds || [];

    const filteredItems = useMemo(() => {
        let list = items;
        if (categoryFilter) list = list.filter(item => item.category === categoryFilter);
        if (search) list = list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
        return list;
    }, [search, items, categoryFilter]);
    
    const handleSelect = (id: string) => {
        const newSelection = validSelectedIds.includes(id)
            ? validSelectedIds.filter(currentId => currentId !== id)
            : [...validSelectedIds, id];
        onSelectionChange(newSelection);
    }
    
    const displayLabel = useMemo(() => {
        if (validSelectedIds.length === 0) return `0 selected`;
        const selectedItems = validSelectedIds.map(id => items.find(item => item.id === id)?.name).filter(Boolean);
        const fullText = selectedItems.join(', ');
        if (validSelectedIds.length <= 2) {
            return truncateInMiddle(fullText, 40);
        }
        return `${validSelectedIds.length} selected`;
    }, [validSelectedIds, items]);

    const tooltipContent = useMemo(() => {
        if (validSelectedIds.length === 0) return null;
        return validSelectedIds.map(id => items.find(item => item.id === id)?.name).filter(Boolean).join(', ');
    }, [validSelectedIds, items]);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenu open={open} onOpenChange={setOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between font-normal">
                                    <span className="truncate">{displayLabel}</span> <ChevronsUpDown className="h-4 w-4 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className={popoverContentWidth} align="start">
                                <div className="p-2">
                                     <Input placeholder={`Search...`} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
                                </div>
                                 <div className="p-2 pt-0 flex flex-wrap gap-1">
                                    <Button variant={!categoryFilter ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={() => setCategoryFilter(null)}>All</Button>
                                    {categories.map(cat => (
                                         <Button key={cat} variant={categoryFilter === cat ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={() => setCategoryFilter(cat)}>{cat}</Button>
                                    ))}
                                </div>
                                <DropdownMenuSeparator />
                                <ScrollArea className="max-h-64">
                                     {filteredItems.length > 0 ? filteredItems.map(item => (
                                        <DropdownMenuCheckboxItem key={item.id} checked={validSelectedIds.includes(item.id)} onCheckedChange={() => handleSelect(item.id)} onSelect={(e) => e.preventDefault()}>
                                            <span className="truncate" title={item.name}>{item.name}</span>
                                        </DropdownMenuCheckboxItem>
                                    )) : <p className="p-2 text-xs text-center text-muted-foreground">No items found.</p>}
                                </ScrollArea>
                                <DropdownMenuSeparator />
                                 <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAddNew(); setOpen(false); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Create new...</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipTrigger>
                    {tooltipContent && <TooltipContent><p className="max-w-xs">{tooltipContent}</p></TooltipContent>}
                 </Tooltip>
            </TooltipProvider>
            {validSelectedIds.length > 2 && <p className="text-xs text-muted-foreground pl-1">Hover to see all selections.</p>}
        </div>
    );
}

function AnswerGuidanceForm({
    guidance,
    onSave,
    onCancel,
    projects,
    allCompanyTasks,
    allCompanyTips,
    onAddNewTask,
    onAddNewTip,
}: {
    guidance: AnswerGuidance & { projectId?: string };
    onSave: (guidance: AnswerGuidance & { projectId?: string }) => void;
    onCancel: () => void;
    projects: Project[];
    allCompanyTasks: MasterTask[];
    allCompanyTips: MasterTip[];
    onAddNewTask: () => void;
    onAddNewTip: () => void;
}) {
    const [localGuidance, setLocalGuidance] = useState(guidance);
    
    useEffect(() => {
        setLocalGuidance(guidance);
    }, [guidance]);

    return (
        <div className="p-4 border rounded-md bg-muted/50 space-y-4">
             <div className="space-y-2">
                <Label>Apply Guidance To Project</Label>
                 <RadioGroup value={localGuidance.projectId || 'all'} onValueChange={(v) => setLocalGuidance(g => ({...g, projectId: v === 'all' ? undefined : v}))} disabled={!!guidance.projectId}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="guidance-all" />
                        <Label htmlFor="guidance-all">All Projects (Company Default)</Label>
                    </div>
                    {projects.map(p => (
                        <div key={p.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={p.id} id={`guidance-${p.id}`} />
                            <Label htmlFor={`guidance-${p.id}`}>{p.name}</Label>
                        </div>
                    ))}
                 </RadioGroup>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                    id="no-guidance-required" 
                    checked={localGuidance.noGuidanceRequired} 
                    onCheckedChange={(checked) => setLocalGuidance(g => ({ ...g, noGuidanceRequired: !!checked }))}
                />
                <Label htmlFor="no-guidance-required">No specific guidance required for this answer</Label>
            </div>
             <fieldset disabled={localGuidance.noGuidanceRequired} className="grid grid-cols-2 gap-4">
                <LocalMultiSelectPopover
                    label="Tasks to Assign"
                    items={allCompanyTasks.map(t => ({id: t.id, name: t.name, category: t.category}))}
                    selectedIds={localGuidance.tasks}
                    onSelectionChange={(v) => setLocalGuidance(g => ({...g, tasks: v}))}
                    onAddNew={onAddNewTask}
                    categories={taskCategories}
                    popoverContentWidth="w-full"
                />
                 <LocalMultiSelectPopover
                    label="Tips to Show"
                    items={allCompanyTips.map(t => ({id: t.id, name: t.text, category: t.category}))}
                    selectedIds={localGuidance.tips}
                    onSelectionChange={(v) => setLocalGuidance(g => ({...g, tips: v}))}
                    onAddNew={onAddNewTip}
                    categories={tipCategories}
                    popoverContentWidth="w-full"
                />
            </fieldset>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(localGuidance)}>Save Guidance</Button>
            </div>
        </div>
    )
}

interface AnswerGuidanceDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    questionLabel: string;
    answer: string;
    onSaveAllGuidance: (answer: string, allGuidance: { default: AnswerGuidance; projects: Record<string, AnswerGuidance>}) => void;
    onAddNewTask: () => void;
    onAddNewTip: () => void;
    allCompanyTasks: MasterTask[];
    allCompanyTips: MasterTip[];
    currentDefaultGuidance: AnswerGuidance;
    currentProjectGuidance: Record<string, AnswerGuidance>;
    projects: Project[];
}

function AnswerGuidanceDialog({
    isOpen, onOpenChange, questionLabel, answer,
    onSaveAllGuidance, onAddNewTask, onAddNewTip, allCompanyTasks, allCompanyTips,
    currentDefaultGuidance, currentProjectGuidance, projects
}: AnswerGuidanceDialogProps) {

    const [editingGuidance, setEditingGuidance] = useState<(AnswerGuidance & { projectId?: string }) | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    
    // Local state to hold all guidance configs for this answer
    const [localDefaultGuidance, setLocalDefaultGuidance] = useState(currentDefaultGuidance);
    const [localProjectGuidance, setLocalProjectGuidance] = useState(currentProjectGuidance);

    useEffect(() => {
        if (isOpen) {
            setLocalDefaultGuidance(currentDefaultGuidance);
            setLocalProjectGuidance(currentProjectGuidance);
        } else {
            setEditingGuidance(null);
            setIsAdding(false);
        }
    }, [isOpen, currentDefaultGuidance, currentProjectGuidance]);

    const handleSave = (guidanceToSave: AnswerGuidance & { projectId?: string }) => {
        const { projectId, ...restOfGuidance } = guidanceToSave;
        
        let newDefault = localDefaultGuidance;
        let newProjectOverrides = { ...localProjectGuidance };

        if (projectId) {
            newProjectOverrides[projectId] = restOfGuidance;
        } else {
            newDefault = restOfGuidance;
        }
        
        setLocalDefaultGuidance(newDefault);
        setLocalProjectGuidance(newProjectOverrides);

        onSaveAllGuidance(answer, { default: newDefault, projects: newProjectOverrides });
        setEditingGuidance(null);
        setIsAdding(false);
    }
    
    const handleDeleteOverride = (projectId: string) => {
        const newProjectOverrides = { ...localProjectGuidance };
        delete newProjectOverrides[projectId];
        setLocalProjectGuidance(newProjectOverrides);
        onSaveAllGuidance(answer, { default: localDefaultGuidance, projects: newProjectOverrides });
    }

    if (!isOpen) return null;

    const existingProjectIds = Object.keys(localProjectGuidance);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Set Guidance for: <span className="font-bold">"{answer}"</span>
                    </DialogTitle>
                    <DialogDescription>
                        Set default guidance and add project-specific overrides for the question: "{questionLabel}"
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                <CardTitle className="text-base">Company Default</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setEditingGuidance(localDefaultGuidance)}>
                                <Pencil className="mr-2" /> Edit
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <p className="text-xs text-muted-foreground">{localDefaultGuidance.tasks?.length || 0} tasks, {localDefaultGuidance.tips?.length || 0} tips</p>
                        </CardContent>
                    </Card>

                    {Object.entries(localProjectGuidance).map(([projectId, guidance]) => {
                        const project = projects.find(p => p.id === projectId);
                        return (
                             <Card key={projectId}>
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                     <CardTitle className="text-base">{project?.name || 'Unknown Project'}</CardTitle>
                                     <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setEditingGuidance({ ...guidance, projectId })}>
                                            <Pencil className="mr-2" /> Edit
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="mr-2" /> Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Project Override?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove the specific guidance for "{project?.name}" and it will fall back to the company default.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteOverride(projectId)}>Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                     </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">{guidance.tasks?.length || 0} tasks, {guidance.tips?.length || 0} tips</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                    
                     {isAdding && (
                        <AnswerGuidanceForm
                            guidance={{}}
                            onSave={handleSave}
                            onCancel={() => setIsAdding(false)}
                            projects={projects.filter(p => !existingProjectIds.includes(p.id))}
                            allCompanyTasks={allCompanyTasks}
                            allCompanyTips={allCompanyTips}
                            onAddNewTask={onAddNewTask}
                            onAddNewTip={onAddNewTip}
                        />
                    )}
                    
                     {editingGuidance && !isAdding && (
                        <AnswerGuidanceForm
                            guidance={editingGuidance}
                            onSave={handleSave}
                            onCancel={() => setEditingGuidance(null)}
                            projects={projects}
                            allCompanyTasks={allCompanyTasks}
                            allCompanyTips={allCompanyTips}
                            onAddNewTask={onAddNewTask}
                            onAddNewTip={onAddNewTip}
                        />
                    )}
                </div>
                <DialogFooter className="border-t pt-4">
                     {!editingGuidance && !isAdding && (
                        <Button variant="outline" onClick={() => setIsAdding(true)}><PlusCircle className="mr-2" /> Add Project Override</Button>
                    )}
                    <DialogClose asChild>
                        <Button variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface EditQuestionDialogProps {
    isNew: boolean;
    question: Partial<Question> | null;
    existingSections?: string[];
    onSave: (question: Partial<Question>, newSectionName?: string, suggestedEdits?: any, isAutoApproved?: boolean) => void;
    onClose: () => void;
    masterQuestionForEdit?: Question | null;
    onAddNewTask: (callback: (item: any) => void) => void;
    onAddNewTip: (callback: (item: any) => void) => void;
    allCompanyTasks: MasterTask[];
    allCompanyTips: MasterTip[];
    formType?: 'profile' | 'assessment';
    projects?: Project[];
}

export default function EditQuestionDialog({
    isNew, question, existingSections, onSave, onClose, masterQuestionForEdit,
    onAddNewTask, onAddNewTip, allCompanyTasks, allCompanyTips, formType, projects = []
}: EditQuestionDialogProps) {
    
    const { toast } = useToast();
    const { auth } = useAuth();
    const { addReviewQueueItem, companyConfigs } = useUserData();
    
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [optionsText, setOptionsText] = useState('');
    const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [newOption, setNewOption] = useState('');
    const [suggestedRemovals, setSuggestedRemovals] = useState<string[]>([]);
    const [suggestionReason, setSuggestionReason] = useState('');
        
    const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);
    const [currentAnswerForGuidance, setCurrentAnswerForGuidance] = useState<string>('');
        
    const { masterQuestions, masterProfileQuestions } = useUserData();
    const isAdmin = auth?.role === 'admin';
    const isHrEditing = auth?.role === 'hr';
    const isLockedMasterQuestion = !!masterQuestionForEdit?.isLocked;
    const isCustomQuestion = !!question?.isCustom;
    const isSuggestionMode = isHrEditing && isLockedMasterQuestion && !isCustomQuestion;

    const companyOverride = useMemo(() => {
        if (!auth?.companyName || !question?.id) return null;
        return companyConfigs[auth.companyName]?.questions?.[question.id];
    }, [auth?.companyName, question?.id, companyConfigs]);
        
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
    
    const hasUpdateForCurrentQuestion = masterQuestionForEdit && currentQuestion?.lastUpdated && masterQuestionForEdit.lastUpdated && new Date(masterQuestionForEdit.lastUpdated) > new Date(currentQuestion.lastUpdated);
    const currentOptions = useMemo(() => optionsText.split('\n').map(o => o.trim()).filter(Boolean), [optionsText]);

    useEffect(() => {
        setCurrentQuestion(question);
        setOptionsText(question?.options?.join('\n') || '');
        setSuggestedRemovals(companyOverride?.optionOverrides?.remove || []);
        setIsCreatingNewSection(false);
        setNewSectionName("");
        setNewOption('');
        setSuggestionReason('');
    }, [question, companyOverride]);
    
    const handleSave = useCallback(() => {
        if (!currentQuestion) return;

        let finalQuestion = { 
            ...currentQuestion,
            options: currentOptions,
            formType: currentQuestion.formType || formType
        };

        if (isSuggestionMode) {
             const suggestedOptionsToAdd = (finalQuestion.options || []).filter(opt => !(masterQuestionForEdit?.options || []).includes(opt));
             
             if (suggestedOptionsToAdd.length === 0 && suggestedRemovals.length === 0 && !finalQuestion.answerGuidance) {
                toast({ title: "No Changes Suggested", description: "Please suggest an addition, removal, or guidance mapping.", variant: "destructive" });
                return;
            }

             const reviewItem: Omit<ReviewQueueItem, 'id' | 'created_at' | 'company_id'> & { companyName?: string } = {
                user_email: auth?.email || 'unknown-hr',
                type: 'question_edit_suggestion',
                status: 'pending',
                companyName: auth?.companyName,
                change_details: {
                    questionId: currentQuestion.id,
                    questionLabel: currentQuestion.label,
                    reason: suggestionReason,
                    optionsToAdd: suggestedOptionsToAdd.map(opt => ({ option: opt, guidance: finalQuestion.answerGuidance?.[opt] })),
                    optionsToRemove: suggestedRemovals,
                },
            };
            addReviewQueueItem(reviewItem);
            toast({ title: "Suggestion Submitted", description: "Your suggested changes have been sent for review."});
            onClose();
            return;
        }

        if (isCreatingNewSection && !newSectionName.trim()) {
            toast({ title: "New Section Required", variant: "destructive" });
            return;
        }
        
        onSave(finalQuestion, isCreatingNewSection ? newSectionName : undefined);
    }, [currentQuestion, isSuggestionMode, onSave, isCreatingNewSection, newSectionName, toast, isHrEditing, isNew, auth, addReviewQueueItem, onClose, currentOptions, masterQuestionForEdit, suggestedRemovals, suggestionReason, formType]);

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
    
     const handleSaveAllGuidanceForAnswer = useCallback((answer: string, allGuidance: { default: AnswerGuidance; projects: Record<string, AnswerGuidance>}) => {
        setCurrentQuestion(prev => {
            if (!prev) return null;
            
            const newAnswerGuidance = { ...(prev.answerGuidance || {}) };
            newAnswerGuidance[answer] = allGuidance.default;

            const newProjectGuidance = { ...(prev.projectAnswerGuidance || {}) };
            if(!newProjectGuidance[answer]) newProjectGuidance[answer] = {};
            newProjectGuidance[answer] = allGuidance.projects;

            return { ...prev, answerGuidance: newAnswerGuidance, projectAnswerGuidance: newProjectGuidance };
        });
    }, []);
    
    const openGuidanceDialog = useCallback((answer: string) => {
        setCurrentAnswerForGuidance(answer);
        setIsGuidanceDialogOpen(true);
    }, []);

    const getGuidanceSummaryForAnswer = useCallback((answer: string) => {
        const summary: {scope: string, tasks: number, tips: number}[] = [];
        
        const defaultGuidance = currentQuestion?.answerGuidance?.[answer];
        if (defaultGuidance && (defaultGuidance.noGuidanceRequired || (defaultGuidance.tasks && defaultGuidance.tasks.length > 0) || (defaultGuidance.tips && defaultGuidance.tips.length > 0))) {
            summary.push({scope: 'Company Default', tasks: defaultGuidance.tasks?.length || 0, tips: defaultGuidance.tips?.length || 0});
        }
        const projectGuidances = currentQuestion?.projectAnswerGuidance?.[answer];
        if (projectGuidances) {
             Object.entries(projectGuidances).forEach(([projectId, guidance]) => {
                const project = projects.find(p => p.id === projectId);
                if (project && (guidance.noGuidanceRequired || (guidance.tasks && guidance.tasks.length > 0) || (guidance.tips && guidance.tips.length > 0))) {
                    summary.push({scope: project.name, tasks: guidance.tasks?.length || 0, tips: guidance.tips?.length || 0});
                }
            });
        }
        return summary;
    }, [currentQuestion?.answerGuidance, currentQuestion?.projectAnswerGuidance, projects]);

    const handleAddNewOption = () => {
        if (newOption && !currentOptions.includes(newOption)) {
            setOptionsText(prev => `${prev}\n${newOption}`.trim());
            setNewOption('');
        }
    };

    const handleToggleRemovalSuggestion = (option: string) => {
        setSuggestedRemovals(prev => {
            if (prev.includes(option)) {
                return prev.filter(item => item !== option);
            } else {
                return [...prev, option];
            }
        });
    };

    const handleProjectSelectionChange = useCallback((projectId: string, isChecked: boolean) => {
        setCurrentQuestion(prev => {
            if (!prev) return null;
            const currentProjectIds = prev.projectIds || [];
            let newProjectIds: string[];
            if (isChecked) {
                newProjectIds = [...currentProjectIds, projectId];
            } else {
                newProjectIds = currentProjectIds.filter(id => id !== projectId);
            }
            return { ...prev, projectIds: newProjectIds };
        });
    }, []);
    
    if (!currentQuestion) {
        return null;
    }

    const companyAddedOptions = new Set(companyOverride?.optionOverrides?.add || []);
    const activeProjects = projects.filter(p => !p.isArchived);

    return (
        <>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                 <DialogTitle>
                    {isNew 
                        ? (isAdmin ? 'Add New Master Question' : 'Add New Custom Question') 
                        : (isSuggestionMode ? 'Suggest Edits For' : 'Edit Question')}
                        {!isNew && <span className="block truncate font-normal text-muted-foreground text-base">"{currentQuestion.label}"</span>}
                </DialogTitle>
                <DialogDescription>
                    {isSuggestionMode
                        ? 'Suggest changes to this locked master question. Your suggestions will be sent for review.'
                        : (isNew ? (isAdmin ? 'Create a new question that will be available to all companies.' : 'Create a new custom question for your company.') : 'Modify the question text, answer options, and default value.')}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <fieldset disabled={isSuggestionMode && !isCustomQuestion && !isAdmin}>
                    {isSuggestionMode && (
                        <Alert variant="default" className="border-blue-300 bg-blue-50 text-blue-800 mb-6">
                            <HelpCircle className="h-4 w-4 !text-blue-600"/>
                            <AlertTitle>Suggestion Mode</AlertTitle>
                            <AlertDescription>
                            This is a locked, platform-wide question. You cannot change its text or type, but you can suggest adding or removing answer options, and map your company-specific guidance to any answer.
                            </AlertDescription>
                        </Alert>
                    )}
                    {hasUpdateForCurrentQuestion && masterQuestionForEdit && (
                        <Alert variant="default" className="bg-primary/5 border-primary/50 mb-6">
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
                                    setOptionsText(masterQuestionForEdit.options?.join('\n') || '');
                                    toast({ title: "Updates Applied" });
                                }}><Copy className="mr-2 h-3 w-3" /> Apply Updates</Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-6">
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

                        {!currentQuestion.parentId && (isNew || (!isNew && currentQuestion.isCustom)) && (
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
                                        {existingSections?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        {(isAdmin || (isHrEditing && formType === 'assessment')) && (
                                            <>
                                                <Separator className="my-1" />
                                                <SelectItem value="CREATE_NEW">Create new section...</SelectItem>
                                            </>
                                        )}
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
                    </div>
                </fieldset>
                
                {currentQuestion.isCustom && (
                    <div className="space-y-2 py-4">
                        <Label>Project Visibility</Label>
                        <p className="text-xs text-muted-foreground">Select which projects this custom question should appear in. Leave all unchecked for All Projects.</p>
                        <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
                           <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="project-unassigned"
                                    checked={(currentQuestion.projectIds || []).includes('__none__')}
                                    onCheckedChange={(checked) => handleProjectSelectionChange('__none__', !!checked)}
                                />
                                <Label htmlFor="project-unassigned" className="font-normal italic">Unassigned Users</Label>
                            </div>
                            {activeProjects.map(project => (
                                <div key={project.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`project-${project.id}`}
                                        checked={(currentQuestion.projectIds || []).includes(project.id)}
                                        onCheckedChange={(checked) => handleProjectSelectionChange(project.id, !!checked)}
                                    />
                                    <Label htmlFor={`project-${project.id}`} className="font-normal">{project.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* The rest of the form elements (options, guidance, etc.) */}
                {(currentQuestion.type === 'select' || currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Answer Options & Guidance</Label>
                        <p className="text-xs text-muted-foreground">
                            {isSuggestionMode 
                                ? "Suggest adding/removing options and map company-specific guidance." 
                                : "Enter one option per line and map tasks/tips."
                            }
                        </p>
                        {(!isSuggestionMode || isCustomQuestion) && <Textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={5}/>}
                    </div>

                    {isSuggestionMode && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Type new answer option..." />
                                <Button onClick={handleAddNewOption}><PlusCircle className="mr-2"/>Add</Button>
                            </div>
                        </div>
                    )}
                    
                    {currentQuestion.type === 'checkbox' && !isSuggestionMode && (
                         <div className="space-y-2">
                            <Label htmlFor="exclusive-option">Exclusive Option</Label>
                            <Input id="exclusive-option" value={currentQuestion.exclusiveOption || ''} onChange={(e) => setCurrentQuestion(q => q ? { ...q, exclusiveOption: e.target.value } : null)} placeholder="e.g., None of the above"/>
                            <p className="text-xs text-muted-foreground">If a user selects this option, all other options will be deselected.</p>
                        </div>
                    )}

                    {(isCustomQuestion || isNew) && (currentQuestion.type === 'select' || currentQuestion.type === 'radio') && (
                        <div className="space-y-2">
                            <Label htmlFor="default-value">Default Value (Optional)</Label>
                            <Select
                                value={currentQuestion.defaultValue as string || ''}
                                onValueChange={(value) => setCurrentQuestion(q => q ? { ...q, defaultValue: value === '__none__' ? undefined : value } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a default answer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    <DropdownMenuSeparator />
                                    {currentOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2 rounded-md border p-4 max-h-60 overflow-y-auto">
                        {currentOptions.length > 0 ? currentOptions.map(option => {
                            const isMasterOption = !!masterQuestionForEdit?.options?.includes(option);
                            const isRemovalSuggested = suggestedRemovals.includes(option);
                            const isCompanyAddition = companyAddedOptions.has(option);
                            const guidanceSummary = getGuidanceSummaryForAnswer(option);
                            return (
                                <div key={option} className="flex items-center justify-between">
                                    <Label htmlFor={`guidance-${option}`} className={cn("font-normal flex items-center gap-2", isRemovalSuggested && "line-through text-destructive")}>
                                        {(isCustomQuestion || isCompanyAddition) && <Star className="h-4 w-4 text-amber-500 fill-current" />}
                                        {option}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant={guidanceSummary.length > 0 ? 'secondary' : 'outline'} size="sm" onClick={() => openGuidanceDialog(option)}>
                                                        <Settings className="mr-2"/> Manage Guidance {guidanceSummary.length > 0 && <Badge variant="default" className="ml-2">{guidanceSummary.length}</Badge>}
                                                    </Button>
                                                </TooltipTrigger>
                                                {guidanceSummary.length > 0 && (
                                                    <TooltipContent>
                                                        <div className="space-y-1 p-1 text-xs">
                                                            {guidanceSummary.map(g => (
                                                                <p key={g.scope}><strong>{g.scope}:</strong> {g.tasks} tasks, {g.tips} tips</p>
                                                            ))}
                                                        </div>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                        {isSuggestionMode && isMasterOption && (
                                             <Button variant="ghost" size="icon" className={cn("h-8 w-8", isRemovalSuggested ? "text-primary" : "text-destructive")} onClick={() => handleToggleRemovalSuggestion(option)}>
                                                <Trash2 />
                                            </Button>
                                        )}
                                        {isSuggestionMode && !isMasterOption && (
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setOptionsText(prev => prev.split('\n').filter(o => o !== option).join('\n'))}>
                                                <Trash2 />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        }) : (
                            <p className="text-center text-muted-foreground text-sm py-4">Add answer options to set guidance.</p>
                        )}
                    </div>
                </div>
                )}
                
                {isSuggestionMode && (
                    <div className="space-y-2 pt-4">
                        <Label htmlFor="suggestion-reason">Reason for change (optional)</Label>
                        <Textarea id="suggestion-reason" value={suggestionReason} onChange={e => setSuggestionReason(e.target.value)} placeholder="e.g., We need to add a 'Remote' option because our policy has changed." />
                    </div>
                )}

                {(!isSuggestionMode || isCustomQuestion) && (
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="link" className="p-0 h-auto flex items-center gap-2">
                            <Link className="text-muted-foreground"/> Show Advanced Conditional Logic <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="space-y-4 rounded-md border border-dashed p-4 mt-2">
                                <h3 className="text-sm font-semibold">Conditional Logic (Optional)</h3>
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
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {isAdmin && !currentQuestion.parentId && (
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
            </div>

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
            onSaveAllGuidance={handleSaveAllGuidanceForAnswer}
            onAddNewTask={() => onAddNewTask(() => {})}
            onAddNewTip={() => onAddNewTip(() => {})}
            allCompanyTasks={allCompanyTasks}
            allCompanyTips={allCompanyTips}
            currentDefaultGuidance={currentQuestion?.answerGuidance?.[currentAnswerForGuidance] || {}}
            currentProjectGuidance={currentQuestion?.projectAnswerGuidance?.[currentAnswerForGuidance] || {}}
            projects={projects}
        />
        
        </>
    );
}
