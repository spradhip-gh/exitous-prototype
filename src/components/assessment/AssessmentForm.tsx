

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildAssessmentSchema, type AssessmentData } from '@/lib/schemas';
import { useUserData, CompanyConfig } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Question } from '@/lib/questions';
import { useAuth } from '@/hooks/use-auth';
import type { z } from 'zod';
import { useFormState } from '@/hooks/use-form-state';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CalendarIcon, Info, Star, Bug, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';


const safeFormatDate = (value: any, formatString: string) => {
    if (!value) return null;
    try {
        const date = typeof value === 'string' ? parseISO(value) : value;
        if (date instanceof Date && !isNaN(date.getTime())) {
            return format(date, formatString);
        }
    } catch (e) {
        // Fallback for different string formats if needed, but for now, we just catch the error
    }
    return null;
}

const renderFormControl = (question: Question, field: any, form: any) => {
    const { masterQuestions } = useUserData();
    const masterQuestion = masterQuestions[question.id];
    const masterOptionsSet = useMemo(() => new Set(masterQuestion?.options || []), [masterQuestion]);

    switch (question.type) {
        case 'select':
            return (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder={question.placeholder} /></SelectTrigger></FormControl>
                    <SelectContent>{question.options?.map(o => {
                        const isCustom = !question.isCustom && !masterOptionsSet.has(o);
                        return (
                            <SelectItem key={o} value={o}>
                                <div className="flex items-center gap-2">
                                    <span>{o}</span>
                                    {isCustom && (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger>
                                                    <Star className="h-4 w-4 text-amber-500 fill-current" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Custom answer option added by your company.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </SelectItem>
                        )
                    })}</SelectContent>
                </Select>
            );
        case 'date': {
            const isUnsure = field.value === 'Unsure';
            return (
                <div className="flex items-center gap-4">
                    <Popover><PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isUnsure}>
                                {field.value instanceof Date && !isNaN(field.value.getTime()) ? format(field.value, "PPP") : (isUnsure ? "I'm not sure" : <span>{question.placeholder}</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                        <Calendar captionLayout="dropdown-buttons" fromYear={1960} toYear={new Date().getFullYear() + 5} mode="single" selected={isUnsure ? undefined : field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent></Popover>
                    {question.parentId && (
                        <div className="flex items-center space-x-2">
                             <Checkbox
                                id={`${question.id}-unsure`}
                                checked={isUnsure}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked ? 'Unsure' : undefined);
                                }}
                            />
                            <label htmlFor={`${question.id}-unsure`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I'm not sure
                            </label>
                        </div>
                    )}
                </div>
            );
        }
        case 'radio':
            return (
                 <FormControl><RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="flex flex-wrap gap-4">
                    {question.options?.map(o => {
                        const isCustom = !question.isCustom && !masterOptionsSet.has(o);
                        return (
                        <FormItem key={o} className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value={o} /></FormControl>
                            <div className="flex items-center gap-2">
                                <FormLabel className="font-normal">{o}</FormLabel>
                                {isCustom && (
                                     <TooltipProvider>
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger>
                                                <Star className="h-4 w-4 text-amber-500 fill-current" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Custom answer option added by your company.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </FormItem>
                        )
                    })}
                </RadioGroup></FormControl>
            );
        case 'checkbox':
             return (
                <div className="space-y-2">
                    {question.options?.map((item) => (
                    <FormField key={item} control={form.control} name={question.id as any} render={({ field: f }) => {
                        const isCustom = !question.isCustom && !masterOptionsSet.has(item);
                        return (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={f.value?.includes(item)} onCheckedChange={(checked) => {
                                const exclusiveOption = question.exclusiveOption;
                                let newValue = [...(f.value || [])];

                                if (checked) {
                                    if (item === exclusiveOption) {
                                        // If exclusive is checked, set array to only be exclusive
                                        newValue = [exclusiveOption];
                                    } else {
                                        // If another item is checked, add it and remove exclusive
                                        newValue.push(item);
                                        if (exclusiveOption) {
                                            newValue = newValue.filter(v => v !== exclusiveOption);
                                        }
                                    }
                                } else {
                                    // Just remove the item if unchecked
                                    newValue = newValue.filter(v => v !== item);
                                }
                                return f.onChange(newValue);
                            }} /></FormControl>
                             <div className="flex items-center gap-2">
                                <FormLabel className="font-normal">{item}</FormLabel>
                                 {isCustom && (
                                     <TooltipProvider>
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger>
                                                <Star className="h-4 w-4 text-amber-500 fill-current" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Custom answer option added by your company.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </FormItem>);
                    }} />
                    ))}
                </div>
            );
        case 'text':
             return <FormControl><Input placeholder={question.placeholder} {...field} value={field.value ?? ''} /></FormControl>;
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
                                            {isSeveranceQuestion ? companyDeadline : question.description}
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


function AssessmentFormRenderer({ questions, dynamicSchema, initialData, profileData, companyConfig }: { 
    questions: Question[], 
    dynamicSchema: z.ZodObject<any>, 
    initialData: AssessmentData, 
    profileData: any,
    companyConfig: CompanyConfig | null,
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { saveAssessmentData, companyAssignments, getTargetTimezone, getMasterQuestionConfig, clearRecommendations, getCompanyUser } = useUserData();
    const { auth } = useAuth();
    const { toast } = useToast();
    const { setIsDirty } = useFormState();
    
    const form = useForm<AssessmentData>({
        resolver: zodResolver(dynamicSchema),
        values: initialData,
    });
    
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const { watch, setValue, getValues, reset, formState: { isDirty } } = form;

    useEffect(() => {
        setIsDirty(isDirty);
        return () => setIsDirty(false); // Cleanup on unmount
    }, [isDirty, setIsDirty]);
    
    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const companyDetails = useMemo(() => {
        if (!auth?.companyName) return null;
        return companyAssignments.find(c => c.companyName === auth.companyName);
    }, [auth?.companyName, companyAssignments]);
    
    const userTimezone = getTargetTimezone();
    const companyUser = auth?.email ? getCompanyUser(auth.email)?.user : null;

    const companyDeadlineTooltip = useMemo(() => {
        if (!companyDetails) return undefined;
        const time = companyDetails.severanceDeadlineTime || "23:59";
        return `${auth?.companyName}'s deadline is ${time} ${userTimezone} on the specified date.`;
    }, [companyDetails, auth?.companyName, userTimezone]);


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

    function onSubmit(data: AssessmentData) {
        const isEditingSection = searchParams.has('section');
        saveAssessmentData({ ...data, companyName: auth?.companyName });
        clearRecommendations(); // Clear AI recommendations on save
        setIsDirty(false);
        // If editing, go back to review page. Otherwise, go to dashboard timeline.
        router.push(isEditingSection ? '/dashboard/assessment' : '/dashboard');
    }

    const onInvalid = (errors: any) => {
        console.log("Form errors:", errors);
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

    const handleSaveForLater = () => {
        const data = getValues();
        saveAssessmentData({ ...data, companyName: auth?.companyName });
        clearRecommendations();
        setIsDirty(false);
        toast({
            title: "Progress Saved",
            description: "Your answers have been saved. You can return later to complete the assessment."
        });
        router.push('/dashboard');
    }
    
    const companyName = auth?.companyName || "your previous company";
    const editingSection = searchParams.get('section');

    const orderedSections = useMemo(() => {
        const sectionsMap: Record<string, Question[]> = {};
        const masterConfig = getMasterQuestionConfig('assessment');
        const sectionOrder = masterConfig?.section_order || [];
        
        const questionsToProcess = editingSection 
            ? questions.filter(q => q.section === editingSection)
            : questions;
        
        questionsToProcess.forEach(q => {
            if (q.parentId) return;

            if (q.dependsOn && q.dependencySource === 'profile' && profileData) {
                const dependencyValue = profileData[q.dependsOn as keyof typeof profileData];
                let isTriggered = false;
                if (Array.isArray(q.dependsOnValue)) {
                    isTriggered = q.dependsOnValue.includes(dependencyValue as string);
                } else {
                    isTriggered = dependencyValue === q.dependsOnValue;
                }
                if (!isTriggered) return;
            }
            
            const sectionName = q.section || "Uncategorized";
            if (!sectionsMap[sectionName]) {
                sectionsMap[sectionName] = [];
            }
            sectionsMap[sectionName].push(q);
        });
        
        // Add custom sections to the order if they don't exist
        const masterSectionSet = new Set(sectionOrder);
        Object.keys(sectionsMap).forEach(sectionName => {
            if (!masterSectionSet.has(sectionName)) {
                sectionOrder.push(sectionName);
                masterSectionSet.add(sectionName);
            }
        });

        return sectionOrder
            .map(sectionName => ({
                name: sectionName,
                questions: sectionsMap[sectionName]?.sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            }))
            .filter(section => section.questions && section.questions.length > 0);

    }, [questions, profileData, editingSection, getMasterQuestionConfig]);
    
     useEffect(() => {
        const section = searchParams.get('section');
        if (section && sectionRefs.current[section]) {
            setTimeout(() => {
                sectionRefs.current[section]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 100);
        }
    }, [searchParams]);

    const pageTitle = editingSection ? `Edit: ${editingSection}` : 'Exit Details';
    const pageDescription = editingSection 
        ? 'Update your answers below and save your changes.'
        : 'Please provide details about your exit. This will help us create a personalized timeline and resource list for you.';

    return (
         <div className="p-4 md:p-8">
            <div className="mx-auto max-w-2xl space-y-6">
                 <div>
                    <h1 className="font-headline text-3xl font-bold">{pageTitle}</h1>
                    <p className="text-muted-foreground">{pageDescription}</p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                        {orderedSections.map(({ name: section, questions: sectionQuestions }) => (
                            <Card key={section} ref={(el) => (sectionRefs.current[section] = el)}>
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
                                {editingSection && (
                                     <CardFooter className="border-t pt-6">
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                        
                        {questions.length > 0 && !editingSection &&
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="button" variant="secondary" onClick={handleSaveForLater} className="w-full">
                                    Save for Later
                                </Button>
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Saving...' : 'See My Timeline'}
                                </Button>
                            </div>
                        }
                    </form>
                </Form>
                {process.env.NODE_ENV !== 'production' && (
                     <Collapsible>
                        <Card className="border-destructive">
                             <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Bug className="text-destructive" />
                                            Assessment Debug Info
                                        </span>
                                        <ChevronDown className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent>
                                    <div className="text-xs">
                                        <p><strong>User's Project ID:</strong> {companyUser?.project_id || 'None'}</p>
                                    </div>
                                     <Collapsible className="mt-2">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="link" className="p-0 h-auto">
                                                Show Custom Questions from Config ({Object.keys(companyConfig?.customQuestions || {}).length}) <ChevronDown className="ml-1 h-4 w-4"/>
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                                {Object.values(companyConfig?.customQuestions || {}).map(q => (
                                                    <li key={q.id}>
                                                        {q.label} ({q.id}) - Projects: {q.projectIds?.join(', ') || 'All'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CollapsibleContent>
                                    </Collapsible>
                                     <Collapsible className="mt-2">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="link" className="p-0 h-auto">
                                                Show Final Merged Question List ({questions.length}) <ChevronDown className="ml-1 h-4 w-4"/>
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                                {questions.map(q => <li key={q.id}>{q.label} ({q.id}) {q.isCustom && <strong className="text-amber-600">CUSTOM</strong>}</li>)}
                                            </ul>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                )}
            </div>
        </div>
    );
}

export default function AssessmentFormWrapper() {
    const { getCompanyConfig, isLoading: isUserDataLoading, assessmentData, profileData, getAllCompanyConfigs } = useUserData();
    const { auth } = useAuth();
    
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [dynamicSchema, setDynamicSchema] = useState<z.ZodObject<any> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const initialData = useMemo(() => assessmentData, [assessmentData]);
    const companyConfig = useMemo(() => auth?.companyName ? getAllCompanyConfigs()[auth.companyName] : null, [auth?.companyName, getAllCompanyConfigs]);

    useEffect(() => {
        if (!isUserDataLoading && auth?.companyName) {
            const companyQuestions = getCompanyConfig(auth.companyName, true, 'assessment');
            setQuestions(companyQuestions);
            setDynamicSchema(buildAssessmentSchema(companyQuestions, profileData));
            setIsLoading(false);
        } else if (!isUserDataLoading) {
            setIsLoading(false);
        }
    }, [isUserDataLoading, getCompanyConfig, auth, profileData]);

    if (isLoading || !initialData || !questions || !dynamicSchema) {
        return (
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-2xl space-y-6">
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
            </div>
        )
    }

    return <AssessmentFormRenderer key={JSON.stringify(initialData)} questions={questions} dynamicSchema={dynamicSchema} initialData={initialData} profileData={profileData} companyConfig={companyConfig} />;
}
