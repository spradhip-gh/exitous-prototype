

'use client';
import { useState, useMemo, useCallback } from "react";
import { useUserData, Question, CompanyConfig } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GuidanceEditor({ questions }: {
    questions: Question[];
}) {
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);

    const handleManageGuidance = (question: Question) => {
        setSelectedQuestion(question);
        setIsGuidanceDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Guidance Editor</CardTitle>
                <CardDescription>
                    Manage universal guidance rules. These rules determine which tasks and tips are shown to users based on their answers or other calculations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {questions.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span>{q.label}</span>
                        <Button variant="outline" size="sm" onClick={() => handleManageGuidance(q)}>Manage Guidance</Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
