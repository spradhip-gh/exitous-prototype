'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timezones } from '@/lib/timezones';
import { useRouter } from 'next/navigation';

const accountSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  timezone: z.string().min(1, 'Please select a timezone.'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountSettingsForm() {
  const { auth, updateEmail } = useAuth();
  const { userTimezone, saveUserTimezone } = useUserData();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: auth?.email || '',
      timezone: userTimezone || 'America/Los_Angeles',
    },
  });

  function onSubmit(data: AccountFormData) {
    if (!auth) return;
    
    // Check if email is different and needs to be updated
    if (data.email.toLowerCase() !== auth.email?.toLowerCase()) {
        updateEmail(data.email);
    }
    
    saveUserTimezone(data.timezone);

    toast({
      title: 'Settings Saved',
      description: 'Your account settings have been updated.',
    });
    
    // Refresh to ensure all components have the latest data
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>Update your primary email address and timezone preference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
