

'use client';
import { useState, useMemo, useCallback } from "react";
import { useUserData, Question, CompanyConfig } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GuidanceEditor({ questions, companyConfigs, saveCompanyConfigsFn }: {
    questions: Question[];
    companyConfigs: Record<string, CompanyConfig>;
    saveCompanyConfigsFn: (configs: Record<string, CompanyConfig>) => void;
}) {
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);

    const handleManageGuidance = (question: Question) => {
        if (!selectedCompany) {
            alert("Please select a company first.");
            return;
        }
        setSelectedQuestion(question);
        setIsGuidanceDialogOpen(true);
    };

    const companyNames = useMemo(() => Object.keys(companyConfigs), [companyConfigs]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Guidance Editor</CardTitle>
                <CardDescription>
                    Select a company to manage its guidance rules. These rules determine which tasks and tips are shown to users based on their answers or other calculations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="max-w-xs">
                    <Select onValueChange={setSelectedCompany} value={selectedCompany}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Company..." />
                        </SelectTrigger>
                        <SelectContent>
                            {companyNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {selectedCompany && (
                    <div className="space-y-4">
                        {questions.map(q => (
                             <div key={q.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <span>{q.label}</span>
                                <Button variant="outline" size="sm" onClick={() => handleManageGuidance(q)}>Manage Guidance</Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

