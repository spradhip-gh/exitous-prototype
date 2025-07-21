
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, CompanyAssignment } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timezones } from '@/lib/timezones';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const { 
    companyAssignmentForHr, 
    updateCompanyAssignment, 
    getAllCompanyConfigs,
    isLoading
  } = useUserData();

  const [deadlineTime, setDeadlineTime] = useState('');
  const [deadlineTimezone, setDeadlineTimezone] = useState('');
  const [preLayoffContact, setPreLayoffContact] = useState('');
  const [postLayoffContact, setPostLayoffContact] = useState('');

  const companyConfig = auth?.companyName ? getAllCompanyConfigs()[auth.companyName] : null;
  const userCount = companyConfig?.users?.length ?? 0;
  const maxUsers = companyAssignmentForHr?.maxUsers ?? 0;
  const userProgress = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;

  useEffect(() => {
    if (companyAssignmentForHr) {
      setDeadlineTime(companyAssignmentForHr.severanceDeadlineTime || '23:59');
      setDeadlineTimezone(companyAssignmentForHr.severanceDeadlineTimezone || 'America/Los_Angeles');
      setPreLayoffContact(companyAssignmentForHr.preLayoffContactAlias || '');
      setPostLayoffContact(companyAssignmentForHr.postLayoffContactAlias || '');
    }
  }, [companyAssignmentForHr]);

  const handleSaveChanges = () => {
    if (!auth?.companyName) return;
    
    updateCompanyAssignment(auth.companyName, { 
      severanceDeadlineTime: deadlineTime,
      severanceDeadlineTimezone: deadlineTimezone,
      preLayoffContactAlias: preLayoffContact,
      postLayoffContactAlias: postLayoffContact,
    });
    toast({ title: "Settings Updated", description: "Default settings have been saved." });
  };
  
  const handleUpgrade = () => {
      if (!auth?.companyName) return;
      updateCompanyAssignment(auth.companyName, { version: 'pro' });
      toast({ title: "Company Upgraded!", description: `${auth.companyName} is now on the Pro version.` });
  }

  if (isLoading || companyAssignmentForHr === undefined) {
    return (
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!companyAssignmentForHr) {
      return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>Could not find company information for your account.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
      )
  }

  const isPro = companyAssignmentForHr.version === 'pro';

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company's plan and default settings.
          </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Plan & Usage</CardTitle>
                <CardDescription>Your current subscription plan and user license details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-medium">Plan Type</p>
                        <Badge variant={isPro ? 'default' : 'secondary'} className={isPro ? 'bg-green-600' : ''}>
                           {isPro ? "Pro" : "Basic"}
                        </Badge>
                    </div>
                     {isPro ? (
                        <div className="text-green-600 flex items-center gap-2">
                            <ShieldCheck />
                            <span className="font-semibold">Active</span>
                        </div>
                    ) : (
                        <Button onClick={handleUpgrade}><ShieldAlert className="mr-2"/>Upgrade to Pro</Button>
                    )}
                </div>
                 <div>
                    <Label>User Licenses</Label>
                    <Progress value={userProgress} className="w-full mt-2" />
                    <p className="text-sm text-muted-foreground mt-2 text-right">{userCount} of {maxUsers} users</p>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Deadline Defaults</CardTitle>
            <CardDescription>
              Set default contact aliases and severance deadline times for all users in your company. These can be overridden for individual users via CSV upload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pre-layoff-contact">Pre-Layoff Contact Alias</Label>
                  <Input 
                    id="pre-layoff-contact" 
                    placeholder="e.g., Your HR Business Partner" 
                    value={preLayoffContact} 
                    onChange={(e) => setPreLayoffContact(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-layoff-contact">Post-Layoff Contact Alias</Label>
                  <Input 
                    id="post-layoff-contact" 
                    placeholder="e.g., alumni-support@email.com" 
                    value={postLayoffContact} 
                    onChange={(e) => setPostLayoffContact(e.target.value)} 
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-time">Default Deadline Time</Label>
                <Input 
                  id="deadline-time" 
                  type="time" 
                  value={deadlineTime} 
                  onChange={(e) => setDeadlineTime(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-timezone">Default Timezone</Label>
                <Select value={deadlineTimezone} onValueChange={setDeadlineTimezone}>
                  <SelectTrigger id="deadline-timezone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="flex w-full justify-end">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
