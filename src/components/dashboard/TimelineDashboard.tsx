'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUserData } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar, ListChecks, Briefcase, HeartHandshake, Banknote, Scale, Edit, Bell, CalendarX2, Stethoscope, Smile, Eye, HandCoins, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

const categoryIcons: { [key: string]: React.ElementType } = {
  "Healthcare": Briefcase,
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
    clearData,
  } = useUserData();

  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleClearData = () => {
    clearData();
    window.location.reload();
  };

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

        const transformedAssessmentData = {
          ...assessmentData,
          startDate: assessmentData.startDate?.toISOString(),
          notificationDate: assessmentData.notificationDate?.toISOString(),
          finalDate: assessmentData.finalDate?.toISOString(),
          relocationDate: assessmentData.relocationDate?.toISOString(),
          internalMessagingAccessEndDate: assessmentData.internalMessagingAccessEndDate?.toISOString(),
          emailAccessEndDate: assessmentData.emailAccessEndDate?.toISOString(),
          networkDriveAccessEndDate: assessmentData.networkDriveAccessEndDate?.toISOString(),
          layoffPortalAccessEndDate: assessmentData.layoffPortalAccessEndDate?.toISOString(),
          hrPayrollSystemAccessEndDate: assessmentData.hrPayrollSystemAccessEndDate?.toISOString(),
          medicalCoverageEndDate: assessmentData.medicalCoverageEndDate?.toISOString(),
          dentalCoverageEndDate: assessmentData.dentalCoverageEndDate?.toISOString(),
          visionCoverageEndDate: assessmentData.visionCoverageEndDate?.toISOString(),
          eapCoverageEndDate: assessmentData.eapCoverageEndDate?.toISOString(),
        };

        const result = await getPersonalizedRecommendations({
          profileData: transformedProfileData,
          layoffDetails: transformedAssessmentData,
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
  
  const hasRecommendations = recommendations && recommendations.recommendations.length > 0;

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
            <div className="flex flex-row gap-2 flex-shrink-0 flex-wrap">
              <Link href="/profile" passHref>
                  <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                  </Button>
              </Link>
              <Link href="/assessment" passHref>
                  <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Assessment
                  </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved profile and assessment data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Yes, Start Over
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
        </div>

        {assessmentData && <ImportantDates assessmentData={assessmentData} />}

        {hasRecommendations && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Your Personalized Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                        <TabsTrigger value="table">Table View</TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline" className="mt-6">
                            <Timeline 
                                recommendations={recommendations.recommendations} 
                                completedTasks={completedTasks}
                                toggleTaskCompletion={toggleTaskCompletion}
                                taskDateOverrides={taskDateOverrides}
                                updateTaskDate={updateTaskDate}
                            />
                        </TabsContent>
                        <TabsContent value="table" className="mt-6">
                            <RecommendationsTable 
                                recommendations={recommendations.recommendations} 
                                completedTasks={completedTasks}
                                toggleTaskCompletion={toggleTaskCompletion}
                                taskDateOverrides={taskDateOverrides}
                                updateTaskDate={updateTaskDate}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

function ImportantDates({ assessmentData }) {
    if (!assessmentData) return null;

    const dates = [
        { label: 'Layoff Notification', date: assessmentData.notificationDate, icon: Bell },
        { label: 'Final Day of Employment', date: assessmentData.finalDate, icon: CalendarX2 },
        { label: 'Medical Coverage Ends', date: assessmentData.medicalCoverageEndDate, icon: Stethoscope },
        { label: 'Dental Coverage Ends', date: assessmentData.dentalCoverageEndDate, icon: Smile },
        { label: 'Vision Coverage Ends', date: assessmentData.visionCoverageEndDate, icon: Eye },
        { label: 'EAP Coverage Ends', date: assessmentData.eapCoverageEndDate, icon: HandCoins },
    ].filter(d => d.date && !isNaN(d.date.getTime())).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (dates.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Key Dates</CardTitle>
                <CardDescription>Critical deadlines based on your assessment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {dates.map(({ label, date, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold">{label}</p>
                            <p className="text-sm text-muted-foreground">{format(date, 'PPP')}</p>
                        </div>
                    </div>
                ))}
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
}

function Timeline({ recommendations, completedTasks, toggleTaskCompletion, taskDateOverrides, updateTaskDate }: RecommendationProps) {
  if (!recommendations || recommendations.length === 0) {
    return <p className="text-muted-foreground text-center">No recommendations available.</p>;
  }

  const handleDateSelect = (taskId: string, date: Date | undefined) => {
    if (date) {
        // Adjust for timezone offset
        const correctedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        updateTaskDate(taskId, correctedDate);
    }
  };

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
      {recommendations.map((item, index) => {
        const Icon = categoryIcons[item.category] || categoryIcons.default;
        const isCompleted = completedTasks.has(item.taskId);
        const overriddenDate = taskDateOverrides[item.taskId];
        const rawDate = overriddenDate || item.endDate;
        const displayDate = rawDate ? new Date(rawDate) : null;
        // Correct for timezone issues when creating Date from 'YYYY-MM-DD'
        const correctedDisplayDate = displayDate ? new Date(displayDate.valueOf() + displayDate.getTimezoneOffset() * 60 * 1000) : null;


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
               {correctedDisplayDate && (
                  <div className="flex items-center gap-1 text-sm mt-2 font-medium text-destructive/80">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(correctedDisplayDate, "PPP")}</span>
                     {!isCompleted && <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker
                          mode="single"
                          selected={correctedDisplayDate}
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


function RecommendationsTable({ recommendations, completedTasks, toggleTaskCompletion, taskDateOverrides, updateTaskDate }: RecommendationProps) {
    if (!recommendations || recommendations.length === 0) {
      return <p className="text-muted-foreground text-center">No recommendations available.</p>;
    }

    const handleDateSelect = (taskId: string, date: Date | undefined) => {
        if (date) {
            const correctedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
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
                    const overriddenDate = taskDateOverrides[item.taskId];
                    const rawDate = overriddenDate || item.endDate;
                    const displayDate = rawDate ? new Date(rawDate) : null;
                    const correctedDisplayDate = displayDate ? new Date(displayDate.valueOf() + displayDate.getTimezoneOffset() * 60 * 1000) : null;
                    
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
                            {correctedDisplayDate ? (
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    <span>{format(correctedDisplayDate, "PPP")}</span>
                                     {!isCompleted && <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Edit className="h-3 w-3" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarPicker
                                                mode="single"
                                                selected={correctedDisplayDate}
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
