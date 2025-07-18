
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { buildAssessmentSchema, type AssessmentData } from '@/lib/schemas';
import { useUserData } from '@/hooks/use-user-data';
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
                 <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
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
             return <FormControl><Input placeholder={question.placeholder} {...field} /></FormControl>;
        default:
            return <Input {...field} />;
    }
}

const QuestionRenderer = ({ question, form, companyName, companyDeadline }: { question: Question, form: any, companyName: string, companyDeadline?: string }) => {
    const watchedValue = form.watch(question.id);
    
    const isSeveranceQuestion = question.id === 'severanceAgreementDeadline';

    return (
        <div className="space-y-6">
            <FormField
                key={question.id}
                control={form.control}
                name={question.id as keyof AssessmentData}
                render={({ field }) => (
                <FormItem>
                    <div className='flex items-center gap-2'>
                        <FormLabel>{question.label.replace('{companyName}', companyName)}</FormLabel>
                        {question.isCustom && (
                             <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild><Star className="h-4 w-4 text-amber-500 cursor-help fill-current" /></TooltipTrigger>
                                    <TooltipContent><p>This is a custom question added by {companyName}.</p></TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        )}
                        {(question.description || (isSeveranceQuestion && companyDeadline)) && (
                            <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            {isSeveranceQuestion && companyDeadline ? companyDeadline : question.description}
                                        </p>
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
                            if (subQuestion.triggerValue === 'NOT_NONE') {
                                isTriggered = Array.isArray(watchedValue) && watchedValue.length > 0 && !watchedValue.includes('None of the above');
                            } else {
                                isTriggered = Array.isArray(watchedValue) && watchedValue.includes(subQuestion.triggerValue);
                            }
                        } else {
                            isTriggered = watchedValue === subQuestion.triggerValue;
                        }

                        if (isTriggered) {
                           return <QuestionRenderer key={subQuestion.id} question={subQuestion} form={form} companyName={companyName} companyDeadline={companyDeadline} />
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};


export default function AssessmentForm() {
    const { getCompanyConfig, isUserDataLoading, getCompanyUser } = useUserData();
    const { auth } = useAuth();
    
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [dynamicSchema, setDynamicSchema] = useState<z.ZodObject<any> | null>(null);
    const [companyUser, setCompanyUser] = useState<ReturnType<typeof getCompanyUser>>(null);

    useEffect(() => {
        if (!isUserDataLoading && auth?.companyName) {
            const companyQuestions = getCompanyConfig(auth.companyName, true);
            setQuestions(companyQuestions);
            setDynamicSchema(buildAssessmentSchema(companyQuestions));
            if (auth.email) {
                setCompanyUser(getCompanyUser(auth.email));
            }
        }
    }, [isUserDataLoading, getCompanyConfig, auth?.companyName, auth?.email, getCompanyUser]);

    if (!questions || !dynamicSchema) {
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

    return <AssessmentFormRenderer questions={questions} dynamicSchema={dynamicSchema} companyUser={companyUser} />;
}

function AssessmentFormRenderer({ questions, dynamicSchema, companyUser }: { questions: Question[], dynamicSchema: z.ZodObject<any>, companyUser: ReturnType<typeof useUserData>['getCompanyUser'] }) {
    const router = useRouter();
    const { profileData, assessmentData, saveAssessmentData, companyAssignments } = useUserData();
    const { auth } = useAuth();
    const { toast } = useToast();
    
    const form = useForm<AssessmentData>({
        resolver: zodResolver(dynamicSchema),
    });

    const { watch, setValue, getValues } = form;
    
    const companyDetails = useMemo(() => {
        if (!auth?.companyName) return null;
        return companyAssignments.find(c => c.companyName === auth.companyName);
    }, [auth?.companyName, companyAssignments]);

    const companyDeadlineTooltip = useMemo(() => {
        if (!companyDetails) return undefined;
        const time = companyDetails.severanceDeadlineTime || "23:59";
        const timezone = companyDetails.severanceDeadlineTimezone || "PST";
        return `${auth?.companyName}'s deadline is ${time} ${timezone} on the specified date.`;
    }, [companyDetails, auth?.companyName]);


    const watchedFinalDate = watch('finalDate');
    const watchedHadMedical = watch('hadMedicalInsurance');
    const watchedHadDental = watch('hadDentalInsurance');
    const watchedHadVision = watch('hadVisionInsurance');
    const watchedHadEAP = watch('hadEAP');


    useEffect(() => {
        // Auto-fill coverage end dates based on final employment date
        if (watchedFinalDate && !isNaN(new Date(watchedFinalDate).getTime())) {
            const finalDate = new Date(watchedFinalDate);
            const lastDayOfMonth = new Date(finalDate.getFullYear(), finalDate.getMonth() + 1, 0);

            const coverageToEndOfMonth: (keyof AssessmentData)[] = [
                'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate', 'eapCoverageEndDate'
            ];
            coverageToEndOfMonth.forEach(field => {
                let insuranceField: keyof AssessmentData;
                if (field === 'eapCoverageEndDate') {
                    insuranceField = 'hadEAP';
                } else {
                    const prefix = field.replace('CoverageEndDate', '');
                    insuranceField = `had${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Insurance` as keyof AssessmentData;
                }
                
                if (getValues(insuranceField) === 'Yes' && !getValues(field)) {
                    setValue(field as any, lastDayOfMonth, { shouldValidate: true });
                }
            });
        }
        
        // Auto-fill insurance coverage type based on profile data
        if (!profileData) return;

        const hasChildren = profileData.hasChildrenUnder13?.startsWith('Yes') || profileData.hasChildrenAges18To26?.startsWith('Yes');
        const isMarried = profileData.maritalStatus === 'Married';

        let defaultCoverage: string | null = null;
        if (hasChildren) defaultCoverage = 'Me and family';
        else if (isMarried) defaultCoverage = 'Me and spouse';
        else defaultCoverage = 'Only me';

        if (defaultCoverage) {
             const coverageFields: (keyof AssessmentData)[] = ['medicalCoverage', 'dentalCoverage', 'visionCoverage'];
             coverageFields.forEach(field => {
                const prefix = field.replace('Coverage', '');
                const insuranceField = `had${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Insurance` as keyof AssessmentData;
                 if (getValues(insuranceField) === 'Yes' && !getValues(field)) {
                    setValue(field as any, defaultCoverage, { shouldValidate: true });
                }
             });
        }
    }, [profileData, watchedFinalDate, watchedHadMedical, watchedHadDental, watchedHadVision, watchedHadEAP, getValues, setValue]);
    
    useEffect(() => {
        if (!form.formState.isDirty) {
            let initialValues: Partial<AssessmentData> = assessmentData ? { ...assessmentData } : {};
            
            if (!assessmentData) {
                if (companyUser?.user.prefilledAssessmentData) {
                    const prefilled = { ...companyUser.user.prefilledAssessmentData };
                    for (const key in prefilled) {
                        const value = prefilled[key as keyof typeof prefilled];
                        if (typeof value === 'string' && key.toLowerCase().includes('date')) {
                            const dateInUtc = toZonedTime(value, 'UTC');
                            if (!isNaN(dateInUtc.getTime())) {
                                (prefilled as any)[key] = dateInUtc;
                            }
                        }
                    }
                     initialValues = { ...initialValues, ...prefilled };
                }

                if (companyUser?.user.notificationDate) {
                    const dateInUtc = toZonedTime(companyUser.user.notificationDate, 'UTC');
                    if(!isNaN(dateInUtc.getTime())) {
                       initialValues.notificationDate = dateInUtc;
                    }
                }
                
                const getDefaults = (q: Question) => {
                    let defaults: Record<string, any> = {};
                    if (q.defaultValue && q.defaultValue.length > 0 && !initialValues[q.id as keyof typeof initialValues]) {
                        defaults[q.id] = q.defaultValue;
                    }
                    if (q.subQuestions) {
                        q.subQuestions.forEach(subQ => {
                            Object.assign(defaults, getDefaults(subQ));
                        });
                    }
                    return defaults;
                }
                
                let defaultValues: Partial<AssessmentData> = {};
                questions.forEach(q => {
                   Object.assign(defaultValues, getDefaults(q))
                });
                initialValues = { ...defaultValues, ...initialValues };
            }

            if (Object.keys(initialValues).length > 0) {
              form.reset(initialValues);
            }
        }
    }, [questions, assessmentData, form, companyUser]);

    function onSubmit(data: AssessmentData) {
        saveAssessmentData({ ...data, companyName: auth?.companyName });
        router.push('/dashboard');
    }

    const onInvalid = () => {
        toast({
            title: "Incomplete Assessment",
            description: "Please review the form and fill out all required fields.",
            variant: "destructive",
        });
        setTimeout(() => {
            const firstErrorElement = document.querySelector('[aria-invalid="true"]');
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };
    
    const companyName = auth?.companyName || "your previous company";

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
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {sectionQuestions.map(q => (
                             <QuestionRenderer 
                                key={q.id} 
                                question={q} 
                                form={form} 
                                companyName={companyName}
                                companyDeadline={companyDeadlineTooltip}
                             />
                           ))}
                        </CardContent>
                    </Card>
                ))}
                
                {questions.length > 0 &&
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'See My Timeline'}
                    </Button>
                }
            </form>
        </Form>
    );
}
