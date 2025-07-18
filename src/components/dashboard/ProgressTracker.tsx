
'use client';

import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Edit, ListChecks, Briefcase } from 'lucide-react';

export default function ProgressTracker() {
  const { profileData, getAssessmentCompletion } = useUserData();

  const profileProgress = profileData ? 100 : 0;
  const { percentage: assessmentProgress } = getAssessmentCompletion();
  const overallProgress = (profileProgress + assessmentProgress) / 2;
  const isAssessment100Complete = assessmentProgress === 100;

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Welcome to Your Dashboard</CardTitle>
            <CardDescription>
              Complete your profile and exit details to unlock personalized recommendations and next steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium text-muted-foreground">{overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Your Profile</CardTitle>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {profileData
                  ? 'Your profile is complete. You can edit it if your circumstances change.'
                  : 'Tell us about your situation to get tailored advice.'}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Status</span>
                {profileData ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Complete
                  </span>
                ) : (
                  <span className="text-sm text-amber-600">Incomplete</span>
                )}
              </div>
              <Progress value={profileProgress} className="w-full mb-4" />
              <Link href="/dashboard/profile" passHref>
                <Button className="w-full">
                  {profileData ? <><Edit className="mr-2 h-4 w-4" /> Edit Profile</> : 'Complete Profile'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Exit Details</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {isAssessment100Complete
                  ? 'Your exit details are saved. You can edit them if needed.'
                  : 'Provide specifics about your exit for a tailored plan.'}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Status</span>
                {isAssessment100Complete ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Complete
                  </span>
                ) : (
                  <span className="text-sm text-amber-600">{assessmentProgress.toFixed(0)}% Complete</span>
                )}
              </div>
              <Progress value={assessmentProgress} className="w-full mb-4" />
              <Link href="/dashboard/assessment" passHref>
                <Button className="w-full" disabled={!profileData} variant={profileData ? "default" : "secondary"}>
                  {isAssessment100Complete ? 'Edit Details' : 'Continue Details'}
                </Button>
              </Link>
               {!profileData && <p className="text-xs text-muted-foreground mt-2 text-center">Please complete your profile first.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
