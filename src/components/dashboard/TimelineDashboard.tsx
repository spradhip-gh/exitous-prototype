

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, differenceInDays, isSameDay, startOfToday, parseISO, startOfMonth, isValid } from 'date-fns';
import { format as formatInTz } from 'date-fns-tz';
import { useUserData, CompanyAssignment, GuidanceRule, Condition } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar, ListChecks, Briefcase, HeartHandshake, Banknote, Scale, Edit, Bell, CalendarX2, Stethoscope, Smile, Eye, HandCoins, Key, Info, ChevronDown, Layers, PlusCircle, CalendarPlus, Handshake, RefreshCw, Lightbulb } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from './ProgressTracker';
import { type ExternalResource } from '@/lib/external-resources';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

const categoryIcons: { [key: string]: React.ElementType } = {
  "Healthcare": Stethoscope,
  "Finances": Banknote,
  "Career": ListChecks,
  "Legal": Scale,
  "Well-being": HeartHandshake,
  "Custom": CalendarPlus,
  "General": Info,
  "Basics": Briefcase,
  "default": Calendar,
};


function ResourceDialog({ resource, open, onOpenChange }: { resource: ExternalResource | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!resource) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Card className="border-0 shadow-none">
                     <div className="relative h-40 w-full">
                         <Image
                            src={resource.imageUrl}
                            alt={resource.name}
                            fill
                            className="object-cover rounded-t-lg"
                            data-ai-hint={resource.imageHint}
                        />
                    </div>
                    <CardHeader>
                        <CardTitle>{resource.name}</CardTitle>
                        <Badge variant="secondary" className="w-fit">{resource.category}</Badge>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="default" asChild className="w-full">
                            <a href={resource.website} target="_blank" rel="noopener noreferrer">
                                Learn More
                            </a>
                        </Button>
                    </CardFooter>
                </Card>
            </DialogContent>
        </Dialog>
    )
}

