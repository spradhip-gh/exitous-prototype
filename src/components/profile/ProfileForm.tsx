

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { usStates } from '@/lib/states';
import { profileSchema as buildStaticProfileSchema, buildProfileSchema, type ProfileData } from '@/lib/schemas';
import { useUserData, buildQuestionTreeFromMap } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import type { Question } from '@/lib/questions';
import { useAuth } from '@/hooks/use-auth';
import type { z } from 'zod';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CalendarIcon, Info, Star } from 'lucide-react';
import { convertStringsToDates } from '@/hooks/use-user-data';

const renderFormControl = (question: Question, field: any, form: any) => {
    switch (question.type) {
        case 'select':
            return (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder={question.placeholder} /></SelectTrigger></FormControl>
                    <SelectContent>{question.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'date':
             return (
                <Popover><PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>{question.placeholder}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                    <Calendar captionLayout="dropdown-buttons" fromYear={1960} toYear={new Date().getFullYear() + 5} mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent></Popover>
            );
        case 'radio':
            return (
                 <FormControl><RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="flex flex-wrap gap-4">
                    {question.options?.map(o => <FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o} /></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}
                </RadioGroup></FormControl>
            );
        case 'checkbox':
             return (
                <div className="space-y-2">
                    {question.options?.map((item) => (
                    <FormField key={item} control={form.control} name={question.id as any} render={({ field: f }) => {
                        return (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={f.value?.includes(item)} onCheckedChange={(checked) => {
                                const value = f.value || [];
                                return checked ? f.onChange([...value, item]) : f.onChange(value?.filter((v) => v !== item));
                            }} /></FormControl>
                            <FormLabel className="font-normal">{item}</FormLabel>
                        </FormItem>);
                    }} />
                    ))}
                </div>
            );
        case 'text':
             return <FormControl><Input placeholder={question.placeholder} {...field} value={field.value ?? ''} onChange={e => field.onChange(question.id === 'birthYear' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)} /></FormControl>;
        default:
            return <Input {...field} />;
    }
}

const QuestionRenderer = ({ question, form }: { question: Question, form: any }) => {
    const watchedValue = form.watch(question.id);
    
    return (
        <div className="space-y-6">
            <FormField
                key={question.id}
                control={form.control}
                name={question.id as keyof ProfileData}
                render={({ field }) => (
                <FormItem>
                    <div className='flex items-center gap-2'>
                        <FormLabel>{question.label}</FormLabel>
                         {question.description && (
                            <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{question.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    {renderFormControl(question, field, form)}
                    <FormMessage />
                </FormItem>
                )}
            />
            
            {question.subQuestions && question.subQuestions.length > 0 && (
                <div className="pl-6 border-l-2 ml-4 space-y-6">
                    {question.subQuestions.map(subQuestion => {
                        let isTriggered = false;
                        if(question.type === 'checkbox') {
                            isTriggered = Array.isArray(watchedValue) && watchedValue.includes(subQuestion.triggerValue);
                        } else {
                            isTriggered = watchedValue === subQuestion.triggerValue;
                        }

                        if (isTriggered) {
                           return <QuestionRenderer key={subQuestion.id} question={subQuestion} form={form} />
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};


function ProfileFormRenderer({ questions, dynamicSchema, initialData }: { questions: Question[], dynamicSchema: z.ZodObject<any>, initialData: ProfileData }) {
    const router = useRouter();
    const { saveProfileData } = useUserData();
    const { auth } = useAuth();
    const { toast } = useToast();
    
    const form = useForm<ProfileData>({
        resolver: zodResolver(dynamicSchema),
        values: initialData,
    });

    function onSubmit(data: ProfileData) {
        saveProfileData(data);
        toast({
          title: "Profile Saved",
          description: "Your profile has been successfully saved.",
        });
        router.push('/dashboard/assessment');
    }

    const onInvalid = (errors: any) => {
        console.log(errors)
        toast({
            title: "Incomplete Profile",
            description: "Please review the form and fill out all required fields.",
            variant: "destructive",
        });
    };
    
    const groupedQuestions = useMemo(() => {
        const sections: Record<string, Question[]> = {};
        questions.forEach(q => {
            if (q.parentId) return;
            const sectionName = q.section || "Uncategorized";
            if (!sections[sectionName]) {
                sections[sectionName] = [];
            }
            sections[sectionName].push(q);
        });
        return sections;
    }, [questions]);


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                 {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                    <Card key={section}>
                        <CardHeader>
                            <CardTitle>{section}</CardTitle>
                             {section === 'Basic Information' && (
                                 <CardDescription>
                                    Your company is: <span className="font-bold">{auth?.companyName || 'N/A'}</span>
                                </CardDescription>
                             )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {sectionQuestions.map(q => <QuestionRenderer key={q.id} question={q} form={form} />)}
                        </CardContent>
                    </Card>
                ))}
                
                {questions.length > 0 &&
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save and Continue'}
                    </Button>
                }
            </form>
        </Form>
    );
}

export default function ProfileForm() {
    const { masterProfileQuestions, profileData, isUserDataLoading } = useUserData();
    
    const questions = useMemo(() => buildQuestionTreeFromMap(masterProfileQuestions), [masterProfileQuestions]);
    const dynamicSchema = useMemo(() => buildProfileSchema(questions), [questions]);
    
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isUserDataLoading) {
            setIsLoading(false);
        }
    }, [isUserDataLoading]);

    if (isLoading || !questions || !dynamicSchema) {
         return (
            <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                        <CardContent className="space-y-6">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return <ProfileFormRenderer questions={questions} dynamicSchema={dynamicSchema} initialData={profileData || {}} />;
}
