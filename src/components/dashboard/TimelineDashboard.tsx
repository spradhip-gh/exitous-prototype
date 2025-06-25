'use client';

import { useEffect, useState } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function TimelineDashboard() {
  const { profileData, assessmentData } = useUserData();
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!profileData || !assessmentData) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Transform data to match AI schema
        const transformedProfileData = {
          birthYear: profileData.birthYear,
          state: profileData.state,
          gender: profileData.gender === 'Prefer to self-describe' ? profileData.genderSelfDescribe! : profileData.gender,
          maritalStatus: profileData.maritalStatus,
          hasChildrenUnder13: profileData.hasChildrenUnder13.startsWith('Yes'),
          hasExpectedChildren: profileData.hasExpectedChildren.startsWith('Yes'),
          impactedPeopleCount: profileData.impactedPeopleCount,
          livingStatus: profileData.livingStatus,
          citizenshipStatus: profileData.citizenshipStatus,
          pastLifeEvents: profileData.pastLifeEvents,
          hasChildrenAges18To26: profileData.hasChildrenAges18To26.startsWith('Yes'),
        };

        const result = await getPersonalizedRecommendations({
          profileData: transformedProfileData,
          assessmentData: assessmentData,
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
  }, [profileData, assessmentData]);

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Personalized Next Steps</CardTitle>
            <CardDescription>
              Here’s a timeline of recommended actions and resources based on your profile and assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <LoadingSkeleton />}
            {error && <ErrorAlert message={error} />}
            {!isLoading && !error && recommendations && (
              <Timeline recommendations={recommendations.recommendations} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
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

function Timeline({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border"></div>
      {recommendations.map((item, index) => (
        <div key={index} className="relative mb-8">
          <div className="absolute -left-1.5 top-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-8 ring-background">
             <span className="text-primary-foreground font-bold text-xs">{index + 1}</span>
          </div>
          <div className="pl-8">
            <p className="text-base text-foreground">{item}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
