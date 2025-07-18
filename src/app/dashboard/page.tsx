
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
  const { profileData, isLoading, getCompanyUser, isAssessmentComplete } = useUserData();
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

  // Show a version of the timeline immediately if HR has pre-filled data.
  // The full dashboard will show once the user completes their profile & assessment.
  if (hasPrefilledData && !isFullyComplete) {
    return (
      <main className="flex-1">
        <WelcomeSummary />
        <TimelineDashboard isPreview />
        <div className="-mt-8">
          <ProgressTracker />
        </div>
      </main>
    )
  }

  // Show the final, completed timeline view.
  if (isFullyComplete) {
    return <TimelineDashboard />;
  }
  
  // Default view for new users without pre-filled data.
  return (
    <main className="flex-1">
      <ProgressTracker />
    </main>
  );
}
