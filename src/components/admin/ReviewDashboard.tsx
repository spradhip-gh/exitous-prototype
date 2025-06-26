'use client';

import { useEffect, useState } from 'react';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle, XCircle, Pencil, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const sampleProfileData = {
  birthYear: 1988,
  state: 'California',
  gender: 'Female',
  maritalStatus: 'Married',
  hasChildrenUnder13: true,
  hasExpectedChildren: false,
  impactedPeopleCount: '1 - 3',
  livingStatus: 'Homeowner',
  citizenshipStatus: 'U.S. citizen',
  pastLifeEvents: ['Home purchase'],
  hasChildrenAges18To26: false,
};

const sampleAssessmentData = {
  workStatus: 'Full-time employee',
  startDate: new Date('2018-05-15').toISOString(),
  notificationDate: new Date('2024-06-01').toISOString(),
  finalDate: new Date('2024-06-30').toISOString(),
  workState: 'California',
  relocationPaid: 'No',
  unionMember: 'No',
  workArrangement: 'Remote',
  workVisa: 'None of the above',
  onLeave: ['None of the above'],
  accessSystems: ['email', 'hr_payroll'],
  emailAccessEndDate: new Date('2024-07-15').toISOString(),
  hrPayrollSystemAccessEndDate: new Date('2024-07-31').toISOString(),
  hadMedicalInsurance: 'Yes',
  medicalCoverage: 'Me and family',
  medicalCoverageEndDate: new Date('2024-06-30').toISOString(),
  hadDentalInsurance: 'Yes',
  dentalCoverage: 'Me and family',
  dentalCoverageEndDate: new Date('2024-06-30').toISOString(),
  hadVisionInsurance: 'No',
  hadEAP: 'Yes',
  eapCoverageEndDate: new Date('2024-09-30').toISOString(),
};

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'snoozed' | 'editing';

interface ReviewableItem extends RecommendationItem {
    reviewStatus: ReviewStatus;
    feedback?: string;
}


export default function ReviewDashboard() {
  const [recommendations, setRecommendations] = useState<ReviewableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await getPersonalizedRecommendations({
          profileData: sampleProfileData,
          layoffDetails: sampleAssessmentData as any, // Cast to any to bypass date object issues in sample data
        });

        const reviewable = result.recommendations.map(r => ({ ...r, reviewStatus: 'pending' as ReviewStatus }));
        setRecommendations(reviewable);

      } catch (e) {
        console.error(e);
        setError('Failed to generate sample recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleStatusChange = (taskId: string, status: ReviewStatus) => {
    setRecommendations(prev => prev.map(r => r.taskId === taskId ? { ...r, reviewStatus: status } : r));
  };
  
  const handleSaveFeedback = (taskId: string, feedback: string) => {
    setRecommendations(prev => prev.map(r => r.taskId === taskId ? { ...r, reviewStatus: 'rejected', feedback } : r));
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2 rounded-lg border p-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/4" />
                         <div className="flex justify-end gap-2 pt-2">
                             <Skeleton className="h-9 w-24" />
                             <Skeleton className="h-9 w-24" />
                         </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
        {recommendations.map(item => (
            <RecommendationReviewCard key={item.taskId} item={item} onStatusChange={handleStatusChange} onSaveFeedback={handleSaveFeedback} />
        ))}
    </div>
  );
}


function RecommendationReviewCard({ item, onStatusChange, onSaveFeedback }: { item: ReviewableItem, onStatusChange: (id: string, status: ReviewStatus) => void, onSaveFeedback: (id: string, feedback: string) => void }) {
    const [feedbackText, setFeedbackText] = useState(item.feedback || '');

    const statusConfig = {
        pending: { color: 'bg-gray-500', text: 'Pending' },
        approved: { color: 'bg-green-500', text: 'Approved' },
        rejected: { color: 'bg-red-500', text: 'Rejected' },
        snoozed: { color: 'bg-yellow-500', text: 'Snoozed' },
        editing: { color: 'bg-blue-500', text: 'Editing' },
    }

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-4 p-4 border-b">
                 <div className={`h-3 w-3 rounded-full ${statusConfig[item.reviewStatus].color}`}></div>
                 <p className="font-semibold">{item.task}</p>
                 <Badge variant="secondary" className="ml-auto">{item.category}</Badge>
            </div>
            <CardContent className="p-4 space-y-4">
                <div>
                    <p className="text-sm text-muted-foreground">Details</p>
                    <p className="text-sm">{item.details}</p>
                </div>
                 {item.endDate && <div>
                    <p className="text-sm text-muted-foreground">Timeline / Due Date</p>
                    <p className="text-sm font-medium">{item.endDate}</p>
                </div>}

                {item.reviewStatus === 'editing' && (
                    <div className="space-y-2">
                        <Label htmlFor={`feedback-${item.taskId}`}>Feedback / Edit Suggestion</Label>
                        <Textarea id={`feedback-${item.taskId}`} value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="e.g., 'Rephrase this to be more empathetic.'"/>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onStatusChange(item.taskId, 'pending')}>Cancel</Button>
                            <Button size="sm" onClick={() => handleSaveFeedback(item.taskId, feedbackText)}>Save as Rejection</Button>
                        </div>
                    </div>
                )}
                 {item.feedback && item.reviewStatus === 'rejected' && (
                    <div className="p-3 rounded-md bg-destructive/10">
                        <p className="text-sm font-semibold text-destructive">Rejection Feedback:</p>
                        <p className="text-sm text-destructive/80">{item.feedback}</p>
                    </div>
                 )}


            </CardContent>
            {item.reviewStatus !== 'editing' && <div className="flex justify-end gap-2 bg-muted/50 p-3">
                 <Button variant="outline" size="sm" onClick={() => onStatusChange(item.taskId, 'approved')}><CheckCircle className="mr-2"/>Approve</Button>
                 <Button variant="outline" size="sm" onClick={() => onStatusChange(item.taskId, 'snoozed')}><Clock className="mr-2"/>Snooze</Button>
                 <Button variant="destructive" size="sm" onClick={() => onStatusChange(item.taskId, 'editing')}><Pencil className="mr-2"/>Reject / Edit</Button>
            </div>}
        </Card>
    );
}
