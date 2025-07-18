
'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, parse, differenceInDays, isSameDay, startOfToday, parseISO, startOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useUserData, CompanyAssignment } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar, ListChecks, Briefcase, HeartHandshake, Banknote, Scale, Edit, Bell, CalendarX2, Stethoscope, Smile, Eye, HandCoins, Key, Info, ChevronDown, Layers, PlusCircle, CalendarPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import DailyBanner from './DailyBanner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

const categoryIcons: { [key: string]: React.ElementType } = {
  "Healthcare": Stethoscope,
  "Finances": Banknote,
  "Job Search": ListChecks,
  "Legal": Scale,
  "Well-being": HeartHandshake,
  "Custom": CalendarPlus,
  "default": Calendar,
};

export default function TimelineDashboard({ isPreview = false }: { isPreview?: boolean }) {
  const { 
    profileData, 
    assessmentData, 
    completedTasks, 
    toggleTaskCompletion,
    taskDateOverrides,
    updateTaskDate,
    companyAssignments,
    customDeadlines,
    addCustomDeadline
  } = useUserData();

  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [isAddDateOpen, setIsAddDateOpen] = useState(false);
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDate, setNewDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const userTimezone = useMemo(() => {
    if (!assessmentData?.companyName || !companyAssignments) return 'UTC';
    return companyAssignments.find(c => c.companyName === assessmentData.companyName)?.severanceDeadlineTimezone || 'UTC';
  }, [assessmentData?.companyName, companyAssignments]);

  const companyDetails = useMemo(() => {
    if (!assessmentData?.companyName) return null;
    return companyAssignments.find(c => c.companyName === assessmentData.companyName) || null;
  }, [assessmentData, companyAssignments]);


  useEffect(() => {
    const fetchRecommendations = async () => {
      if (isPreview) {
        setIsLoading(false);
        return;
      }
      
      if (!profileData || !assessmentData) {
        setIsLoading(false);
        return;
      }
      
      const effectiveProfileData = profileData || {
          birthYear: 1990, state: 'N/A', gender: 'N/A', maritalStatus: 'N/A',
          hasChildrenUnder13: false, hasExpectedChildren: false, impactedPeopleCount: '0',
          livingStatus: 'N/A', citizenshipStatus: 'N/A', pastLifeEvents: [], hasChildrenAges18To26: false,
      };

      try {
        setIsLoading(true);
        setError(null);
        
        const transformedProfileData = {
          birthYear: effectiveProfileData.birthYear,
          state: effectiveProfileData.state,
          gender: effectiveProfileData.gender === 'Prefer to self-describe' ? effectiveProfileData.genderSelfDescribe! : effectiveProfileData.gender,
          maritalStatus: effectiveProfileData.maritalStatus,
          hasChildrenUnder13: String(effectiveProfileData.hasChildrenUnder13).startsWith('Yes'),
          hasExpectedChildren: String(effectiveProfileData.hasExpectedChildren).startsWith('Yes'),
          impactedPeopleCount: effectiveProfileData.impactedPeopleCount,
          livingStatus: effectiveProfileData.livingStatus,
          citizenshipStatus: effectiveProfileData.citizenshipStatus,
          pastLifeEvents: effectiveProfileData.pastLifeEvents,
          hasChildrenAges18To26: String(effectiveProfileData.hasChildrenAges18To26).startsWith('Yes'),
        };
        
        const stringifiedAssessmentData: Record<string, any> = { ...assessmentData };
        Object.keys(assessmentData).forEach(key => {
            const value = (assessmentData as any)[key];
            if (value instanceof Date) {
                stringifiedAssessmentData[key] = value.toISOString();
            }
        });


        const result = await getPersonalizedRecommendations({
          profileData: transformedProfileData,
          layoffDetails: stringifiedAssessmentData,
        });
        setRecommendations(result);
      } catch (e) {
        console.error(e);
        setError('Failed to generate personalized recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [profileData, assessmentData, isPreview]);

  const sortedRecommendations = useMemo(() => {
    if (!recommendations?.recommendations) {
      return [];
    }

    const getDateValue = (dateStr: string | undefined) => {
      if (!dateStr) return Infinity;
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).getTime();
    };

    return [...recommendations.recommendations].sort((a, b) => {
      const aDate = taskDateOverrides[a.taskId] || a.endDate;
      const bDate = taskDateOverrides[b.taskId] || b.endDate;
      
      const aValue = getDateValue(aDate);
      const bValue = getDateValue(bDate);

      const aHasDate = aValue !== Infinity;
      const bHasDate = bValue !== Infinity;

      if (aHasDate && bHasDate) return aValue - bValue;
      if (aHasDate) return -1;
      if (bHasDate) return 1;
      
      return 0;
    });
  }, [recommendations, taskDateOverrides]);

  const recommendationCategories = useMemo(() => {
    if (!sortedRecommendations) return [];
    const categories = new Set(sortedRecommendations.map(r => r.category));
    return Array.from(categories);
  }, [sortedRecommendations]);

  const filteredRecommendations = useMemo(() => {
    if (!activeCategory) {
      return sortedRecommendations;
    }
    return sortedRecommendations.filter(r => r.category === activeCategory);
  }, [sortedRecommendations, activeCategory]);

  const handleAddDate = () => {
    if (!newDateLabel || !newDate) {
      toast({ title: "Missing information", description: "Please provide a label and a date.", variant: "destructive" });
      return;
    }
    const id = `custom-${Date.now()}`;
    addCustomDeadline(id, { label: newDateLabel, date: newDate.toISOString().split('T')[0] });
    toast({ title: "Date Added", description: `"${newDateLabel}" has been added to your timeline.` });
    setNewDateLabel('');
    setNewDate(undefined);
    setIsAddDateOpen(false);
  };

  if (isLoading && !isPreview) {
    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <LoadingSkeleton />
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <ErrorAlert message={error} />
            </div>
        </div>
    );
  }
  
  const hasRecommendations = filteredRecommendations.length > 0;

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        {!isPreview && (
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <h1 className="font-headline text-3xl font-bold">Your Dashboard</h1>
                <p className="text-muted-foreground">
                  Here’s a timeline of recommended actions based on your details.
                </p>
              </div>
          </div>
        )}
        
        {!isPreview && <DailyBanner />}

        <ImportantDates 
          assessmentData={assessmentData} 
          companyDetails={companyDetails} 
          userTimezone={userTimezone}
          customDeadlines={customDeadlines}
        />

        {!isPreview && sortedRecommendations.length > 0 && (
            <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-2xl">Your Personalized Next Steps</CardTitle>
                      <CardDescription>
                          A tailored list of actions to guide you through your exit.
                      </CardDescription>
                    </div>
                     <Dialog open={isAddDateOpen} onOpenChange={setIsAddDateOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline"><PlusCircle className="mr-2"/> Add Custom Date</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add a Custom Date</DialogTitle>
                          <DialogDescription>Add a personal event or deadline to your timeline.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="date-label">Event Label</Label>
                            <Input id="date-label" value={newDateLabel} onChange={(e) => setNewDateLabel(e.target.value)} placeholder="e.g., Follow up with recruiter" />
                          </div>
                          <div className="space-y-2">
                            <Label>Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {newDate ? format(newDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={newDate} onSelect={setNewDate} initialFocus /></PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddDateOpen(false)}>Cancel</Button>
                          <Button onClick={handleAddDate}>Add to Timeline</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                        <Button variant={!activeCategory ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(null)}>All</Button>
                        {recommendationCategories.map(category => (
                            <Button key={category} variant={activeCategory === category ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(category)}>{category}</Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                        <TabsTrigger value="table">Table View</TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline" className="mt-6">
                            {hasRecommendations ? (
                                <Timeline 
                                    recommendations={filteredRecommendations} 
                                    completedTasks={completedTasks}
                                    toggleTaskCompletion={toggleTaskCompletion}
                                    taskDateOverrides={taskDateOverrides}
                                    updateTaskDate={updateTaskDate}
                                    userTimezone={userTimezone}
                                />
                             ) : (
                                <p className="text-center text-muted-foreground py-8">No recommendations in this category.</p>
                             )}
                        </TabsContent>
                        <TabsContent value="table" className="mt-6">
                             {hasRecommendations ? (
                                <RecommendationsTable 
                                    recommendations={filteredRecommendations} 
                                    completedTasks={completedTasks}
                                    toggleTaskCompletion={toggleTaskCompletion}
                                    taskDateOverrides={taskDateOverrides}
                                    updateTaskDate={updateTaskDate}
                                    userTimezone={userTimezone}
                                />
                             ) : (
                                <p className="text-center text-muted-foreground py-8">No recommendations in this category.</p>
                             )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    const [year, month, day] = date.toISOString().split('T')[0].split('-').map(Number);
    const correctedDate = new Date(year, month - 1, day);
    return format(correctedDate, 'PPP');
};

type KeyDateItem = {
    label: string;
    date: Date;
    icon: React.ElementType;
    tooltip: string | null;
    isCustom?: boolean;
};


function ImportantDates({ assessmentData, companyDetails, userTimezone, customDeadlines }: { 
  assessmentData: any, 
  companyDetails: CompanyAssignment | null, 
  userTimezone: string,
  customDeadlines: Record<string, { label: string; date: string }>
}) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const keyDates: KeyDateItem[] = useMemo(() => {
        const parseAndCorrectDate = (date: any): Date | null => {
            if (!date) return null;
            if (date instanceof Date && !isNaN(date.getTime())) return date;
            if (typeof date === 'string') {
                const parsed = parseISO(date);
                if (!isNaN(parsed.getTime())) return parsed;
            }
            return null;
        };

        const severanceDeadlineTooltip = companyDetails
            ? `Deadline is at ${companyDetails.severanceDeadlineTime || '23:59'} in the ${userTimezone} timezone.`
            : 'Deadline time and timezone are set by the company.';

        let allDatesRaw: KeyDateItem[] = [
            { label: 'Exit Notification', date: parseAndCorrectDate(assessmentData?.notificationDate), icon: Bell, tooltip: null },
            { label: 'Final Day of Employment', date: parseAndCorrectDate(assessmentData?.finalDate), icon: CalendarX2, tooltip: null },
            { label: 'Severance Agreement Deadline', date: parseAndCorrectDate(assessmentData?.severanceAgreementDeadline), icon: Key, tooltip: severanceDeadlineTooltip },
            { label: 'Medical Coverage Ends', date: parseAndCorrectDate(assessmentData?.medicalCoverageEndDate), icon: Stethoscope, tooltip: null },
            { label: 'Dental Coverage Ends', date: parseAndCorrectDate(assessmentData?.dentalCoverageEndDate), icon: Smile, tooltip: null },
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

        const filteredDates = allDatesRaw.filter((d): d is KeyDateItem => d.date !== null);

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

    const timelineMetrics = useMemo(() => {
        if (keyDates.length === 0) return null;

        const today = startOfToday();
        const datesOnly = keyDates.map(d => d.date!);

        const minDate = new Date(Math.min(today.getTime(), ...datesOnly.map(d => d.getTime())));
        const maxDate = new Date(Math.max(today.getTime(), ...datesOnly.map(d => d.getTime())));

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
                markers.push({
                    label: format(currentDate, 'MMM'),
                    position: position,
                    key: currentDate.toISOString(),
                });
            }
            // Move to the first day of the next month
            currentDate.setMonth(currentDate.getMonth() + 1);
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

    if (!assessmentData || keyDates.length === 0) return null;

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
                                {keyDates.map((item, index) => {
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


function LoadingSkeleton() {
  return (
    <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

type RecommendationProps = {
    recommendations: RecommendationItem[];
    completedTasks: Set<string>;
    toggleTaskCompletion: (taskId: string) => void;
    taskDateOverrides: Record<string, string>;
    updateTaskDate: (taskId: string, newDate: Date) => void;
    userTimezone: string;
}

function Timeline({ recommendations, completedTasks, toggleTaskCompletion, taskDateOverrides, updateTaskDate, userTimezone }: RecommendationProps) {
  if (!recommendations || recommendations.length === 0) {
    return <p className="text-muted-foreground text-center">No recommendations available.</p>;
  }

  const handleDateSelect = (taskId: string, date: Date | undefined) => {
    if (date) {
        const [year, month, day] = format(date, 'yyyy-MM-dd').split('-').map(Number);
        const correctedDate = new Date(year, month-1, day);
        updateTaskDate(taskId, correctedDate);
    }
  };

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
      {recommendations.map((item, index) => {
        const Icon = categoryIcons[item.category] || categoryIcons.default;
        const isCompleted = completedTasks.has(item.taskId);
        const overriddenDateStr = taskDateOverrides[item.taskId];
        const rawDateStr = overriddenDateStr || item.endDate;
        let displayDate: Date | null = null;
        if(rawDateStr) {
            const [year, month, day] = rawDateStr.split('-').map(Number);
            displayDate = new Date(year, month-1, day);
        }

        return (
          <div key={item.taskId || index} className="relative mb-8 flex items-start gap-4">
             <div className="absolute left-0 top-1">
              <Checkbox 
                id={`task-timeline-${item.taskId}`}
                checked={isCompleted}
                onCheckedChange={() => toggleTaskCompletion(item.taskId)}
                className="h-6 w-6 rounded-full"
              />
            </div>
            <div className="absolute left-3 top-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-8 ring-background -translate-x-1/2">
               <Icon className={cn("h-4 w-4 text-primary-foreground", isCompleted && "text-gray-400")} />
            </div>
            <div className={cn("pl-8 pt-0.5 w-full", isCompleted && "text-muted-foreground line-through")}>
              <p className="text-sm font-semibold">{item.timeline}</p>
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-base font-semibold">{item.task}</p>
                 <Badge variant={isCompleted ? 'outline' : 'secondary'}>{item.category}</Badge>
              </div>
              <p className="text-sm">{item.details}</p>
               {displayDate && (
                  <div className="flex items-center gap-1 text-sm mt-2 font-medium text-destructive/80">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatInTimeZone(displayDate, userTimezone, "PPP")}</span>
                     {!isCompleted && <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker
                          mode="single"
                          selected={displayDate}
                          onSelect={(date) => handleDateSelect(item.taskId, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>}
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function RecommendationsTable({ recommendations, completedTasks, toggleTaskCompletion, taskDateOverrides, updateTaskDate, userTimezone }: RecommendationProps) {
    if (!recommendations || recommendations.length === 0) {
      return <p className="text-muted-foreground text-center">No recommendations available.</p>;
    }

    const handleDateSelect = (taskId: string, date: Date | undefined) => {
        if (date) {
            const [year, month, day] = format(date, 'yyyy-MM-dd').split('-').map(Number);
            const correctedDate = new Date(year, month-1, day);
            updateTaskDate(taskId, correctedDate);
        }
    };

    return (
        <Card>
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[200px]">Timeline / Due Date</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {recommendations.map((item, index) => {
                    const isCompleted = completedTasks.has(item.taskId);
                    const overriddenDateStr = taskDateOverrides[item.taskId];
                    const rawDateStr = overriddenDateStr || item.endDate;
                    let displayDate: Date | null = null;
                    if(rawDateStr) {
                        const [year, month, day] = rawDateStr.split('-').map(Number);
                        displayDate = new Date(year, month-1, day);
                    }
                    
                    return (
                      <TableRow key={item.taskId || index} data-completed={isCompleted}>
                          <TableCell className="text-center">
                            <Checkbox 
                                id={`task-table-${item.taskId}`}
                                checked={isCompleted}
                                onCheckedChange={() => toggleTaskCompletion(item.taskId)}
                             />
                          </TableCell>
                          <TableCell className={cn(isCompleted && "text-muted-foreground line-through")}>
                            <p className="font-medium">{item.task}</p>
                            <p className="text-xs text-muted-foreground">{item.details}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCompleted ? 'outline' : 'secondary'}>{item.category}</Badge>
                          </TableCell>
                          <TableCell className={cn(isCompleted && "text-muted-foreground line-through")}>
                            {displayDate ? (
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    <span>{formatInTimeZone(displayDate, userTimezone, "PPP")}</span>
                                     {!isCompleted && <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Edit className="h-3 w-3" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarPicker
                                                mode="single"
                                                selected={displayDate}
                                                onSelect={(date) => handleDateSelect(item.taskId, date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>}
                                </div>
                            ) : (
                                <p>{item.timeline}</p>
                            )}
                          </TableCell>
                      </TableRow>
                  )})}
              </TableBody>
          </Table>
        </Card>
    );
}
