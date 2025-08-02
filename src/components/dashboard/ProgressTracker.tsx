
'use client';

import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Edit, ListChecks, Briefcase, CalendarPlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, parse } from 'date-fns';
import { toZonedTime, format as formatInTz } from 'date-fns-tz';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


export default function ProgressTracker() {
  const { 
    getAssessmentCompletion, 
    customDeadlines, 
    addCustomDeadline,
    getProfileCompletion,
    getTargetTimezone,
  } = useUserData();
  const { toast } = useToast();

  const { percentage: profileProgress, remaining: remainingProfile } = getProfileCompletion();
  const { percentage: assessmentOverallProgress, sections: assessmentSections, isComplete: isAssessmentComplete } = getAssessmentCompletion();
  const isProfileComplete = profileProgress === 100;
  
  const handleDateSet = (id: string, label: string, date: Date | undefined) => {
    if (date) {
      addCustomDeadline(id, { label, date: format(date, 'yyyy-MM-dd') });
      toast({ title: "Goal Date Set", description: `Your goal for "${label}" has been saved.` });
    }
  };
  
  const userTimezone = getTargetTimezone();

  const getDisplayDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = parse(dateString, 'yyyy-MM-dd', new Date());
        return formatInTz(date, 'PPP', { timeZone: userTimezone });
    } catch(e) {
        console.error("Error formatting date", e);
        return dateString || '';
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Your Profile</CardTitle>
          <div className="flex items-center gap-1">
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><CalendarPlus className="h-4 w-4 text-muted-foreground" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          onSelect={(date) => handleDateSet('profile-deadline', 'Complete Profile', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                </TooltipTrigger>
                <TooltipContent><p>Set a goal date</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {isProfileComplete
              ? 'Your profile is complete. You can edit it if your circumstances change.'
              : 'Please complete your profile to continue.'}
          </div>
          {customDeadlines['profile-deadline'] && !isProfileComplete && (
              <p className="text-xs text-muted-foreground mb-4">Goal: Complete by {getDisplayDate(customDeadlines['profile-deadline']?.date)}</p>
          )}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Status</span>
            {isProfileComplete ? (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Complete
              </span>
            ) : (
              <span className="text-sm text-amber-600">{profileProgress.toFixed(0)}% Complete</span>
            )}
          </div>
          <Progress value={profileProgress} className="w-full mb-4" />
          <Link href="/dashboard/profile" passHref>
            <Button className="w-full">
              {isProfileComplete ? <><Edit className="mr-2 h-4 w-4" /> Edit Profile</> : 'Complete Profile'}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Exit Details</CardTitle>
            <div className="flex items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><CalendarPlus className="h-4 w-4 text-muted-foreground" /></Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              onSelect={(date) => handleDateSet('assessment-deadline', 'Complete Assessment', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent><p>Set a goal date</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
           <div className="text-sm text-muted-foreground mb-4">
              {isAssessmentComplete
                ? 'Your exit details are saved. You can edit them if needed.'
                : 'Complete all sections to unlock your personalized timeline.'}
            </div>
            {customDeadlines['assessment-deadline'] && !isAssessmentComplete && (
                <p className="text-xs text-muted-foreground mb-4">Goal: Complete by {getDisplayDate(customDeadlines['assessment-deadline']?.date)}</p>
            )}

            <div className="space-y-4">
              {assessmentSections.map(section => (
                <div key={section.name}>
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{section.name}</span>
                      <span className="text-sm text-muted-foreground">{section.completed}/{section.total}</span>
                   </div>
                   <Progress value={section.percentage} className="w-full" />
                </div>
              ))}
            </div>
          
          <Link href="/dashboard/assessment" passHref>
            <Button className="w-full mt-6" disabled={!isProfileComplete} variant={isProfileComplete ? "default" : "secondary"}>
              {isAssessmentComplete ? 'Edit Details' : 'Continue Adding Details'}
            </Button>
          </Link>
            {!isProfileComplete && <p className="text-xs text-muted-foreground mt-2 text-center">Please complete your profile first.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
