'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { assessmentSchema, type AssessmentData } from '@/lib/schemas';
import { useUserData } from '@/hooks/use-user-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const assessmentOptions = [
    'Optimistic and ready for the next chapter',
    'Worried, but hopeful about the future',
    'Stressed and uncertain about what to do next',
    'Feeling overwhelmed and anxious',
    'Angry or frustrated with the situation',
    'A mix of many different emotions',
];

export default function AssessmentForm() {
    const router = useRouter();
    const { saveAssessmentData, assessmentData } = useUserData();
    
    const form = useForm<AssessmentData>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: assessmentData || {
            emotionalState: '',
        },
    });

    function onSubmit(data: AssessmentData) {
        saveAssessmentData(data);
        router.push('/');
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="emotionalState"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-base font-semibold">Which of these best describes your current outlook regarding your career and job search?</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-2"
                                        >
                                            {assessmentOptions.map((option) => (
                                                <FormItem key={option} className="flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors hover:bg-accent/50 [&:has([data-state=checked])]:bg-accent">
                                                    <FormControl>
                                                        <RadioGroupItem value={option} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal w-full cursor-pointer">
                                                        {option}
                                                    </FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'See My Timeline'}
                </Button>
            </form>
        </Form>
    );
}
