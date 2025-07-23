

'use client';

import { useEffect, useState, useMemo } from 'react';
import TimelineDashboard from '@/components/dashboard/TimelineDashboard';
import { useUserData, CompanyAssignment } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import WelcomeSummary from '@/components/dashboard/WelcomeSummary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInDays, isSameDay, startOfToday, startOfMonth, addMonths, subMonths, differenceInMonths } from 'date-fns';
import { format as formatInTz } from 'date-fns-tz';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, CalendarX2, Stethoscope, Eye, HandCoins, Key, Info, ChevronDown, Layers, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgressTracker from '@/components/dashboard/ProgressTracker';


const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    // The date from the hook is already a Date object.
    return format(date, 'PPP');
};

type KeyDateItem = {
    label: string;
    date: Date;
    icon: React.ElementType;
    tooltip: string | null;
    isCustom?: boolean;
};

function ImportantDates() {
    const { assessmentData, companyAssignments, getTargetTimezone, customDeadlines } = useUserData();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const userTimezone = getTargetTimezone();

    const companyDetails = useMemo(() => {
        if (!assessmentData?.companyName) return null;
        return companyAssignments.find(c => c.companyName === assessmentData.companyName) || null;
    }, [assessmentData, companyAssignments]);

    const keyDates: KeyDateItem[] = useMemo(() => {
        const parseAndCorrectDate = (date: any): Date | null => {
            if (!date) return null;
            if (date instanceof Date && !isNaN(date.getTime())) return date;
            if (typeof date === 'string') {
                try {
                    let parsedDate = parseISO(date);
                    if (!isNaN(parsedDate.getTime())) return parsedDate;
                    
                    const [year, month, day] = date.split('-').map(Number);
                    if (!year || !month || !day) return null;
                    return new Date(year, month - 1, day);
                } catch { return null; }
            }
            return null;
        };

        const severanceDeadlineTooltip = companyDetails
            ? `Deadline is at ${companyDetails.severanceDeadlineTime || '23:59'} in the ${userTimezone} timezone.`
            : 'Deadline time and timezone are set by the company.';

        let allDatesRaw: (KeyDateItem | null)[] = [
            { label: 'Exit Notification', date: parseAndCorrectDate(assessmentData?.notificationDate), icon: Bell, tooltip: null },
            { label: 'Final Day of Employment', date: parseAndCorrectDate(assessmentData?.finalDate), icon: CalendarX2, tooltip: null },
            { label: 'Severance Agreement Deadline', date: parseAndCorrectDate(assessmentData?.severanceAgreementDeadline), icon: Key, tooltip: severanceDeadlineTooltip },
            { label: 'Medical Coverage Ends', date: parseAndCorrectDate(assessmentData?.medicalCoverageEndDate), icon: Stethoscope, tooltip: null },
            { label: 'Dental Coverage Ends', date: parseAndCorrectDate(assessmentData?.dentalCoverageEndDate), icon: Stethoscope, tooltip: null },
            { label: 'Vision Coverage Ends', date: parseAndCorrectDate(assessmentData?.visionCoverageEndDate), icon: Eye, tooltip: null },
            { label: 'EAP Coverage Ends', date: parseAndCorrectDate(assessmentData?.eapCoverageEndDate), icon: HandCoins, tooltip: null },
        ];
        
        Object.entries(customDeadlines).forEach(([id, { label, date }]) => {
          allDatesRaw.push({
            label,
            date: parseAndCorrectDate(date),
            icon: CalendarPlus,
            tooltip: 'Your custom deadline',
            isCustom: true,
          });
        });

        const filteredDates = allDatesRaw.filter((d): d is KeyDateItem => d !== null && d.date !== null);

        const priorityOrder = ['Exit Notification', 'Final Day of Employment', 'Severance Agreement Deadline'];
        const eapLabel = 'EAP Coverage Ends';

        return filteredDates.sort((a, b) => {
            const aIsEAP = a.label === eapLabel;
            const bIsEAP = b.label === eapLabel;
            if (aIsEAP && !bIsEAP) return 1;
            if (!aIsEAP && bIsEAP) return -1;

            const aIndex = priorityOrder.indexOf(a.label);
            const bIndex = priorityOrder.indexOf(b.label);

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            return a.date!.getTime() - b.date!.getTime();
        });
    }, [assessmentData, companyDetails, userTimezone, customDeadlines]);
    
    const sortedKeyDatesForTable = useMemo(() => {
        return [...keyDates].sort((a,b) => a.date.getTime() - b.date.getTime());
    }, [keyDates]);

    const timelineMetrics = useMemo(() => {
        const today = startOfToday();
        
        if (keyDates.length === 0) {
            const minDate = subMonths(today, 1);
            const maxDate = addMonths(today, 2);
            const totalDuration = differenceInDays(maxDate, minDate);
            return { minDate, maxDate, totalDuration, today };
        }
        
        const datesOnly = keyDates.map(d => d.date!);

        const earliestDate = new Date(Math.min(...datesOnly.map(d => d.getTime())));
        const latestDate = new Date(Math.max(...datesOnly.map(d => d.getTime())));

        const minDate = subMonths(earliestDate, 1);
        const maxDate = addMonths(latestDate, 1);

        const totalDuration = differenceInDays(maxDate, minDate);
        if (totalDuration <= 0) return null;

        return { minDate, maxDate, totalDuration, today };
    }, [keyDates]);
    
    const monthMarkers = useMemo(() => {
        if (!timelineMetrics) return [];
        const { minDate, maxDate, totalDuration } = timelineMetrics;
        const markers = [];
        let currentDate = startOfMonth(minDate);

        while (currentDate <= maxDate) {
            if (currentDate >= minDate) { // Only add markers after the timeline starts
                const daysFromStart = differenceInDays(currentDate, minDate);
                const position = totalDuration > 0 ? (daysFromStart / totalDuration) * 100 : 0;
                if (position >= 0 && position <= 100) {
                    markers.push({
                        label: format(currentDate, 'MMM'),
                        position: position,
                        key: currentDate.toISOString(),
                    });
                }
            }
            // Move to the first day of the next month
            currentDate = addMonths(currentDate, 1);
        }
        return markers;
    }, [timelineMetrics]);


    const groupedAndPositionedDates = useMemo(() => {
        if (!timelineMetrics) return [];
        const { totalDuration, minDate } = timelineMetrics;
        const groups: { [key: string]: KeyDateItem[] } = {};

        keyDates.forEach(item => {
            const dateKey = item.date.toISOString().split('T')[0];
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
        });

        let lastPosition = -100;
        let level = 0;
        const positions: { items: KeyDateItem[], position: number, level: number }[] = [];

        Object.values(groups).sort((a,b) => a[0].date.getTime() - b[0].date.getTime()).forEach(items => {
            const daysFromStart = differenceInDays(items[0].date, minDate);
            const currentPosition = totalDuration > 0 ? (daysFromStart / totalDuration) * 100 : 0;
            
            if (currentPosition < 0 || currentPosition > 100) return; // Don't render items outside the timeline bounds

            if (currentPosition < lastPosition + 12) {
                level = 1 - level;
            } else {
                level = 0;
            }
            positions.push({ items, position: currentPosition, level });
            lastPosition = currentPosition;
        });

        return positions;
    }, [keyDates, timelineMetrics]);

    if (!assessmentData) return null;

    if (keyDates.length === 0) {
      return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Key Dates Timeline</CardTitle>
                <CardDescription>A visual overview of your critical deadlines will appear here once you provide dates in your exit details.</CardDescription>
            </CardHeader>
             <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <p>No dates to display yet.</p>
                </div>
            </CardContent>
        </Card>
      )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Key Dates Timeline</CardTitle>
                <CardDescription>A visual overview of your critical deadlines.</CardDescription>
            </CardHeader>
            <CardContent>
                {timelineMetrics && (
                    <div className="w-full pt-10 pb-10 px-2">
                        <div className="relative h-1 bg-border rounded-full">
                           {monthMarkers.map(marker => (
                                <div
                                    key={marker.key}
                                    className="absolute -top-5 flex flex-col items-center"
                                    style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
                                >
                                    <span className="text-xs text-muted-foreground">{marker.label}</span>
                                    <div className="h-2 w-0.5 bg-border mt-1"></div>
                                </div>
                            ))}
                            <TooltipProvider>
                                {groupedAndPositionedDates.map(({ items, position, level }) => {
                                    const verticalPositionClass = level === 0 ? "top-4" : "bottom-4";
                                    const isCluster = items.length > 1;
                                    const Icon = isCluster ? Layers : items[0].icon;

                                    return (
                                        <div
                                            key={items[0].date.toISOString()}
                                            className={cn("absolute flex flex-col items-center gap-1 cursor-pointer", verticalPositionClass)}
                                            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-4 ring-background transition-transform hover:scale-110 relative">
                                                        <Icon className="h-5 w-5 text-primary-foreground" />
                                                        {isCluster && <Badge variant="destructive" className="absolute -top-1 -right-2 scale-75">{items.length}</Badge>}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-center">{formatDate(items[0].date)}</p>
                                                        {items.map(item => {
                                                            const ItemIcon = item.icon;
                                                            return(
                                                            <div key={item.label} className="flex items-center gap-2">
                                                                <ItemIcon className="h-4 w-4" />
                                                                <span>{item.label}</span>
                                                            </div>
                                                        )})}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    );
                                })}

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="absolute -top-2 flex flex-col items-center cursor-pointer"
                                            style={{
                                                left: `${(differenceInDays(timelineMetrics.today, timelineMetrics.minDate) / timelineMetrics.totalDuration) * 100}%`,
                                                transform: 'translateX(-50%)'
                                            }}
                                        >
                                            <div className="h-4 w-0.5 bg-destructive"></div>
                                            <div className="text-xs font-bold text-destructive -mt-1">TODAY</div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{formatDate(timelineMetrics.today)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                )}
                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <CollapsibleTrigger asChild>
                        <div className="flex justify-center mt-4">
                            <Button variant="ghost" className="text-sm">
                                {isDetailsOpen ? 'Hide Details' : 'Show Details'}
                                <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", isDetailsOpen && "rotate-180")} />
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <Table className="mt-2">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedKeyDatesForTable.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <span>{item.label}</span>
                                                    {item.tooltip && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{item.tooltip}</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatDate(item.date!)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const { auth } = useAuth();
  const { profileData, isLoading, assessmentData, isAssessmentComplete } = useUserData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasPrefilledData = !!assessmentData;
  const isProfileComplete = !!profileData;
  const isReadyForTimeline = isProfileComplete && isAssessmentComplete;

  if (!isClient || isLoading) {
    return (
      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }
  
  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground">
            {isReadyForTimeline
              ? "Here’s a timeline of recommended actions based on your details."
              : "Complete your profile and assessment to unlock your personalized plan."}
          </p>
        </div>

        {isReadyForTimeline ? (
          <>
            <ImportantDates />
            <TimelineDashboard />
          </>
        ) : (hasPrefilledData && !isProfileComplete) ? (
          <>
            <WelcomeSummary />
            <ProgressTracker />
          </>
        ) : (
          <ProgressTracker />
        )}
      </div>
    </main>
  )
}
