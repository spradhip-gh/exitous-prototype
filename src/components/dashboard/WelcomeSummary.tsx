
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toZonedTime, format, formatInTimeZone } from 'date-fns-tz';
import { Key, Bell, CalendarX2, Stethoscope, HandCoins } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useMemo } from 'react';

export default function WelcomeSummary() {
  const { auth } = useAuth();
  const { getCompanyUser, companyAssignments } = useUserData();

  const companyUser = auth?.email ? getCompanyUser(auth.email) : null;
  const prefilledData = companyUser?.user.prefilledAssessmentData;
  
  const companyDetails = useMemo(() => {
      if (!companyUser?.companyName) return null;
      return companyAssignments.find(c => c.companyName === companyUser.companyName);
  }, [companyUser, companyAssignments]);

  if (!prefilledData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      // Handles 'YYYY-MM-DD' by treating it as a UTC date to avoid timezone shifts
      const dateInUtc = toZonedTime(dateString, 'UTC');
      return format(dateInUtc, 'PPP', { timeZone: 'UTC' });
    } catch {
      return 'N/A';
    }
  };

  const formatSeveranceDeadline = (dateString: string) => {
    try {
        const datePart = formatDate(dateString);
        if (datePart === 'N/A') return 'N/A';

        const timePart = companyDetails?.severanceDeadlineTime || '23:59';
        const timezone = companyDetails?.severanceDeadlineTimezone || 'America/Los_Angeles';

        const fullDateString = `${dateString}T${timePart}:00`;
        const zonedDate = toZonedTime(fullDateString, timezone);

        return formatInTimeZone(zonedDate, timezone, "PPP 'at' h:mm a zzz");
    } catch(e) {
        console.error("Failed to format severance deadline:", e);
        return 'N/A';
    }
  };

  const importantInfo = [
    { label: 'Notification Date', value: companyUser?.user.notificationDate ? formatDate(companyUser.user.notificationDate) : 'N/A', icon: Bell },
    { label: 'Final Day of Employment', value: prefilledData.finalDate ? formatDate(prefilledData.finalDate) : 'N/A', icon: CalendarX2 },
    { label: 'Severance Agreement Deadline', value: prefilledData.severanceAgreementDeadline ? formatSeveranceDeadline(prefilledData.severanceAgreementDeadline) : 'N/A', icon: Key },
    { label: 'Medical Coverage Ends', value: prefilledData.medicalCoverageEndDate ? formatDate(prefilledData.medicalCoverageEndDate) : 'N/A', icon: Stethoscope },
    { label: 'EAP Coverage Ends', value: prefilledData.eapCoverageEndDate ? formatDate(prefilledData.eapCoverageEndDate) : 'N/A', icon: HandCoins },
  ].filter(info => info.value && info.value !== 'N/A');

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
                  <p className="text-lg text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
