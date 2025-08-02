
'use client';

import { useUserData } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Question } from '@/lib/questions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { format, parseISO, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';

function getDisplayValue(value: any): string | null {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return null;
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (value instanceof Date) {
        return format(value, 'PPP');
    }
    if (typeof value === 'string') {
        // Check if it's an ISO date string
        try {
            const parsedDate = parseISO(value);
            if (!isNaN(parsedDate.getTime()) && value.includes('T')) {
                 return format(parsedDate, 'PPP');
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [year, month, day] = value.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                 if (!isNaN(date.getTime())) {
                    return format(date, 'PPP');
                }
            }
        } catch {}
        return value;
    }
    return String(value);
}

function AnswerDisplay({ label, value, subText }: { label: string; value: any, subText?: string | null }) {
    const displayValue = getDisplayValue(value);

    if (displayValue === null) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 py-2">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm col-span-2">
                {displayValue}
                {subText && <span className="ml-2 text-xs text-muted-foreground">({subText})</span>}
            </dd>
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

    const tenure = useMemo(() => {
        if (!assessmentData?.startDate || !assessmentData?.finalDate) return null;
        try {
            const start = assessmentData.startDate instanceof Date ? assessmentData.startDate : parseISO(assessmentData.startDate as string);
            const end = assessmentData.finalDate instanceof Date ? assessmentData.finalDate : parseISO(assessmentData.finalDate as string);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
            
            const years = differenceInYears(end, start);
            const months = differenceInMonths(end, start) % 12;
            const remainingDays = differenceInDays(end, new Date(start.getFullYear() + years, start.getMonth() + months));
            
            const parts = [];
            if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
            if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
            if (remainingDays > 0 && years === 0) parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);

            return parts.length > 0 ? parts.join(', ') : "Less than a day";
        } catch (e) {
            console.error("Error calculating tenure", e);
            return "N/A";
        }
    }, [assessmentData]);
    
    const getGroupedAnswer = (question: Question) => {
        const value = assessmentData?.[question.id as keyof typeof assessmentData];
        let subText: string | null = null;
        
        // This is a special handler for insurance questions to group them nicely.
        if (question.id.includes('Insurance')) {
            const baseId = question.id.replace('had', '').replace('Insurance', '').toLowerCase();
            const coverageKey = `${baseId}Coverage` as keyof typeof assessmentData;
            const endDateKey = `${baseId}CoverageEndDate` as keyof typeof assessmentData;

            const coverageValue = assessmentData?.[coverageKey];
            const endDateValue = assessmentData?.[endDateKey];

            const coverageDisplay = getDisplayValue(coverageValue);
            const endDateDisplay = getDisplayValue(endDateValue);
            
            let parts = [];
            if (coverageDisplay) parts.push(`Coverage: ${coverageDisplay}`);
            if (endDateDisplay) parts.push(`Ends: ${endDateDisplay}`);
            subText = parts.join(' | ');
        }
        
        return <AnswerDisplay label={question.label.replace('{companyName}', companyName || 'your company')} value={value} subText={subText} />
    }

    const groupedQuestions = useMemo(() => {
        const sections: Record<string, Question[]> = {};
        const qMap = new Map(questions.map(q => [q.id, q]));

        const processQuestion = (q: Question) => {
            // Only process top-level questions that have an answer.
            const hasAnswer = assessmentData?.[q.id as keyof typeof assessmentData] !== undefined;

            if (!q.parentId && hasAnswer) {
                const sectionName = q.section || "Uncategorized";
                if (!sections[sectionName]) {
                    sections[sectionName] = [];
                }
                sections[sectionName].push(q);
            }
        };

        questions.forEach(processQuestion);
        return sections;
    }, [questions, assessmentData]);
    
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
                                {section === 'Work & Employment Details' && (
                                    <AnswerDisplay label="Tenure" value={tenure} />
                                )}
                                {sectionQuestions.map(q => getGroupedAnswer(q))}
                            </dl>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
