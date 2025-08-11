
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import ProfileForm from '@/components/profile/ProfileForm';
import ProfileReview from '@/components/profile/ProfileReview';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

function ProfilePageContent() {
    const { profileData, isLoading } = useUserData();
    const searchParams = useSearchParams();
    const isEditingSection = searchParams.has('section');

    if (isLoading) {
        return (
             <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                        <CardContent className="space-y-6">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // If a specific section is requested for editing, always show the form.
    if (isEditingSection) {
        return <ProfileForm />;
    }
    
    // If the profile data exists, show the review component.
    if (profileData) {
        return <ProfileReview />;
    }
    
    // Otherwise, show the form for initial completion.
    return <ProfileForm />;
}


export default function ProfilePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
            <ProfilePageContent />
        </Suspense>
      </div>
    </div>
  );
}
