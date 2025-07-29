

'use client';
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { BellDot, Copy, Link, Wand2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Question } from "@/hooks/use-user-data";
import { useUserData } from "@/hooks/use-user-data";
import { buildQuestionTreeFromMap } from "@/hooks/use-user-data";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";

interface EditQuestionDialogProps {
    isOpen: boolean;
    isNew: boolean;
    question: Partial<Question> | null;
    existingSections?: string[];
    onSave: (question: Partial<Question>, newSectionName?: string) => void;
    onClose: () => void;
    masterQuestionForEdit?: Question | null;
}

export default function EditQuestionDialog({
    isOpen, isNew, question, existingSections, onSave, onClose, masterQuestionForEdit
}: EditQuestionDialogProps) {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { masterQuestions, masterProfileQuestions } = useUserData();
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    
    const isAdmin = auth?.role === 'admin';

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

    useEffect(() => {
        if (isOpen) {
            setCurrentQuestion(question);
            setIsCreatingNewSection(false);
            setNewSectionName("");
        }
    }, [isOpen, question]);

    if (!isOpen || !currentQuestion) {
        return null;
    }

    const hasUpdateForCurrentQuestion = masterQuestionForEdit && currentQuestion?.lastUpdated && masterQuestionForEdit.lastUpdated && new Date(masterQuestionForEdit.lastUpdated) > new Date(currentQuestion.lastUpdated);

    const handleSave = () => {
        if (!currentQuestion) return;
        if (isCreatingNewSection && !newSectionName.trim()) {
            toast({ title: "New Section Required", variant: "destructive" });
            return;
        }
        onSave(currentQuestion, isCreatingNewSection ? newSectionName : undefined);
    };

    const handleDependsOnValueChange = (option: string, isChecked: boolean) => {
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
    };

    return (
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{isNew ? 'Add Custom Question' : 'Edit Question'}</DialogTitle>
                <DialogDescription>{isNew ? 'Create a new question.' : 'Modify the question text, answer options, and default value.'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
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
                    <div className="space-y-2">
                        <Label htmlFor="question-options">Answer Options (one per line)</Label>
                        <Textarea id="question-options" value={currentQuestion.options?.join('\n') || ''} onChange={(e) => setCurrentQuestion(q => q ? { ...q, options: e.target.value.split('\n') } : null)} rows={currentQuestion.options?.length || 3} />
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
            </div>

            <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={onClose}>Cancel</Button></DialogClose>
                <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    );
}
