
'use client';

import { useMemo } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import AssessmentForm from '@/components/assessment/AssessmentForm';
import AssessmentReview from '@/components/assessment/AssessmentReview';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function AssessmentPage() {
    const { isAssessmentComplete, isLoading } = useUserData();

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

        if (isAssessmentComplete) {
            return <AssessmentReview />;
        }
        
        return <AssessmentForm />;

    }, [isAssessmentComplete, isLoading]);
    
    return Content;
}
