
'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import AssessmentForm from '@/components/assessment/AssessmentForm';
import AssessmentReview from '@/components/assessment/AssessmentReview';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

function AssessmentPageContent() {
    const { isAssessmentComplete, isLoading } = useUserData();
    const searchParams = useSearchParams();
    const isEditingSection = searchParams.has('section');

    const Content = useMemo(() => {
        if (isLoading) {
            return (
                 <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                            <CardContent className="space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        // If a specific section is requested for editing, always show the form.
        if (isEditingSection) {
            return <AssessmentForm />;
        }

        if (isAssessmentComplete) {
            return <AssessmentReview />;
        }
        
        return <AssessmentForm />;

    }, [isAssessmentComplete, isLoading, isEditingSection]);
    
    return Content;
}

export default function AssessmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AssessmentPageContent />
        </Suspense>
    );
}
