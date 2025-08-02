
'use client';

import { useUserData } from '@/hooks/use-user-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { differenceInDays, differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { Briefcase, Calendar, Clock } from 'lucide-react';

export default function AssessmentSummaryCard() {
    const { assessmentData } = useUserData();

    if (!assessmentData?.startDate || !assessmentData?.finalDate) {
        return null;
    }

    const calculateTenure = () => {
        try {
            const start = assessmentData.startDate instanceof Date ? assessmentData.startDate : parseISO(assessmentData.startDate as string);
            const end = assessmentData.finalDate instanceof Date ? assessmentData.finalDate : parseISO(assessmentData.finalDate as string);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return "N/A";
            }
            
            const years = differenceInYears(end, start);
            const months = differenceInMonths(end, start) % 12;
            const remainingDays = differenceInDays(end, new Date(start.getFullYear() + years, start.getMonth() + months));
            
            const parts = [];
            if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
            if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
            if (remainingDays > 0) parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);

            return parts.length > 0 ? parts.join(', ') : "Less than a day";

        } catch (e) {
            console.error("Error calculating tenure", e);
            return "N/A";
        }
    };
    
    const tenure = calculateTenure();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Employment Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex items-start gap-3">
                    <div className="bg-muted p-3 rounded-lg">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Tenure</p>
                        <p className="text-lg font-semibold">{tenure}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Work Status</p>
                        <p className="text-lg font-semibold">{assessmentData.workStatus || 'N/A'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