export default function TimelineDashboard({ isPreview = false }: { isPreview?: boolean }) {
  const router = useRouter();
  const { auth } = useAuth();
  const { 
    profileData, 
    assessmentData, 
    completedTasks, 
    toggleTaskCompletion,
    taskDateOverrides,
    updateTaskDate,
    companyAssignments,
    getAllCompanyConfigs,
    customDeadlines,
    addCustomDeadline,
    isAssessmentComplete,
    getTargetTimezone,
    externalResources,
    recommendations,
    saveRecommendations,
    clearRecommendations,
    getMappedRecommendations,
  } = useUserData();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddDateOpen, setIsAddDateOpen] = useState(false);
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDate, setNewDate] = useState<Date | undefined>();
  const { toast } = useToast();
  
  const [selectedResource, setSelectedResource] = useState<ExternalResource | null>(null);

  const userTimezone = getTargetTimezone();
  
  const companyVersion = useMemo(() => {
    if (!auth?.companyName) return 'basic';
    return companyAssignments.find(c => c.companyName === auth.companyName)?.version || 'basic';
  }, [auth, companyAssignments]);

  const companyDetails = useMemo(() => {
    if (!assessmentData?.companyName) return null;
    return companyAssignments.find(c => c.companyName === assessmentData.companyName);
  }, [assessmentData, companyAssignments]);

  const isProfileComplete = !!profileData;
  const isFullyComplete = isProfileComplete && isAssessmentComplete;

  const mappedRecommendations = useMemo(() => {
      if (!isFullyComplete) return [];
      return getMappedRecommendations();
  }, [isFullyComplete, getMappedRecommendations]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isFullyComplete || !auth?.email) {
        setIsLoading(false);
        return;
      }
      
      if (recommendations) {
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
        // Explicitly format date fields to ISO strings or set to undefined
        const dateFields: (keyof typeof assessmentData)[] = [
            'startDate', 'notificationDate', 'finalDate', 'severanceAgreementDeadline',
            'relocationDate', 'internalMessagingAccessEndDate', 'emailAccessEndDate',
            'networkDriveAccessEndDate', 'layoffPortalAccessEndDate', 'hrPayrollSystemAccessEndDate',
            'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate', 'eapCoverageEndDate'
        ];
        
        for (const key in assessmentData) {
            const value = (assessmentData as any)[key];
            if (dateFields.includes(key as any) && value instanceof Date && !isNaN(value.getTime())) {
                stringifiedAssessmentData[key] = value.toISOString();
            } else if (dateFields.includes(key as any)) {
                 stringifiedAssessmentData[key] = undefined; // Ensure invalid or empty dates are not sent
            } else if (value === null) {
                stringifiedAssessmentData[key] = undefined;
            }
        }

        const result = await getPersonalizedRecommendations({
          userEmail: auth.email,
          companyName: auth.companyName,
          profileData: transformedProfileData,
          layoffDetails: stringifiedAssessmentData,
        });
        saveRecommendations(result);
      } catch (e) {
        console.error(e);
        setError('Failed to generate personalized recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [profileData, assessmentData, isPreview, isFullyComplete, auth, recommendations, saveRecommendations]);

  const { tasks, tips } = useMemo(() => {
    const aiRecs = recommendations?.recommendations || [];
    const manualRecs = mappedRecommendations || [];

    const manualTaskIds = new Set(manualRecs.map(rec => rec.taskId));
    
    // Filter out AI recommendations that are duplicates of manual ones
    const deduplicatedAiRecs = aiRecs.filter(rec => !manualTaskIds.has(rec.taskId));
    
    const combined = [...manualRecs, ...deduplicatedAiRecs];

    const getDateValue = (dateStr: string | undefined) => {
      if (!dateStr) return Infinity;
      try {
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate)) {
          return parsedDate.getTime();
        }
      } catch (e) {
        return Infinity;
      }
      return Infinity;
    };

    const sorted = combined.sort((a, b) => {
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

    return {
      tasks: sorted.filter(item => !item.taskId.startsWith('tip-')),
      tips: sorted.filter(item => item.taskId.startsWith('tip-')),
    };

  }, [recommendations, mappedRecommendations, taskDateOverrides]);


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
  
  const handleConnectClick = (taskId: string, category: string) => {
    const isConsultantTask = taskId.startsWith('consultant-guidance-');
    const resourceId = isConsultantTask ? taskId.replace('consultant-guidance-', '') : null;
    
    let matchedResources: ExternalResource[] = [];

    if (resourceId) {
        const resource = externalResources.find(res => res.id === resourceId);
        if (resource) {
            matchedResources.push(resource);
        }
    } else {
        matchedResources = externalResources.filter(res => res.relatedTaskIds?.includes(taskId));
    }


    if (matchedResources.length === 1) {
        setSelectedResource(matchedResources[0]);
    } else if (matchedResources.length > 1) {
        router.push(`/dashboard/external-resources?category=${encodeURIComponent(category)}`);
    } else {
        // Fallback or do nothing if no resource is found, though the button shouldn't show.
        router.push('/dashboard/external-resources');
    }
  };
  
  const handleRefresh = () => {
    clearRecommendations();
    toast({ title: "Refreshing...", description: "Generating new recommendations."});
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
          <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
          <ErrorAlert message={error} />
      </div>
    );
  }

  if (!isFullyComplete) {
    return <ProgressTracker />;
  }

  return (
    <>
      <ResourceDialog resource={selectedResource} open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)} />
      <div className="space-y-8">
        {(tasks.length > 0 || tips.length > 0) && (
            <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-2xl">Your Personalized Next Steps</CardTitle>
                      <CardDescription>
                          A tailored list of actions to guide you through your exit.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Refresh Recommendations</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {tasks.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold font-headline mb-4">Tasks & Deadlines</h3>
                            <Timeline 
                                recommendations={tasks} 
                                completedTasks={completedTasks}
                                toggleTaskCompletion={toggleTaskCompletion}
                                taskDateOverrides={taskDateOverrides}
                                updateTaskDate={updateTaskDate}
                                userTimezone={userTimezone}
                                onConnectClick={handleConnectClick}
                                externalResources={externalResources.filter(r => r.availability?.includes(companyVersion))}
                            />
                        </div>
                    )}
                     {tips.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold font-headline mb-4">Did You Know...</h3>
                            <div className="space-y-4">
                              {tips.map(tip => (
                                <Alert key={tip.taskId}>
                                  <Lightbulb className="h-4 w-4" />
                                  <AlertTitle>{tip.category}</AlertTitle>
                                  <AlertDescription>
                                    <ReactMarkdown className="prose prose-sm">{tip.task.replace('Did you know: ', '')}</ReactMarkdown>
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
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
    onConnectClick: (taskId: string, category: string) => void;
    externalResources: ExternalResource[];
}

function Timeline({ recommendations, completedTasks, toggleTaskCompletion, taskDateOverrides, updateTaskDate, userTimezone, onConnectClick, externalResources }: RecommendationProps) {
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

  const getHasResource = (taskId: string) => {
    const isConsultantTask = taskId.startsWith('consultant-guidance-');
    if (isConsultantTask) {
        const resourceId = taskId.replace('consultant-guidance-', '');
        return externalResources.some(res => res.id === resourceId);
    }
    return externalResources.some(res => res.relatedTaskIds?.includes(taskId));
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
      {recommendations.map((item, index) => {
        const Icon = categoryIcons[item.category] || categoryIcons.default;
        const isCompleted = completedTasks.has(item.taskId);
        const overriddenDateStr = taskDateOverrides[item.taskId];
        const rawDateStr = overriddenDateStr || item.endDate;
        const hasResource = getHasResource(item.taskId);
        
        let displayDate: Date | null = null;
        if(rawDateStr) {
            try {
                const parsed = parse(rawDateStr, 'yyyy-MM-dd', new Date());
                if(isValid(parsed)) {
                    displayDate = parsed;
                }
            } catch (e) {
                console.warn(`Could not parse date: ${rawDateStr}`);
            }
        }

        return (
          <div key={item.taskId || index} className="relative mb-8 flex items-start gap-4">
            <div className="flex items-center absolute left-3 top-1.5 -translate-x-1/2">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-8 ring-background">
                   <Icon className={cn("h-4 w-4 text-primary-foreground")} />
                </div>
            </div>
            <div className={cn("pl-8 pt-0.5 w-full", isCompleted && "text-muted-foreground")}>
              <p className="text-sm font-semibold">{item.timeline}</p>
              <div className="flex items-center gap-2 mb-1">
                 <p className={cn("text-base font-semibold", isCompleted && "line-through")}>{item.task}</p>
                 <Badge variant={isCompleted ? 'outline' : 'secondary'}>{item.category}</Badge>
              </div>
              <div className={cn("text-sm prose prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1", isCompleted && "line-through")}>
                <ReactMarkdown>{item.details}</ReactMarkdown>
              </div>
              
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                {displayDate && isValid(displayDate) && (
                    <div className="flex items-center gap-1 text-sm font-medium text-destructive/80">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatInTz(displayDate, "PPP", { timeZone: userTimezone })}</span>
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
                
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`task-timeline-${item.taskId}`}
                        checked={isCompleted}
                        onCheckedChange={() => toggleTaskCompletion(item.taskId)}
                    />
                    <Label htmlFor={`task-timeline-${item.taskId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mark as Complete
                    </Label>
                </div>
                 {hasResource && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => onConnectClick(item.taskId, item.category)}>
                        <Handshake className="mr-1.5 h-4 w-4"/> Connect with a Professional
                    </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
