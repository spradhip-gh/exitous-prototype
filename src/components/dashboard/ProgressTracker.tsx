'use client';

import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Edit, ListChecks } from 'lucide-react';

export default function ProgressTracker() {
  const { profileData, assessmentData } = useUserData();

  const profileProgress = profileData ? 100 : 0;
  const assessmentProgress = assessmentData ? 100 : 0;
  const overallProgress = (profileProgress + assessmentProgress) / 2;

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Welcome to Your Dashboard</CardTitle>
            <CardDescription>
              Complete your profile and emotional assessment to unlock personalized recommendations and next steps.
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
              <Link href="/profile" passHref>
                <Button className="w-full">
                  {profileData ? <><Edit className="mr-2 h-4 w-4" /> Edit Profile</> : 'Complete Profile'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Emotional Assessment</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {assessmentData
                  ? 'Your assessment is complete. You can retake it anytime.'
                  : 'A quick check-in to understand how you\'re feeling.'}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Status</span>
                {assessmentData ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Complete
                  </span>
                ) : (
                  <span className="text-sm text-amber-600">Incomplete</span>
                )}
              </div>
              <Progress value={assessmentProgress} className="w-full mb-4" />
              <Link href="/assessment" passHref>
                <Button className="w-full" disabled={!profileData} variant={profileData ? "default" : "secondary"}>
                  {assessmentData ? 'Retake Assessment' : 'Start Assessment'}
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
