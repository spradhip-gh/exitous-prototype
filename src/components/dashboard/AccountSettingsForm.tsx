

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { accountSettingsSchema } from '@/lib/schemas';
import { useEffect, useMemo } from 'react';

type AccountSettingsFormData = z.infer<typeof accountSettingsSchema>;

export default function AccountSettingsForm() {
  const { auth } = useAuth();
  const { profileData, saveProfileData } = useUserData();
  const { toast } = useToast();

  const form = useForm<AccountSettingsFormData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      notificationEmail: auth?.email,
      notificationSettings: {
        email: { all: true },
        sms: { all: false },
      },
    },
  });
  
  const { reset } = form;

  const { notificationEmail, notificationSettings } = profileData || {};

  useEffect(() => {
    reset({
        notificationEmail: notificationEmail || auth?.email,
        notificationSettings: notificationSettings || {
            email: { all: true },
            sms: { all: false },
        },
    });
  }, [notificationEmail, notificationSettings, auth?.email, reset]);

  function onSubmit(data: AccountSettingsFormData) {
    if (!profileData) {
        toast({ title: 'Profile not found', description: "Complete your profile before managing settings.", variant: 'destructive'});
        return;
    }

    saveProfileData({
        ...profileData,
        notificationEmail: data.notificationEmail,
        notificationSettings: data.notificationSettings,
    });

    toast({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated.',
    });
  }

  const emailOptions = useMemo(() => {
    const options = new Set<string>();
    if (auth?.email) options.add(auth.email);
    if (profileData?.personalEmail) options.add(profileData.personalEmail);
    return Array.from(options).filter(Boolean);
  }, [auth?.email, profileData?.personalEmail]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how and when you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Send Notifications To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an email" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {emailOptions.map(email => email && <SelectItem key={email} value={email}>{email}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-2">Email Notifications</h4>
                        <div className="space-y-3">
                            <FormField control={form.control} name="notificationSettings.email.all" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">All Notifications</FormLabel></FormItem>)} />
                            <FormField control={form.control} name="notificationSettings.email.taskReminders" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Task Due Reminders</FormLabel></FormItem>)} />
                            <FormField control={form.control} name="notificationSettings.email.unsureReminders" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Reminders to Complete Unsure Answers</FormLabel></FormItem>)} />
                            <FormField control={form.control} name="notificationSettings.email.criticalDateReminders" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Critical Date Reminders</FormLabel></FormItem>)} />
                        </div>
                    </div>
                     <div>
                        <h4 className="font-medium mb-2">SMS Text Alerts</h4>
                        <div className="space-y-3">
                            <FormField control={form.control} name="notificationSettings.sms.all" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">All Notifications</FormLabel></FormItem>)} />
                            <FormField control={form.control} name="notificationSettings.sms.taskReminders" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Task Due Reminders</FormLabel></FormItem>)} />
                            <FormField control={form.control} name="notificationSettings.sms.unsureReminders" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Reminders to Complete Unsure Answers</FormLabel></FormItem>)} />
                            <FormField control={form.control} name="notificationSettings.sms.criticalDateReminders" render={({field}) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Critical Date Reminders</FormLabel></FormItem>)} />
                        </div>
                    </div>
                </div>

            </CardContent>
             <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="flex w-full justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
