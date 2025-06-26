'use client';
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useUserData, CompanyConfig } from "@/hooks/use-user-data.tsx";
import { getDefaultQuestions, Question } from "@/lib/questions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2, BellDot, PlusCircle, Trash2, Copy, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";


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


function HrFormEditor() {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { getAllCompanyConfigs, saveCompanyQuestions, masterQuestions, isLoading: isUserDataLoading, companyAssignmentForHr } = useUserData();
    
    const companyName = auth?.companyName;
    const [questions, setQuestions] = useState<Record<string, Question>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

    useEffect(() => {
        if (companyName && !isUserDataLoading) {
            const allConfigs = getAllCompanyConfigs();
            const companyData = allConfigs[companyName] as CompanyConfig | undefined;
            
            const finalQuestions = { ...masterQuestions };
            if (companyData?.questions) {
                Object.keys(companyData.questions).forEach(qId => {
                    if (finalQuestions[qId]) { 
                        finalQuestions[qId] = { ...finalQuestions[qId], ...companyData.questions[qId] };
                    }
                })
            }
            setQuestions(finalQuestions);
        }
    }, [companyName, isUserDataLoading, getAllCompanyConfigs, masterQuestions]);

    const handleSaveConfig = () => {
        if (!companyName) {
            toast({ title: "Company Name Required", variant: "destructive" });
            return;
        }
        const questionsToSave = { ...questions };
        Object.keys(questionsToSave).forEach(qId => {
            const masterQ = masterQuestions[qId];
            if (masterQ) {
                questionsToSave[qId].lastUpdated = masterQ.lastUpdated;
            }
        });

        saveCompanyQuestions(companyName, questionsToSave);
        toast({ title: "Configuration Saved", description: `Settings for ${companyName} have been updated.` });
    };

    const handleToggleQuestion = (questionId: string) => {
        setQuestions(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], isActive: !prev[questionId].isActive }
        }));
    };

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (currentQuestion) {
            setQuestions(prev => ({ ...prev, [currentQuestion.id]: currentQuestion }));
        }
        setIsEditing(false);
        setCurrentQuestion(null);
    };
    
    const groupedQuestions = Object.values(questions).reduce((acc, q) => {
        if (!acc[q.section]) acc[q.section] = [];
        acc[q.section].push(q);
        return acc;
    }, {} as Record<string, Question[]>);

    const masterQuestionForEdit = currentQuestion ? masterQuestions[currentQuestion.id] : null;
    const hasUpdateForCurrentQuestion = masterQuestionForEdit && currentQuestion?.lastUpdated && new Date(masterQuestionForEdit.lastUpdated!) > new Date(currentQuestion.lastUpdated);

    if (isUserDataLoading || companyAssignmentForHr === undefined) {
        return (
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-4xl space-y-8">
                     <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (!companyName) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader><CardTitle>No Company Assigned</CardTitle></CardHeader>
                    <CardContent><p>Your account is not assigned to a company. Please contact an administrator.</p></CardContent>
                </Card>
            </div>
        );
    }

    if (companyAssignmentForHr?.version === 'basic') {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert /> Pro Feature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Managing the assessment is only available in the Pro version.</p>
                        <p className="text-sm text-muted-foreground mt-2">To enable question editing, please contact an administrator to upgrade to the Pro version.</p>
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
                        <CardDescription>Enable, disable, or edit questions for your company.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                            <div key={section}>
                                <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                <div className="space-y-4">
                                {sectionQuestions.sort((a,b) => getDefaultQuestions().findIndex(q => q.id === a.id) - getDefaultQuestions().findIndex(q => q.id === b.id)).map((question) => {
                                    const masterQ = masterQuestions[question.id];
                                    const hasBeenUpdated = masterQ && question.lastUpdated && new Date(masterQ.lastUpdated) > new Date(question.lastUpdated);
                                    return (
                                        <div key={question.id} className="flex items-center space-x-3">
                                            {hasBeenUpdated && <BellDot className="h-4 w-4 text-primary flex-shrink-0" />}
                                            <Checkbox id={question.id} checked={question.isActive} onCheckedChange={() => handleToggleQuestion(question.id)} />
                                            <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                                        </div>
                                    );
                                })}
                                </div>
                                <Separator className="my-6" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Button onClick={handleSaveConfig} className="w-full">Save Configuration for {companyName}</Button>
            </div>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                        <DialogDescription>Modify the question text, answer options, and default value.</DialogDescription>
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
                            {currentQuestion.options && currentQuestion.options.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="question-options">Answer Options (one per line)</Label>
                                    <Textarea id="question-options" value={currentQuestion.options.join('\n')} onChange={(e) => setCurrentQuestion({ ...currentQuestion, options: e.target.value.split('\n') })} rows={currentQuestion.options.length + 1}/>
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


function AdminFormEditor() {
    const { toast } = useToast();
    const { masterQuestions, saveMasterQuestions } = useUserData();
    const [questions, setQuestions] = useState<Record<string, Question>>(masterQuestions);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    useEffect(() => {
        setQuestions(masterQuestions);
    }, [masterQuestions]);

    const handleSaveConfig = () => {
        saveMasterQuestions(questions);
        toast({ title: "Master Configuration Saved" });
    };

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsNewQuestion(false);
        setIsEditing(true);
    };
    
    const handleAddNewClick = () => {
        setCurrentQuestion({
            id: '',
            label: '',
            section: 'Work & Employment Details',
            type: 'text',
            isActive: true,
            options: [],
        });
        setIsNewQuestion(true);
        setIsEditing(true);
    };

    const handleDeleteClick = (questionId: string) => {
        setQuestions(prev => {
            const newQ = { ...prev };
            delete newQ[questionId];
            return newQ;
        });
        toast({ title: "Question Deleted", description: "Remember to save your changes." });
    };

    const handleSaveEdit = () => {
        if (!currentQuestion || !currentQuestion.id) {
            toast({ title: "Invalid ID", description: "Question ID cannot be empty.", variant: "destructive" });
            return;
        }
        if (isNewQuestion && questions[currentQuestion.id]) {
            toast({ title: "Duplicate ID", description: "A question with this ID already exists.", variant: "destructive" });
            return;
        }
        setQuestions(prev => ({ ...prev, [currentQuestion.id!]: currentQuestion as Question }));
        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const groupedQuestions = Object.values(questions).reduce((acc, q) => {
        if (!acc[q.section]) acc[q.section] = [];
        acc[q.section].push(q);
        return acc;
    }, {} as Record<string, Question[]>);

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Master Question Editor</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the default questions available to all companies.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Master Question List</CardTitle>
                        <CardDescription>These changes will become the new defaults for all company configurations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                            <div key={section}>
                                <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                <div className="space-y-4">
                                {sectionQuestions.map((question) => (
                                    <div key={question.id} className="flex items-center space-x-3 group">
                                        <Checkbox id={question.id} checked={question.isActive} onCheckedChange={() => setQuestions(q => ({...q, [question.id]: {...question, isActive: !question.isActive}}))} />
                                        <Label htmlFor={question.id} className="font-normal text-sm flex-1">{question.label}</Label>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(question)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(question.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                </div>
                                <Separator className="my-6" />
                            </div>
                        ))}
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
                                <Input id="question-id" placeholder="kebab-case-unique-id" value={currentQuestion.id || ''} onChange={(e) => setCurrentQuestion(q => ({ ...q, id: e.target.value }))} disabled={!isNewQuestion}/>
                                {!isNewQuestion && <p className="text-xs text-muted-foreground">ID cannot be changed after creation.</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-label">Question Text</Label>
                                <Textarea id="question-label" value={currentQuestion.label} onChange={(e) => setCurrentQuestion(q => ({ ...q, label: e.target.value }))}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-section">Section</Label>
                                <Select onValueChange={(v) => setCurrentQuestion(q => ({ ...q, section: v as any}))} value={currentQuestion.section}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Work & Employment Details">Work & Employment Details</SelectItem>
                                        <SelectItem value="Work Circumstances">Work Circumstances</SelectItem>
                                        <SelectItem value="Systems & Benefits Access">Systems & Benefits Access</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
