'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import ProgressTracker from '@/components/dashboard/ProgressTracker';
import TimelineDashboard from '@/components/dashboard/TimelineDashboard';
import { useUserData } from '@/hooks/use-user-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { profileData, assessmentData, isLoading } = useUserData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const isComplete = !!profileData && !!assessmentData;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">
        {isComplete ? <TimelineDashboard /> : <ProgressTracker />}
      </main>
    </div>
  );
}
