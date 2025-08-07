

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
  const { profileData, getCompanyUser, updateCompanyUserContact } = useUserData();
  const { toast } = useToast();

  const companyUser = auth?.email ? getCompanyUser(auth.email) : null;

  const form = useForm<AccountSettingsFormData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      personalEmail: '',
      phone: '',
      notificationEmail: auth?.email,
      notificationSettings: {
        email: { all: true },
        sms: { all: false },
      },
    },
  });
  
  const { reset } = form;

  useEffect(() => {
    if (companyUser) {
        reset({
            personalEmail: companyUser.user.personal_email || '',
            phone: companyUser.user.phone || '',
            notificationEmail: profileData?.notificationEmail || auth?.email,
            notificationSettings: profileData?.notificationSettings || {
                email: { all: true },
                sms: { all: false }
            },
        });
    }
  }, [companyUser, profileData, auth?.email, reset]);

  function onSubmit(data: AccountSettingsFormData) {
    if (!companyUser) {
        toast({ title: 'User not found', variant: 'destructive'});
        return;
    }

    updateCompanyUserContact(companyUser.user.id, {
        personal_email: data.personalEmail,
        phone: data.phone,
    });

    toast({
      title: 'Settings Saved',
      description: 'Your account settings have been updated.',
    });
  }

  const emailOptions = useMemo(() => {
    const options = new Set<string>();
    if (auth?.email) options.add(auth.email);
    if (companyUser?.user.personal_email) options.add(companyUser.user.personal_email);
    return Array.from(options);
  }, [auth?.email, companyUser?.user.personal_email]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Manage the contact details we use to communicate with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="personalEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Personal Email Address</FormLabel>
                        <FormControl>
                            <Input placeholder="your.name@personal.com" {...field} />
                        </FormControl>
                         <FormDescription>This is where we'll send important updates after your access to your work email ends.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number (for SMS alerts)</FormLabel>
                        <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
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
