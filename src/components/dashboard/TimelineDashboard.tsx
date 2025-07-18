
'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, parse } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useUserData, CompanyAssignment } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar, ListChecks, Briefcase, HeartHandshake, Banknote, Scale, Edit, Bell, CalendarX2, Stethoscope, Smile, Eye, HandCoins, Key, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import DailyBanner from './DailyBanner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const categoryIcons: { [key: string]: React.ElementType } = {
  "Healthcare": Stethoscope,
  "Finances": Banknote,
  "Job Search": ListChecks,
  "Legal": Scale,
  "Well-being": HeartHandshake,
  "default": Calendar,
};

export default function TimelineDashboard() {
  const { 
    profileData, 
    assessmentData, 
    completedTasks, 
    toggleTaskCompletion,
    taskDateOverrides,
    updateTaskDate,
    companyAssignments,
  } = useUserData();

  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
      if (!profileData || !assessmentData) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const transformedProfileData = {
          birthYear: profileData.birthYear,
          state: profileData.state,
          gender: profileData.gender === 'Prefer to self-describe' ? profileData.genderSelfDescribe! : profileData.gender,
          maritalStatus: profileData.maritalStatus,
          hasChildrenUnder13: profileData.hasChildrenUnder13.startsWith('Yes'),
          hasExpectedChildren: profileData.hasExpectedChildren.startsWith('Yes'),
          impactedPeopleCount: profileData.impactedPeopleCount,
          livingStatus: profileData.livingStatus,
          citizenshipStatus: profileData.citizenshipStatus,
          pastLifeEvents: profileData.pastLifeEvents,
          hasChildrenAges18To26: profileData.hasChildrenAges18To26.startsWith('Yes'),
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
  }, [profileData, assessmentData]);

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

  if (isLoading) {
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
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div>
              <h1 className="font-headline text-3xl font-bold">Your Dashboard</h1>
              <p className="text-muted-foreground">
                Here’s a timeline of recommended actions based on your details.
              </p>
            </div>
        </div>
        
        <DailyBanner />

        {assessmentData && <ImportantDates assessmentData={assessmentData} companyDetails={companyDetails} userTimezone={userTimezone} />}

        {sortedRecommendations.length > 0 && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Your Personalized Next Steps</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
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

function ImportantDates({ assessmentData, companyDetails, userTimezone }: { assessmentData: any, companyDetails: CompanyAssignment | null, userTimezone: string }) {
    if (!assessmentData) return null;
    
    const formatDate = (date: Date): string => {
        if (!date || isNaN(date.getTime())) return 'N/A';
        const [year, month, day] = date.toISOString().split('T')[0].split('-').map(Number);
        const correctedDate = new Date(year, month - 1, day);
        return format(correctedDate, 'PPP');
    };

    const severanceDeadlineTooltip = companyDetails
      ? `Deadline is at ${companyDetails.severanceDeadlineTime || '23:59'} in the ${userTimezone} timezone.`
      : 'Deadline time and timezone are set by the company.';

    const allDatesRaw = [
        { label: 'Exit Notification', date: assessmentData.notificationDate, icon: Bell },
        { label: 'Final Day of Employment', date: assessmentData.finalDate, icon: CalendarX2 },
        { label: 'Severance Agreement Deadline', date: assessmentData.severanceAgreementDeadline, icon: Key, tooltip: severanceDeadlineTooltip },
        { label: 'Medical Coverage Ends', date: assessmentData.medicalCoverageEndDate, icon: Stethoscope },
        { label: 'Dental Coverage Ends', date: assessmentData.dentalCoverageEndDate, icon: Smile },
        { label: 'Vision Coverage Ends', date: assessmentData.visionCoverageEndDate, icon: Eye },
        { label: 'EAP Coverage Ends', date: assessmentData.eapCoverageEndDate, icon: HandCoins },
    ].filter(d => d.date && !isNaN(new Date(d.date).getTime()));
    
    const priorityOrder = ['Exit Notification', 'Final Day of Employment', 'Severance Agreement Deadline'];
    const eapLabel = 'EAP Coverage Ends';

    const sortedDates = allDatesRaw.sort((a, b) => {
        const aIsEAP = a.label === eapLabel;
        const bIsEAP = b.label === eapLabel;
        if (aIsEAP && !bIsEAP) return 1;
        if (!aIsEAP && bIsEAP) return -1;
        
        const aIndex = priorityOrder.indexOf(a.label);
        const bIndex = priorityOrder.indexOf(b.label);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
    });

    if (sortedDates.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Key Dates</CardTitle>
                <CardDescription>A timeline of critical deadlines based on your assessment.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative pl-4">
                    <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
                    <TooltipProvider>
                    {sortedDates.map(({ label, date, icon: Icon, tooltip }, index) => (
                        <div key={label} className="relative mb-6 flex items-start gap-4">
                             <div className="absolute left-9 top-1/2 h-4 w-4 rounded-full bg-primary ring-4 ring-background -translate-x-1/2 -translate-y-1/2"></div>
                             <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div className="pt-1">
                                <p className="font-semibold">{label}</p>
                                <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
                                {tooltip && (
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{tooltip}</p>
                                    </TooltipContent>
                                    </Tooltip>
                                )}
                                </div>
                            </div>
                        </div>
                    ))}
                    </TooltipProvider>
                </div>
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
