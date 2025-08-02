
'use client';

import { useUserData } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { Question } from '@/lib/questions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

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
        if (value === 'Unsure') return "I'm not sure";
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

function AnswerDisplay({ label, value, subDetails, isUnsure }: { label: string; value: any, subDetails?: {label: string, value: string}[], isUnsure?: boolean }) {
    const displayValue = getDisplayValue(value);

    if (displayValue === null && (!subDetails || subDetails.length === 0)) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 py-3">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm col-span-2">
                {displayValue && (
                     <div className={cn("flex items-center gap-2", isUnsure && "text-amber-600 font-semibold")}>
                        {isUnsure && <AlertCircle className="h-4 w-4" />}
                        <span>{displayValue}</span>
                    </div>
                )}
                {subDetails && (
                    <dl className="mt-2 space-y-1">
                        {subDetails.map(detail => (
                            <div key={detail.label} className="grid grid-cols-3">
                                <dt className="text-xs text-muted-foreground col-span-1">{detail.label}</dt>
                                <dd className="text-xs col-span-2">{detail.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
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
    
    const getAnswerComponent = (question: Question) => {
        const value = assessmentData?.[question.id as keyof typeof assessmentData];
        let subDetails: { label: string, value: string }[] = [];

        // Grouping logic for specific questions
        if (question.id.includes('Insurance') || question.id.includes('hadEAP')) {
            const baseId = question.id.replace('had', '').replace('Insurance', '').toLowerCase();
            const coverageKey = `${baseId}Coverage` as keyof typeof assessmentData;
            const endDateKey = `${baseId}CoverageEndDate` as keyof typeof assessmentData;

            const coverageDisplay = getDisplayValue(assessmentData?.[coverageKey]);
            const endDateDisplay = getDisplayValue(assessmentData?.[endDateKey]);
            
            if (coverageDisplay) subDetails.push({ label: 'Coverage', value: coverageDisplay });
            if (endDateDisplay) subDetails.push({ label: 'Ends On', value: endDateDisplay });
            
        } else if (question.id === 'accessSystems' && Array.isArray(value)) {
            value.forEach(system => {
                 const key = system.split(' ')[0].toLowerCase().replace('/', '');
                 const endDateKey = `${key}AccessEndDate` as keyof typeof assessmentData;
                 const endDateValue = getDisplayValue(assessmentData?.[endDateKey]);
                 if (endDateValue) {
                     subDetails.push({ label: `${system} ends`, value: endDateValue });
                 }
            });
        }
        
        return <AnswerDisplay 
            key={question.id} 
            label={question.label.replace('{companyName}', companyName || 'your company')} 
            value={value}
            subDetails={subDetails}
            isUnsure={value === 'Unsure'}
        />
    }

    const groupedQuestions = useMemo(() => {
        const sections: Record<string, Question[]> = {};
        
        const processQuestion = (q: Question) => {
            const value = assessmentData?.[q.id as keyof typeof assessmentData];
            const hasAnswer = value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);

            if (!q.parentId && hasAnswer) {
                const sectionName = q.section || "Uncategorized";
                if (!sections[sectionName]) {
                    sections[sectionName] = [];
                }
                sections[sectionName].push(q);
            }

            if (q.subQuestions) {
                q.subQuestions.forEach(processQuestion);
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
                                {sectionQuestions.map(q => getAnswerComponent(q))}
                            </dl>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
