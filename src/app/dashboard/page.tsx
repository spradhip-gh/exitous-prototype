'use client';

import { useEffect, useState } from 'react';
import ProgressTracker from '@/components/dashboard/ProgressTracker';
import TimelineDashboard from '@/components/dashboard/TimelineDashboard';
import { useUserData } from '@/hooks/use-user-data.tsx';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { profileData, assessmentData, isLoading } = useUserData();
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

  const isComplete = !!profileData && !!assessmentData;

  return (
    <main className="flex-1">
      {isComplete ? <TimelineDashboard /> : <ProgressTracker />}
    </main>
  );
}
