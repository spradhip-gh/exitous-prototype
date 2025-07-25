
'use client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Question } from "@/hooks/use-user-data";
import { PlusCircle, Trash2, Pencil, ArrowUp, ArrowDown, CornerDownRight, Link } from "lucide-react";

function AdminSubQuestionItem({ question, level, onEdit, onDelete, onAddSubQuestion, onMapTasks }: { 
    question: Question, 
    level: number, 
    onEdit: (q: Question) => void, 
    onDelete: (id: string) => void, 
    onAddSubQuestion: (parentId: string) => void,
    onMapTasks: (q: Question) => void 
}) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);
    const canMapTasks = ['radio', 'select', 'checkbox'].includes(question.type);

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2 group bg-muted/50 p-2 rounded-md" style={{ marginLeft: `${level * 1.5}rem`}}>
                <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                {question.triggerValue && <Badge variant="outline" className="text-xs">On: {question.triggerValue}</Badge>}
                <div className="flex items-center">
                    {canMapTasks && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMapTasks(question)}><Link className="h-3 w-3" /></Button>}
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
                            onMapTasks={onMapTasks}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminQuestionItem({ question, onEdit, onDelete, onAddSubQuestion, onMove, onMapTasks, isFirst, isLast }: { 
    question: Question, 
    onEdit: (q: Question) => void, 
    onDelete: (id: string) => void, 
    onAddSubQuestion: (parentId: string) => void, 
    onMove: (questionId: string, direction: 'up' | 'down') => void,
    onMapTasks: (q: Question) => void, 
    isFirst: boolean, 
    isLast: boolean 
}) {
    const canHaveSubquestions = ['radio', 'select', 'checkbox'].includes(question.type);
    const canMapTasks = ['radio', 'select', 'checkbox'].includes(question.type);

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
                    {canMapTasks && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMapTasks(question)}><Link className="h-3 w-3" /></Button>}
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
                            onMapTasks={onMapTasks}
                         />
                    ))}
                </div>
            )}
        </div>
    );
}
