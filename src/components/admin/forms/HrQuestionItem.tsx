
'use client';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Question, ReviewQueueItem } from "@/hooks/use-user-data";
import { cn } from "@/lib/utils";
import { PlusCircle, Trash2, Pencil, Star, ArrowUp, ArrowDown, CornerDownRight, BellDot, Lock, ArrowUpToLine, ArrowDownToLine, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function HrSubQuestionItem({ question, parentId, level, onToggleActive, onEdit, onDelete, onAddSub, canWrite }: { question: Question, parentId: string, level: number, onToggleActive: (id: string, parentId?: string) => void, onEdit: (q: Question) => void, onDelete: (id: string) => void, onAddSub: (parentId: string) => void, canWrite: boolean }) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);
    const isLocked = !!question.isLocked;

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2 group p-2 rounded-md" style={{ marginLeft: `${level * 1.5}rem`}}>
                <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Checkbox id={question.id} checked={question.isActive} onCheckedChange={() => onToggleActive(question.id, parentId)} disabled={!canWrite || isLocked} />
                <Label htmlFor={question.id} className={cn("font-normal text-sm flex-1", isLocked && "text-muted-foreground")}>{question.label}</Label>
                {question.triggerValue && <Badge variant="outline" className="text-xs">On: {question.triggerValue}</Badge>}
                <div className="flex items-center">
                    {canHaveSubquestions && (
                         <Button variant="ghost" size="sm" onClick={() => onAddSub(question.id)} disabled={!canWrite}><PlusCircle className="h-4 w-4 mr-2" /> Sub</Button>
                    )}
                    {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                    )}
                    {question.isCustom && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" disabled={!canWrite}><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Custom Sub-Question?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{question.label}". This action cannot be undone.</AlertDialogDescription>
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
                            canWrite={canWrite}
                         />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function HrQuestionItem({ question, onToggleActive, onEdit, onDelete, onAddSub, hasBeenUpdated, onMove, canWrite, isFirstCustom, isLastCustom, pendingSuggestion }: {
    question: Question, 
    onToggleActive: (id: string, parentId?: string) => void, 
    onEdit: (q: Question) => void, 
    onDelete: (id: string) => void, 
    onAddSub: (parentId: string) => void, 
    hasBeenUpdated: boolean, 
    onMove: (questionId: string, direction: 'up' | 'down' | 'to_top' | 'to_bottom') => void,
    canWrite: boolean,
    isFirstCustom: boolean,
    isLastCustom: boolean,
    pendingSuggestion?: ReviewQueueItem,
}) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);
    const isLocked = !!question.isLocked;

    const SuggestionTooltipContent = () => {
        if (!pendingSuggestion) return null;
        const { optionsToAdd, optionsToRemove, reason } = pendingSuggestion.change_details || {};
        return (
            <div className="space-y-2 text-xs">
                {reason && <p className="italic">"{reason}"</p>}
                {optionsToAdd && optionsToAdd.length > 0 && (
                    <div className="text-green-600">
                        <strong>Add:</strong> {optionsToAdd.map((o: any) => `"${o.option}"`).join(', ')}
                    </div>
                )}
                {optionsToRemove && optionsToRemove.length > 0 && (
                    <div className="text-red-600">
                        <strong>Remove:</strong> {optionsToRemove.join(', ')}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-background rounded-lg my-1">
            <div className="flex items-center space-x-2 group pr-2">
                 <div className="w-10 flex-shrink-0 flex flex-col items-center">
                    {question.isCustom && (
                        <div className="flex flex-col">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMove(question.id, 'up')} disabled={isFirstCustom || !canWrite}>
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMove(question.id, 'down')} disabled={isLastCustom || !canWrite}>
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {isLocked && !question.isCustom && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>This question is critical and cannot be edited or disabled.</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {hasBeenUpdated && !question.isCustom && <BellDot className="h-4 w-4 text-primary flex-shrink-0" />}
                    {question.isCustom && <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                </div>
                <Checkbox id={question.id} checked={question.isActive} onCheckedChange={() => onToggleActive(question.id)} disabled={!canWrite || isLocked} />
                <Label htmlFor={question.id} className={cn("font-normal text-sm flex-1", isLocked && "text-muted-foreground")}>{question.label}</Label>
                <div className="flex items-center">
                     {pendingSuggestion && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="mr-2 cursor-help">
                                        <History className="mr-1 h-3 w-3" /> Pending
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <SuggestionTooltipContent />
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {question.isCustom && (
                        <div className="flex items-center border rounded-md mr-2">
                           <TooltipProvider><Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(question.id, 'to_top')} disabled={question.position === 'top' || !canWrite}>
                                        <ArrowUpToLine className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger><TooltipContent><p>Move to top of section</p></TooltipContent>
                           </Tooltip></TooltipProvider>
                           <TooltipProvider><Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(question.id, 'to_bottom')} disabled={question.position !== 'top' || !canWrite}>
                                        <ArrowDownToLine className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger><TooltipContent><p>Move to bottom of section</p></TooltipContent>
                           </Tooltip></TooltipProvider>
                        </div>
                    )}
                    {canHaveSubquestions && (
                         <Button variant="ghost" size="sm" onClick={() => onAddSub(question.id)} disabled={!canWrite}><PlusCircle className="mr-2 h-4 w-4"/>Sub</Button>
                    )}
                    {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                    )}
                    {question.isCustom && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" disabled={!canWrite}><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Custom Question?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{question.label}" and any sub-questions. This action cannot be undone.</AlertDialogDescription>
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
                            canWrite={canWrite}
                         />
                    ))}
                </div>
            )}
        </div>
    );
}
