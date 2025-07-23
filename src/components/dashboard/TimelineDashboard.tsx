
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, differenceInDays, isSameDay, startOfToday, parseISO, startOfMonth } from 'date-fns';
import { format as formatInTz } from 'date-fns-tz';
import { useUserData, CompanyAssignment } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar, ListChecks, Briefcase, HeartHandshake, Banknote, Scale, Edit, Bell, CalendarX2, Stethoscope, Smile, Eye, HandCoins, Key, Info, ChevronDown, Layers, PlusCircle, CalendarPlus, Handshake } from 'lucide-react';
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

const categoryIcons: { [key: string]: React.ElementType } = {
  "Healthcare": Stethoscope,
  "Finances": Banknote,
  "Job Search": ListChecks,
  "Legal": Scale,
  "Well-being": HeartHandshake,
  "Custom": CalendarPlus,
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
    customDeadlines,
    addCustomDeadline,
    isAssessmentComplete,
    getTargetTimezone,
    externalResources,
  } = useUserData();

  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
    return companyAssignments.find(c => c.companyName === assessmentData.companyName) || null;
  }, [assessmentData, companyAssignments]);

  const isProfileComplete = !!profileData;
  const isFullyComplete = isProfileComplete && isAssessmentComplete;

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isFullyComplete) {
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
  }, [profileData, assessmentData, isPreview, isFullyComplete]);

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
  
  const handleConnectClick = (taskId: string, category: string) => {
    const matchedResources = externalResources.filter(res => res.relatedTaskIds?.includes(taskId));
    if (matchedResources.length === 1) {
        setSelectedResource(matchedResources[0]);
    } else if (matchedResources.length > 1) {
        router.push(`/dashboard/external-resources?category=${encodeURIComponent(category)}`);
    } else {
        // Fallback or do nothing if no resource is found, though the button shouldn't show.
        router.push('/dashboard/external-resources');
    }
  };

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
  
  const hasRecommendations = filteredRecommendations.length > 0;

  return (
    <>
      <ResourceDialog resource={selectedResource} open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)} />
      {sortedRecommendations.length > 0 && (
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
                                  onConnectClick={handleConnectClick}
                                  externalResources={externalResources.filter(r => r.availability?.includes(companyVersion))}
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
                                  onConnectClick={handleConnectClick}
                                  externalResources={externalResources.filter(r => r.availability?.includes(companyVersion))}
                              />
                           ) : (
                              <p className="text-center text-muted-foreground py-8">No recommendations in this category.</p>
                           )}
                      </TabsContent>
                  </Tabs>
              </CardContent>
          </Card>
      )}
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

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
      {recommendations.map((item, index) => {
        const Icon = categoryIcons[item.category] || categoryIcons.default;
        const isCompleted = completedTasks.has(item.taskId);
        const overriddenDateStr = taskDateOverrides[item.taskId];
        const rawDateStr = overriddenDateStr || item.endDate;
        const hasResource = externalResources.some(res => res.relatedTaskIds?.includes(item.taskId));
        
        let displayDate: Date | null = null;
        if(rawDateStr) {
            const [year, month, day] = rawDateStr.split('-').map(Number);
            displayDate = new Date(year, month-1, day);
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
              <p className={cn("text-sm", isCompleted && "line-through")}>{item.details}</p>
              
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                {displayDate && (
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


function RecommendationsTable({ recommendations, completedTasks, toggleTaskCompletion, taskDateOverrides, updateTaskDate, userTimezone, onConnectClick, externalResources }: RecommendationProps) {
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
                    const hasResource = externalResources.some(res => res.relatedTaskIds?.includes(item.taskId));

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
                             {hasResource && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs -ml-1 mt-1" onClick={() => onConnectClick(item.taskId, item.category)}>
                                    <Handshake className="mr-1.5 h-3 w-3"/> Connect with a Professional
                                </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCompleted ? 'outline' : 'secondary'}>{item.category}</Badge>
                          </TableCell>
                          <TableCell className={cn(isCompleted && "text-muted-foreground line-through")}>
                            {displayDate ? (
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    <span>{formatInTz(displayDate, "PPP", { timeZone: userTimezone })}</span>
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
