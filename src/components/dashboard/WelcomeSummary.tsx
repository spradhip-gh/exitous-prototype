
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Key, Bell, CalendarX2, Stethoscope, HandCoins, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useMemo } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function WelcomeSummary() {
  const { auth } = useAuth();
  const { getCompanyUser, companyAssignments, getTargetTimezone } = useUserData();

  const companyUser = auth?.email ? getCompanyUser(auth.email) : null;
  const prefilledData = companyUser?.user.prefilledAssessmentData;
  const userTimezone = getTargetTimezone();
  
  const companyDetails = useMemo(() => {
      if (!companyUser?.companyName) return null;
      return companyAssignments.find(c => c.companyName === companyUser.companyName);
  }, [companyUser, companyAssignments]);

  if (!prefilledData) {
    return null;
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'PPP');
    } catch {
      return 'N/A';
    }
  };
  
  const severanceDeadlineTooltip = `Deadline is at ${companyDetails?.severanceDeadlineTime || '23:59'} on the specified date in the ${userTimezone} timezone.`;
  
  const importantInfo = [
    { label: 'Notification Date', value: companyUser?.user.notificationDate ? formatDate(companyUser.user.notificationDate) : 'N/A', icon: Bell },
    { label: 'Final Day of Employment', value: prefilledData.finalDate ? formatDate(prefilledData.finalDate) : 'N/A', icon: CalendarX2 },
    { label: 'Severance Agreement Deadline', value: prefilledData.severanceAgreementDeadline ? formatDate(prefilledData.severanceAgreementDeadline) : 'N/A', icon: Key, tooltip: severanceDeadlineTooltip },
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
            <TooltipProvider>
              {importantInfo.map(({ label, value, icon: Icon, tooltip }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg mt-1">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg text-foreground">{value}</p>
                      {tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
