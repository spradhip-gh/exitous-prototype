
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

interface SubDetail {
    label: string;
    value: any;
}

function AnswerDisplay({ label, value, subDetails }: { label: string; value: any, subDetails?: SubDetail[] }) {
    const displayValue = getDisplayValue(value);
    const isUnsure = value === 'Unsure';

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
                {subDetails && subDetails.length > 0 && (
                    <dl className="mt-2 space-y-1">
                        {subDetails.map(detail => {
                            const subDisplayValue = getDisplayValue(detail.value);
                            if (!subDisplayValue) return null;
                            
                            return (
                                <div key={detail.label} className="grid grid-cols-3">
                                    <dt className="text-xs text-muted-foreground col-span-1">{detail.label}</dt>
                                    <dd className="text-xs col-span-2">{subDisplayValue}</dd>
                                </div>
                            )
                        })}
                    </dl>
                )}
            </dd>
        </div>
    );
}

export default function ProfileReview() {
    const { getCompanyConfig, profileData, isLoading, getMasterQuestionConfig } = useUserData();
    const { auth } = useAuth();
    const router = useRouter();

    const companyName = auth?.companyName;
    const questions = useMemo(() => {
        return companyName ? getCompanyConfig(companyName, true, 'profile') : [];
    }, [companyName, getCompanyConfig]);

    const getAnswerComponent = (question: Question) => {
        const value = profileData?.[question.id as keyof typeof profileData];
        let subDetails: SubDetail[] = [];

        if (question.subQuestions && question.subQuestions.length > 0) {
            question.subQuestions.forEach(subQ => {
                const parentValue = profileData?.[question.id as keyof typeof profileData];
                let isTriggered = false;

                if (Array.isArray(parentValue)) {
                    isTriggered = parentValue.includes(subQ.triggerValue);
                } else {
                    isTriggered = parentValue === subQ.triggerValue;
                }
                
                if (isTriggered) {
                    const subValue = profileData?.[subQ.id as keyof typeof profileData];
                    subDetails.push({ label: subQ.label, value: subValue });
                }
            });
        }
        
        return (
            <AnswerDisplay 
                key={question.id} 
                label={question.label} 
                value={value}
                subDetails={subDetails}
            />
        )
    }

    const orderedSections = useMemo(() => {
        const sectionsMap: Record<string, Question[]> = {};
        const masterConfig = getMasterQuestionConfig('profile');
        const sectionOrder = masterConfig?.section_order || [];

        const allQuestionsWithAnswers = questions.filter(q => {
            if (q.parentId) return false;
            const value = profileData?.[q.id as keyof typeof profileData];
            return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
        });

        allQuestionsWithAnswers.forEach(q => {
            const sectionName = q.section || "Uncategorized";
            if (!sectionsMap[sectionName]) {
                sectionsMap[sectionName] = [];
            }
            sectionsMap[sectionName].push(q);
        });

        return sectionOrder
            .map(sectionName => ({
                name: sectionName,
                questions: sectionsMap[sectionName] || [],
            }))
            .filter(section => section.questions.length > 0);
    }, [questions, profileData, getMasterQuestionConfig]);
    
    const handleEditClick = (sectionId: string) => {
        router.push(`/dashboard/profile?section=${encodeURIComponent(sectionId)}`);
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div>
                <h1 className="font-headline text-3xl font-bold">Your Profile Summary</h1>
                <p className="text-muted-foreground">
                    Here are the answers you provided. You can edit any section if your details change.
                </p>
            </div>

            {orderedSections.map(({ name: section, questions: sectionQuestions }) => (
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
                            {sectionQuestions.map(q => getAnswerComponent(q))}
                        </dl>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
