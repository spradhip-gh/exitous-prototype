

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parse, parseISO } from 'date-fns';
import { Key, Bell, CalendarX2, Stethoscope, HandCoins, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useMemo } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toZonedTime, format as formatInTz } from 'date-fns-tz';

export default function WelcomeSummary() {
  const { auth } = useAuth();
  const { assessmentData, companyAssignments, getTargetTimezone, getCompanyUser } = useUserData();

  const companyUser = auth?.email ? getCompanyUser(auth.email) : null;
  const userTimezone = getTargetTimezone();
  
  const companyDetails = useMemo(() => {
      if (!companyUser?.companyName) return null;
      return companyAssignments.find(c => c.companyName === companyUser.companyName);
  }, [companyUser, companyAssignments]);

  // Only render the component if there is pre-filled assessment data.
  if (!assessmentData || !assessmentData.finalDate) { 
    return null;
  }

  const formatDate = (dateValue: Date | string | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = (dateValue instanceof Date) ? dateValue : parseISO(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return formatInTz(date, 'PPP', { timeZone: userTimezone });
    } catch {
      return 'N/A';
    }
  };
  
  const severanceDeadlineTooltip = `Deadline is at ${companyDetails?.severanceDeadlineTime || '23:59'} on the specified date in the ${userTimezone} timezone.`;
  
  const importantInfo = [
    { label: 'Notification Date', value: formatDate(assessmentData.notificationDate), icon: Bell, tooltip: null },
    { label: 'Final Day of Employment', value: formatDate(assessmentData.finalDate), icon: CalendarX2, tooltip: null },
    { label: 'Severance Agreement Deadline', value: formatDate(assessmentData.severanceAgreementDeadline), icon: Key, tooltip: severanceDeadlineTooltip },
    { label: 'Medical Coverage Ends', value: formatDate(assessmentData.medicalCoverageEndDate), icon: Stethoscope, tooltip: null },
  ].filter(info => info.value && info.value !== 'N/A');

  const additionalDataCount = Object.keys(assessmentData).filter(key => 
    ![
      'notificationDate', 
      'finalDate', 
      'severanceAgreementDeadline', 
      'medicalCoverageEndDate', 
      'companyName', 
      'workStatus' // Exclude keys that are not "additional data"
    ].includes(key) && assessmentData[key as keyof typeof assessmentData]
  ).length;


  return (
    <div className="space-y-4">
        <Alert variant="default" className="border-orange-300 bg-orange-50">
            <Bell className="h-4 w-4 !text-orange-600" />
            <AlertTitle className="text-orange-900">Welcome to ExitBetter</AlertTitle>
            <AlertDescription className="text-orange-800">
                We know this is a difficult time. The information below has been pre-filled by your company to help you get started. Let&apos;s begin by creating your profile to unlock personalized guidance.
            </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Your Exit Information Summary</CardTitle>
                <CardDescription>
                    Here are key dates provided by {companyUser?.companyName}. 
                    {additionalDataCount > 0 && ` ${additionalDataCount} additional data points have also been pre-filled.`}
                    You can review and confirm these details in the full assessment after creating your profile.
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
  );
}
