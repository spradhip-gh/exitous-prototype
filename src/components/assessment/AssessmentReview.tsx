
'use client';

import { useUserData } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Question } from '@/lib/questions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AssessmentSummaryCard from './AssessmentSummaryCard';

function AnswerDisplay({ label, value }: { label: string; value: any }) {
    let displayValue = 'N/A';
    if (Array.isArray(value)) {
        displayValue = value.join(', ');
    } else if (value instanceof Date) {
        displayValue = format(value, 'PPP');
    } else if (typeof value === 'string' && value) {
        // Check if it's an ISO date string
        try {
            const parsedDate = parseISO(value);
            if (!isNaN(parsedDate.getTime())) {
                displayValue = format(parsedDate, 'PPP');
            } else {
                displayValue = value;
            }
        } catch {
            displayValue = value;
        }
    }

    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
    }

    return (
        <div className="grid grid-cols-3 gap-4 py-2">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm col-span-2">{displayValue}</dd>
        </div>
    );
}

export default function AssessmentReview() {
    const { getCompanyConfig, assessmentData, isLoading } = useUserData();
    const { auth } = useAuth();
    const router = useRouter();

    const companyName = auth?.companyName;
    const questions = useMemo(() => {
        return companyName ? getCompanyConfig(companyName, true) : [];
    }, [companyName, getCompanyConfig]);

    const groupedQuestions = useMemo(() => {
        const sections: Record<string, Question[]> = {};
        const qMap = new Map(questions.map(q => [q.id, q]));

        const processQuestion = (q: Question) => {
            if (!q.parentId) {
                const sectionName = q.section || "Uncategorized";
                if (!sections[sectionName]) {
                    sections[sectionName] = [];
                }
                sections[sectionName].push(q);
            }
        };

        questions.forEach(processQuestion);
        return sections;
    }, [questions]);
    
    const renderQuestionAndAnswer = (question: Question) => {
        const value = assessmentData?.[question.id as keyof typeof assessmentData];
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
            return null;
        }

        return (
            <div key={question.id} className="space-y-2">
                <AnswerDisplay label={question.label} value={value} />
                {question.subQuestions && Array.isArray(value) && value.includes(question.triggerValue) && (
                     <div className="pl-6 border-l-2 ml-4">
                        {question.subQuestions.map(renderQuestionAndAnswer)}
                    </div>
                )}
                 {question.subQuestions && !Array.isArray(value) && value === question.triggerValue && (
                     <div className="pl-6 border-l-2 ml-4">
                        {question.subQuestions.map(renderQuestionAndAnswer)}
                    </div>
                )}
            </div>
        )
    };
    
    const handleEditClick = (sectionId: string) => {
        router.push(`/dashboard/assessment?section=${encodeURIComponent(sectionId)}`);
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Your Assessment Summary</h1>
                    <p className="text-muted-foreground">
                        Here are the answers you provided. You can edit any section if your details change.
                    </p>
                </div>

                <AssessmentSummaryCard />

                {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                     <Card key={section}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>{section}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(section)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <dl className="divide-y divide-border">
                                {sectionQuestions.map(renderQuestionAndAnswer)}
                            </dl>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

