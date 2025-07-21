
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { usStates } from '@/lib/states';
import { profileSchema, type ProfileData } from '@/lib/schemas';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const lifeEvents = [
    { id: 'relocation', label: 'City/state/country relocation' },
    { id: 'home_purchase', label: 'Home purchase' },
    { id: 'college', label: 'College enrollment for yourself or a dependent' },
    { id: 'marriage', label: 'Marriage / separation / divorce' },
    { id: 'illness', label: 'Serious mental or physical illness or accident (affecting you, a dependent, or a loved one)' },
    { id: 'death', label: 'Death of a family member or loved one' },
    { id: 'elder_care', label: 'Taking on elder care' },
    { id: 'none', label: 'None of the above' },
    { id: 'prefer_not_to_answer', label: 'Prefer not to answer' },
];

export default function ProfileForm() {
    const router = useRouter();
    const { saveProfileData, profileData } = useUserData();
    const { auth } = useAuth();
    const { toast } = useToast();
    
    const form = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            birthYear: undefined,
            state: '',
            gender: '',
            genderSelfDescribe: '',
            maritalStatus: '',
            hasChildrenUnder13: '',
            hasExpectedChildren: '',
            impactedPeopleCount: '',
            livingStatus: '',
            citizenshipStatus: '',
            pastLifeEvents: [],
            hasChildrenAges18To26: '',
        },
    });

    useEffect(() => {
        if (profileData) {
            form.reset(profileData);
        }
    }, [profileData, form]);

    const watchedGender = form.watch('gender');

    function onSubmit(data: ProfileData) {
        saveProfileData(data);
        toast({
          title: "Profile Saved",
          description: "Your profile has been successfully saved.",
        });
        router.push('/dashboard');
    }

    const onInvalid = (errors) => {
        console.log(errors)
        toast({
            title: "Incomplete Profile",
            description: "Please review the form and fill out all required fields.",
            variant: "destructive",
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Your company is: <span className="font-bold">{auth?.companyName || 'N/A'}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="birthYear" render={({ field }) => (
                            <FormItem>
                                <FormLabel>What’s your birth year?</FormLabel>
                                <FormControl><Input type="number" placeholder="YYYY" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem>
                                <FormLabel>What state do you live in?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {usStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Which gender do you identify with?</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="flex flex-col space-y-1">
                                        {['Nonbinary', 'Male', 'Female', 'Transgender', 'Prefer to self-describe', 'Prefer not to answer'].map(g => (
                                            <FormItem key={g} className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value={g} /></FormControl>
                                                <FormLabel className="font-normal">{g}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        {watchedGender === 'Prefer to self-describe' && (
                             <FormField control={form.control} name="genderSelfDescribe" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Self-describe gender</FormLabel>
                                    <FormControl><Input placeholder="Please specify" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Family & Household</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                         <FormField control={form.control} name="maritalStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>What’s your marital status?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {['Single', 'Married', 'Domestically partnered', 'Divorced', 'Separated', 'Widowed', 'Prefer not to answer'].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                         )} />
                        <Separator/>
                         <FormField control={form.control} name="hasChildrenUnder13" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Do you have children under age 13?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {['Yes, 1 or more', 'No', 'Prefer not to answer'].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                         )} />
                        <Separator/>
                        <FormField control={form.control} name="hasChildrenAges18To26" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Do you have children ages 18 - 26?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {['Yes, 1 or more', 'No', 'Prefer not to answer'].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                         )} />
                        <Separator/>
                         <FormField control={form.control} name="hasExpectedChildren" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Do you have 1 or more children expected (by birth or adoption)?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {['Yes, 1 or more', 'No', 'Prefer not to answer'].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                         )} />
                        <Separator/>
                         <FormField control={form.control} name="impactedPeopleCount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Other than yourself, how many other adults or children would be moderately or greatly impacted by income lost through your exit?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {['None', '1 - 3', '4 - 6', '7+', 'Prefer not to answer'].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                         )} />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>Circumstances</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="livingStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Which best describes your living status?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {['Homeowner', 'Renter', 'Corporate housing', 'Other', 'Prefer not to answer'].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                        )} />
                        <Separator />
                        <FormField control={form.control} name="citizenshipStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>What term best describes your citizenship or residence status?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="space-y-1">
                                    {[
                                        'U.S. citizen', 'Permanent U.S. resident (green card holder), not a citizen',
                                        'Pending I-485; working on an Employment Authorization Document (EAD) based on a pending I-485 (C9 class)',
                                        'Undocumented/DREAMer/DACA/student with Mixed-Status Family',
                                        'Foreign national, international student (or on a student visa - CPT, OPT, or OPT STEM)',
                                        'Other', 'Prefer not to answer'
                                    ].map(s => (
                                        <FormItem key={s} className="flex items-center space-x-3"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal">{s}</FormLabel></FormItem>
                                    ))}
                                </RadioGroup><FormMessage />
                            </FormItem>
                        )} />
                        <Separator />
                        <FormField control={form.control} name="pastLifeEvents" render={() => (
                            <FormItem>
                                <FormLabel>Have you experienced any of these life events in the past 9 months?</FormLabel>
                                <CardDescription>Select all that apply.</CardDescription>
                                {lifeEvents.map((item) => (
                                <FormField key={item.id} control={form.control} name="pastLifeEvents"
                                    render={({ field }) => {
                                        return (
                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.label)}
                                                    onCheckedChange={(checked) => {
                                                        const value = field.value || [];
                                                        return checked
                                                        ? field.onChange([...value, item.label])
                                                        : field.onChange(value?.filter((v) => v !== item.label));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                        );
                                    }}
                                />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save and Continue'}
                </Button>
            </form>
        </Form>
    );
}
