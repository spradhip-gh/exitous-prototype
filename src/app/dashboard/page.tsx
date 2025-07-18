
'use client';

import { useEffect, useState } from 'react';
import ProgressTracker from '@/components/dashboard/ProgressTracker';
import TimelineDashboard from '@/components/dashboard/TimelineDashboard';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import WelcomeSummary from '@/components/dashboard/WelcomeSummary';

export default function DashboardPage() {
  const { auth } = useAuth();
  const { profileData, assessmentData, isLoading, getCompanyUser, isAssessmentComplete } = useUserData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  const companyUser = auth?.email ? getCompanyUser(auth.email) : null;
  const hasPrefilledData = !!companyUser?.user.prefilledAssessmentData;
  const isProfileComplete = !!profileData;
  const isFullyComplete = isProfileComplete && isAssessmentComplete;

  // Show the timeline if both forms are done.
  if (isFullyComplete) {
    return <TimelineDashboard />;
  }
  
  // If not fully complete, show the onboarding flow.
  return (
    <main className="flex-1">
      {hasPrefilledData && !isAssessmentComplete ? (
        <>
          <WelcomeSummary />
          <div className="mt-8">
            <ProgressTracker />
          </div>
        </>
      ) : (
        <ProgressTracker />
      )}
    </main>
  );
}
