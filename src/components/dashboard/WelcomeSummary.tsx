'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, parse } from 'date-fns';
import { Key, Bell, CalendarX2, Stethoscope, HandCoins } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function WelcomeSummary() {
  const { auth } = useAuth();
  const { getCompanyUser } = useUserData();

  const companyUser = auth?.email ? getCompanyUser(auth.email) : null;
  const prefilledData = companyUser?.user.prefilledAssessmentData;

  if (!prefilledData) {
    return null;
  }

  const importantInfo = [
    { label: 'Notification Date', value: companyUser?.user.notificationDate, icon: Bell },
    { label: 'Final Day of Employment', value: prefilledData.finalDate, icon: CalendarX2 },
    { label: 'Severance Agreement Deadline', value: prefilledData.severanceAgreementDeadline, icon: Key },
    { label: 'Medical Coverage Ends', value: prefilledData.medicalCoverageEndDate, icon: Stethoscope },
    { label: 'EAP Coverage Ends', value: prefilledData.eapCoverageEndDate, icon: HandCoins },
  ].filter(info => info.value);

  const formatDate = (dateString: string) => {
    try {
        const date = parse(dateString, 'yyyy-MM-dd', new Date());
        return format(date, 'PPP');
    } catch {
        return 'N/A';
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Alert variant="default" className="border-orange-300 bg-orange-50">
          <Bell className="h-4 w-4 !text-orange-600" />
          <AlertTitle className="text-orange-900">Welcome to ExitBetter</AlertTitle>
          <AlertDescription className="text-orange-800">
            We know this is a difficult time. The information below has been pre-filled by your company to help you get started. Let&apos;s begin by creating your profile to unlock personalized guidance.
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Exit Information Summary</CardTitle>
            <CardDescription>
              Here are the key dates provided by {companyUser?.companyName}. You can review and confirm these details in the full assessment after creating your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {importantInfo.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg mt-1">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-lg text-foreground">{formatDate(value!)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <div className="text-center">
            <Button asChild size="lg">
                <Link href="/dashboard/profile">Start My Profile</Link>
            </Button>
        </div>

      </div>
    </div>
  );
}
