'use client';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useUserData } from "@/hooks/use-user-data.tsx";
import { getDefaultQuestions, Question } from "@/lib/questions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";


export default function FormEditorPage() {
    const { toast } = useToast();
    const { saveCompanyQuestions, getCompanyConfig } = useUserData();

    const [companyName, setCompanyName] = useState("");
    const [questions, setQuestions] = useState<Record<string, Question>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initialQuestions: Record<string, Question> = {};
        getDefaultQuestions().forEach(q => {
            initialQuestions[q.id] = q;
        });
        setQuestions(initialQuestions);
    }, []);

    const handleLoadConfig = () => {
        if (!companyName) {
            toast({
                title: "Company Name Required",
                description: "Please enter a company name to load its configuration.",
                variant: "destructive"
            });
            return;
        }
        setIsLoading(true);
        // Simulate loading
        setTimeout(() => {
            const config = getCompanyConfig(companyName);
            setQuestions(config);
            toast({
                title: "Configuration Loaded",
                description: `Displaying configuration for ${companyName}.`,
            });
            setIsLoading(false);
        }, 500);
    };

    const handleSaveConfig = () => {
        if (!companyName) {
            toast({
                title: "Company Name Required",
                description: "Please enter a company name to save the configuration.",
                variant: "destructive"
            });
            return;
        }
        saveCompanyQuestions(companyName, questions);
        toast({
            title: "Configuration Saved",
            description: `Settings for ${companyName} have been updated.`,
        });
    };

    const handleToggleQuestion = (questionId: string) => {
        setQuestions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                isActive: !prev[questionId].isActive,
            }
        }));
    };

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (currentQuestion) {
            setQuestions(prev => ({
                ...prev,
                [currentQuestion.id]: currentQuestion,
            }));
        }
        setIsEditing(false);
        setCurrentQuestion(null);
    };
    
    const groupedQuestions = Object.values(questions).reduce((acc, q) => {
        if (!acc[q.section]) acc[q.section] = [];
        acc[q.section].push(q);
        return acc;
    }, {} as Record<string, Question[]>);


    const renderDefaultValueControl = (question: Question | null) => {
        if (!question) return null;
    
        const handleDefaultChange = (value: string | undefined) => {
            // use an empty string to represent "no default"
            setCurrentQuestion(prev => prev ? { ...prev, defaultValue: value || undefined } : null);
        };
    
        if (question.type === 'text') {
            return <Input 
                placeholder="Enter default text" 
                value={question.defaultValue as string || ''}
                onChange={(e) => handleDefaultChange(e.target.value)}
            />;
        }
    
        if (question.type === 'select' || question.type === 'radio') {
            return (
                <Select onValueChange={handleDefaultChange} value={question.defaultValue as string || ''}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a default answer" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="">No Default</SelectItem>
                        {question.options?.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
    
        return <p className="text-sm text-muted-foreground pt-2">Default values are not supported for this question type.</p>;
    }


    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Assessment Question Editor</h1>
                    <p className="text-muted-foreground">
                        Create and manage company-specific assessment forms. Enter a company name to load or create a new configuration.
                    </p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Company Configuration</CardTitle>
                        <CardDescription>Enter a company name and click "Load" to begin.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input 
                            placeholder="Enter Company Name (e.g., Acme Inc.)"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                        <Button onClick={handleLoadConfig} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "Load"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manage Questions</CardTitle>
                        <CardDescription>
                            Enable, disable, or edit questions for the assessment. Your changes will apply to <span className="font-bold">{companyName || "the selected company"}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                            <div key={section}>
                                <h3 className="font-semibold mb-4 text-lg">{section}</h3>
                                <div className="space-y-4">
                                {sectionQuestions.sort((a,b) => getDefaultQuestions().findIndex(q => q.id === a.id) - getDefaultQuestions().findIndex(q => q.id === b.id)).map((question) => (
                                    <div key={question.id} className="flex items-center space-x-3">
                                        <Checkbox 
                                            id={question.id} 
                                            checked={question.isActive}
                                            onCheckedChange={() => handleToggleQuestion(question.id)}
                                            disabled={!companyName}
                                        />
                                        <Label htmlFor={question.id} className="font-normal text-sm flex-1">
                                            {question.label}
                                        </Label>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(question)} disabled={!companyName}>
                                            <Pencil className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                    </div>
                                ))}
                                </div>
                                <Separator className="my-6" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Button onClick={handleSaveConfig} className="w-full" disabled={!companyName}>
                    Save Configuration for {companyName || "..."}
                </Button>
            </div>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                        <DialogDescription>Modify the question text, answer options, and default value.</DialogDescription>
                    </DialogHeader>
                    {currentQuestion && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="question-label">Question Text</Label>
                                <Textarea 
                                    id="question-label"
                                    value={currentQuestion.label}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, label: e.target.value })}
                                />
                            </div>
                             {currentQuestion.options && currentQuestion.options.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="question-options">Answer Options</Label>
                                    <CardDescription>Enter one option per line.</CardDescription>
                                    <Textarea
                                        id="question-options"
                                        value={currentQuestion.options.join('\n')}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, options: e.target.value.split('\n') })}
                                        rows={currentQuestion.options.length + 1}
                                    />
                                </div>
                             )}
                             <Separator />
                             <div className="space-y-2">
                                <Label>Default Answer</Label>
                                <CardDescription>Set a default value. This will be pre-selected for the user.</CardDescription>
                                {renderDefaultValueControl(currentQuestion)}
                             </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
