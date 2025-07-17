'use client';
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserData, Question, buildQuestionTreeFromMap } from "@/hooks/use-user-data";
import { getDefaultQuestions } from "@/lib/questions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import AdminQuestionItem from "./AdminQuestionItem";
import EditQuestionDialog from "./EditQuestionDialog";

interface OrderedSection {
    id: string;
    questions: Question[];
}

function findQuestionById(sections: OrderedSection[], id: string): Question | null {
    for (const section of sections) {
        const queue: Question[] = [...section.questions];
        while (queue.length > 0) {
            const q = queue.shift()!;
            if (q.id === id) return q;
            if (q.subQuestions) queue.push(...q.subQuestions);
        }
    }
    return null;
}

export default function AdminFormEditor() {
    const { toast } = useToast();
    const { masterQuestions, saveMasterQuestions, isLoading } = useUserData();
    const [isEditing, setIsEditing] = useState(false);
    const [isNewQuestion, setIsNewQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    const orderedSections = useMemo(() => {
        if (isLoading || Object.keys(masterQuestions).length === 0) {
            return [];
        }

        const rootQuestions = buildQuestionTreeFromMap(masterQuestions);
        const sectionsMap: Record<string, Question[]> = {};

        const defaultQuestions = getDefaultQuestions().filter(q => !q.parentId);
        const defaultSectionOrder = [...new Set(defaultQuestions.map(q => q.section))];
        const masterQuestionOrder = [...new Set(Object.values(masterQuestions).filter(q => !q.parentId).map(q => q.section))];

        const finalSectionOrder = [...defaultSectionOrder];
        masterQuestionOrder.forEach(s => {
            if (s && !finalSectionOrder.includes(s)) finalSectionOrder.push(s);
        });

        finalSectionOrder.forEach(s => sectionsMap[s] = []);
        rootQuestions.forEach(q => {
            const sectionName = q.section || 'Uncategorized';
            if (!sectionsMap[sectionName]) sectionsMap[sectionName] = [];
            sectionsMap[sectionName].push(q);
        });

        return finalSectionOrder.map(sectionName => ({
            id: sectionName,
            questions: sectionsMap[sectionName] || []
        })).filter(s => s.questions.length > 0);
    }, [isLoading, masterQuestions]);

    const handleEditClick = (question: Question) => {
        setCurrentQuestion({ ...question });
        setIsNewQuestion(false);
        setIsEditing(true);
    };

    const handleAddNewClick = (parentId?: string) => {
        let section = '';
        if (parentId) {
            const parent = findQuestionById(orderedSections, parentId);
            if (parent) section = parent.section;
        } else {
            section = orderedSections[0]?.id || '';
        }
        setCurrentQuestion({ parentId, id: '', label: '', section, type: 'text', isActive: true, options: [] });
        setIsNewQuestion(true);
        setIsEditing(true);
    };

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
        saveMasterQuestions(newMaster);
        toast({ title: "Master Configuration Saved" });
    };

    const handleSaveEdit = (questionToSave: Partial<Question>, newSectionName?: string) => {
        let finalQuestion = { ...questionToSave, lastUpdated: new Date().toISOString() } as Question;

        if (newSectionName?.trim()) {
            finalQuestion.section = newSectionName.trim();
        }

        if (!finalQuestion.id && isNewQuestion) {
            finalQuestion.id = finalQuestion.label.toLowerCase().replace(/\s+/g, '-').replace(/[?]/g, '');
        }

        if (!finalQuestion.id || (!finalQuestion.section && !finalQuestion.parentId)) {
            toast({ title: "ID and Section/Parent are required.", variant: "destructive" });
            return;
        }

        const newMaster = JSON.parse(JSON.stringify(masterQuestions));
        newMaster[finalQuestion.id] = { ...newMaster[finalQuestion.id], ...finalQuestion };

        saveMasterQuestions(newMaster);
        toast({ title: "Master Configuration Saved" });

        setIsEditing(false);
        setCurrentQuestion(null);
    };

    const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
        let newMaster = JSON.parse(JSON.stringify(masterQuestions));
        const questionsArray = Object.values(newMaster).filter((q: any) => !q.parentId);
        const index = questionsArray.findIndex((q: any) => q.id === questionId);

        if (index === -1) return;

        const question = questionsArray[index] as Question;
        const questionsInSection = questionsArray.filter((q: any) => q.section === question.section);
        const sectionIndex = questionsInSection.findIndex((q: any) => q.id === questionId);

        const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

        if (targetIndex >= 0 && targetIndex < questionsInSection.length) {
            const [moved] = questionsInSection.splice(sectionIndex, 1);
            questionsInSection.splice(targetIndex, 0, moved);

            const allSections = [...new Set(questionsArray.map((q: any) => q.section))];
            const finalOrderedQuestions: Question[] = [];

            allSections.forEach(section => {
                if (section === question.section) {
                    finalOrderedQuestions.push(...questionsInSection as Question[]);
                } else {
                    finalOrderedQuestions.push(...questionsArray.filter((q: any) => q.section === section) as Question[]);
                }
            });

            const finalMaster: Record<string, Question> = {};
            const allQuestions = Object.values(newMaster) as Question[];

            finalOrderedQuestions.forEach(q => {
                const fullQuestion = allQuestions.find(fullQ => fullQ.id === q.id);
                if (fullQuestion) finalMaster[q.id] = fullQuestion;
            });

            allQuestions.forEach(q => {
                if (!finalMaster[q.id]) finalMaster[q.id] = q;
            });

            saveMasterQuestions(finalMaster);
            toast({ title: "Master Configuration Saved" });
        }
    };
    
    const existingSections = useMemo(() => [...new Set(Object.values(masterQuestions).filter(q => !q.parentId).map(q => q.section))], [masterQuestions]);

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Master Question Editor</h1>
                    <p className="text-muted-foreground">Add, edit, or delete the default questions available to all companies. Use arrows to reorder. Changes are saved automatically.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Master Question List</CardTitle>
                        <CardDescription>These changes will become the new defaults for all company configurations.</CardDescription>
                    </CardHeader>
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
                    <CardFooter className="border-t pt-6">
                        <Button variant="outline" onClick={() => handleAddNewClick()}>
                            <PlusCircle className="mr-2" />Add New Question
                        </Button>
                    </CardFooter>
                </Card>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <EditQuestionDialog
                        isOpen={isEditing}
                        isNew={isNewQuestion}
                        question={currentQuestion}
                        existingSections={existingSections}
                        onSave={handleSaveEdit}
                        onClose={() => setIsEditing(false)}
                    />
                </Dialog>
            </div>
        </div>
    );
}
