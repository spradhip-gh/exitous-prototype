'use client';

import { useEffect, useState } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar, ListChecks, Briefcase, HeartHandshake, Banknote, Scale } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const categoryIcons: { [key: string]: React.ElementType } = {
  "Healthcare": Briefcase,
  "Finances": Banknote,
  "Job Search": ListChecks,
  "Legal": Scale,
  "Well-being": HeartHandshake,
  "default": Calendar,
};

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

        // Convert dates to ISO strings for the AI flow
        const transformedAssessmentData = {
          ...assessmentData,
          startDate: assessmentData.startDate?.toISOString(),
          notificationDate: assessmentData.notificationDate?.toISOString(),
          finalDate: assessmentData.finalDate?.toISOString(),
          relocationDate: assessmentData.relocationDate?.toISOString(),
          internalMessagingAccessEndDate: assessmentData.internalMessagingAccessEndDate?.toISOString(),
          emailAccessEndDate: assessmentData.emailAccessEndDate?.toISOString(),
          networkDriveAccessEndDate: assessmentData.networkDriveAccessEndDate?.toISOString(),
          layoffPortalAccessEndDate: assessmentData.layoffPortalAccessEndDate?.toISOString(),
          hrPayrollSystemAccessEndDate: assessmentData.hrPayrollSystemAccessEndDate?.toISOString(),
          medicalCoverageEndDate: assessmentData.medicalCoverageEndDate?.toISOString(),
          dentalCoverageEndDate: assessmentData.dentalCoverageEndDate?.toISOString(),
          visionCoverageEndDate: assessmentData.visionCoverageEndDate?.toISOString(),
          eapCoverageEndDate: assessmentData.eapCoverageEndDate?.toISOString(),
        };

        const result = await getPersonalizedRecommendations({
          profileData: transformedProfileData,
          layoffDetails: transformedAssessmentData,
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
              Here’s a timeline of recommended actions and resources based on your profile and layoff details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <LoadingSkeleton />}
            {error && <ErrorAlert message={error} />}
            {!isLoading && !error && recommendations && (
               <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>
                <TabsContent value="timeline" className="mt-6">
                  <Timeline recommendations={recommendations.recommendations} />
                </TabsContent>
                <TabsContent value="table" className="mt-6">
                  <RecommendationsTable recommendations={recommendations.recommendations} />
                </TabsContent>
              </Tabs>
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

function Timeline({ recommendations }: { recommendations: RecommendationItem[] }) {
  if (!recommendations || recommendations.length === 0) {
    return <p className="text-muted-foreground text-center">No recommendations available.</p>;
  }
  return (
    <div className="relative pl-6">
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
      {recommendations.map((item, index) => {
        const Icon = categoryIcons[item.category] || categoryIcons.default;
        return (
          <div key={index} className="relative mb-8 flex items-start gap-4">
            <div className="absolute left-2.5 top-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-8 ring-background -translate-x-1/2">
               <Icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="pl-8 pt-0.5">
              <p className="text-sm font-semibold text-muted-foreground">{item.timeline}</p>
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-base font-semibold text-foreground">{item.task}</p>
                 <Badge variant="secondary">{item.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.details}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function RecommendationsTable({ recommendations }: { recommendations: RecommendationItem[] }) {
    if (!recommendations || recommendations.length === 0) {
      return <p className="text-muted-foreground text-center">No recommendations available.</p>;
    }
    return (
        <Card>
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead className="w-[120px]">Timeline</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Category</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {recommendations.map((item, index) => (
                      <TableRow key={index}>
                          <TableCell>{item.timeline}</TableCell>
                          <TableCell>
                            <p className="font-medium">{item.task}</p>
                            <p className="text-xs text-muted-foreground">{item.details}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.category}</Badge>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
        </Card>
    );
}
