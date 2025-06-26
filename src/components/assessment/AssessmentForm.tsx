'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { assessmentSchema, type AssessmentData } from '@/lib/schemas';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { getDefaultQuestions, Question } from '@/lib/questions';


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
import { CalendarIcon, Info } from 'lucide-react';


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
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                    <FormField key={item} control={form.control} name={question.id} render={({ field: f }) => {
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

export default function AssessmentForm() {
    const router = useRouter();
    const { profileData, assessmentData, saveAssessmentData, getCompanyConfig, isLoading: isUserDataLoading } = useUserData();
    const { toast } = useToast();
    
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<AssessmentData>({
        resolver: zodResolver(assessmentSchema),
    });

    const { watch, setValue, getValues } = form;
    const watchedFinalDate = watch('finalDate');
    const watchedHadMedical = watch('hadMedicalInsurance');
    const watchedHadDental = watch('hadDentalInsurance');
    const watchedHadVision = watch('hadVisionInsurance');
    const watchedHadEAP = watch('hadEAP');

    useEffect(() => {
        if (watchedFinalDate && !isNaN(new Date(watchedFinalDate).getTime())) {
            const finalDate = new Date(watchedFinalDate);
            const lastDayOfMonth = new Date(finalDate.getFullYear(), finalDate.getMonth() + 1, 0);

            if (watchedHadMedical === 'Yes' && !getValues('medicalCoverageEndDate')) {
                setValue('medicalCoverageEndDate', lastDayOfMonth);
            }
            if (watchedHadDental === 'Yes' && !getValues('dentalCoverageEndDate')) {
                setValue('dentalCoverageEndDate', lastDayOfMonth);
            }
            if (watchedHadVision === 'Yes' && !getValues('visionCoverageEndDate')) {
                setValue('visionCoverageEndDate', lastDayOfMonth);
            }
            if (watchedHadEAP === 'Yes' && !getValues('eapCoverageEndDate')) {
                setValue('eapCoverageEndDate', lastDayOfMonth);
            }
        }
    }, [watchedFinalDate, watchedHadMedical, watchedHadDental, watchedHadVision, watchedHadEAP, setValue, getValues]);

    useEffect(() => {
        if (isUserDataLoading) return;

        const config = getCompanyConfig(profileData?.companyName);
        const allQuestions = Object.values(config);
        const activeQuestions = allQuestions.filter(q => q.isActive);
        const sortedActiveQuestions = activeQuestions.sort((a, b) => {
             const allQuestionDefaults = getDefaultQuestions();
             return allQuestionDefaults.findIndex(q => q.id === a.id) - allQuestionDefaults.findIndex(q => q.id === b.id);
        });
        setQuestions(sortedActiveQuestions);
        
        // Apply initial values
        // Priority: 1. Saved user data, 2. Company defaults, 3. Empty form
        if (!form.formState.isDirty) {
            const initialValues = assessmentData ? assessmentData : {};
        
            if (!assessmentData) { // only apply config defaults if no saved data
                sortedActiveQuestions.forEach(q => {
                    if (q.defaultValue && q.defaultValue.length > 0) {
                        (initialValues as any)[q.id] = q.defaultValue;
                    }
                });
            }
            form.reset(initialValues);
        }

        setIsLoading(false);
    }, [profileData, getCompanyConfig, assessmentData, isUserDataLoading, form]);


    const watchedFields = form.watch();

    function onSubmit(data: AssessmentData) {
        saveAssessmentData(data);
        router.push('/dashboard');
    }

    const onInvalid = () => {
        toast({
            title: "Incomplete Assessment",
            description: "Please review the form and fill out all required fields.",
            variant: "destructive",
        });
    };
    
    const companyName = profileData?.companyName || "your previous company";

    const groupedQuestions = questions.reduce((acc, q) => {
        if (!acc[q.section]) {
            acc[q.section] = [];
        }
        acc[q.section].push(q);
        return acc;
    }, {} as Record<string, Question[]>);


    if(isLoading) {
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

    return (
        <TooltipProvider>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                    <Card key={section}>
                        <CardHeader>
                            <CardTitle>{section}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {sectionQuestions.map(q => (
                             <FormField
                                key={q.id}
                                control={form.control}
                                name={q.id as keyof AssessmentData}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{q.label.replace('{companyName}', companyName)}</FormLabel>
                                    {q.description && <FormDescription>{q.description}</FormDescription>}
                                    {renderFormControl(q, field, form)}
                                    <FormMessage />

                                    {/* Conditional fields */}
                                    {q.id === 'relocationPaid' && watchedFields.relocationPaid === 'Yes' && <FormField control={form.control} name="relocationDate" render={({ field: f }) => (<FormItem className="flex flex-col pt-4"><FormLabel>Date of your relocation</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                                    {q.id === 'workArrangement' && watchedFields.workArrangement === 'Other' && <FormField control={form.control} name="workArrangementOther" render={({ field: f }) => (<FormItem className="pt-2"><FormLabel className="sr-only">Other work arrangement</FormLabel><FormControl><Input placeholder="Please specify" {...f} /></FormControl><FormMessage /></FormItem>)} />}
                                    {q.id === 'onLeave' && watchedFields.onLeave && watchedFields.onLeave.length > 0 && !watchedFields.onLeave.includes('None of the above') && <FormField control={form.control} name="usedLeaveManagement" render={({ field: f }) => (<FormItem className="pt-4"><FormLabel>Were you utilizing leave management (e.g., Tilt, Cocoon)?</FormLabel><FormControl><RadioGroup onValueChange={f.onChange} value={f.value} className="flex space-x-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes"/></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No"/></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure"/></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem></RadioGroup></FormControl><FormMessage/></FormItem>)}/>}
                                    
                                    {q.id === 'accessSystems' && <div className="space-y-4 pt-4 pl-6">
                                        {watchedFields.accessSystems?.includes('Internal messaging system (e.g., Slack, Google Chat, Teams)') && <FormField control={form.control} name="internalMessagingAccessEndDate" render={({ field: f }) => (<FormItem className="flex flex-col"><FormLabel>Messaging Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                                        {watchedFields.accessSystems?.includes('Email') && <FormField control={form.control} name="emailAccessEndDate" render={({ field: f }) => (<FormItem className="flex flex-col"><FormLabel>Email Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                                        {watchedFields.accessSystems?.includes('Network drive & files') && <FormField control={form.control} name="networkDriveAccessEndDate" render={({ field: f }) => (<FormItem className="flex flex-col"><FormLabel>Network Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                                        {watchedFields.accessSystems?.includes('Special layoff portal') && <FormField control={form.control} name="layoffPortalAccessEndDate" render={({ field: f }) => (<FormItem className="flex flex-col"><FormLabel>Portal Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                                        {watchedFields.accessSystems?.includes('HR/Payroll system (e.g., ADP, Workday)') && <FormField control={form.control} name="hrPayrollSystemAccessEndDate" render={({ field: f }) => (<FormItem className="flex flex-col"><FormLabel>HR/Payroll Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                                    </div>}

                                    {q.id === 'hadMedicalInsurance' && watchedFields.hadMedicalInsurance === 'Yes' && (<div className="pl-6 space-y-4 pt-4"><FormField control={form.control} name="medicalCoverage" render={({ field: f }) => (<FormItem><FormLabel>Who was covered?</FormLabel><FormControl><RadioGroup onValueChange={f.onChange} value={f.value} className="flex flex-wrap gap-4">{['Only me', 'Me and spouse', 'Me and family', 'Unsure'].map(o=><FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o}/></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage/></FormItem>)} /><FormField control={form.control} name="medicalCoverageEndDate" render={({ field:f }) => (<FormItem className="flex flex-col"><div className="flex items-center gap-1"><FormLabel>Last day of coverage?</FormLabel><Tooltip delayDuration={200}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs">This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect.</p></TooltipContent></Tooltip></div><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/></div>)}
                                    {q.id === 'hadDentalInsurance' && watchedFields.hadDentalInsurance === 'Yes' && (<div className="pl-6 space-y-4 pt-4"><FormField control={form.control} name="dentalCoverage" render={({ field:f }) => (<FormItem><FormLabel>Who was covered?</FormLabel><FormControl><RadioGroup onValueChange={f.onChange} value={f.value} className="flex flex-wrap gap-4">{['Only me', 'Me and spouse', 'Me and family', 'Unsure'].map(o=><FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o}/></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage/></FormItem>)} /><FormField control={form.control} name="dentalCoverageEndDate" render={({ field:f }) => (<FormItem className="flex flex-col"><div className="flex items-center gap-1"><FormLabel>Last day of coverage?</FormLabel><Tooltip delayDuration={200}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs">This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect.</p></TooltipContent></Tooltip></div><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/></div>)}
                                    {q.id === 'hadVisionInsurance' && watchedFields.hadVisionInsurance === 'Yes' && (<div className="pl-6 space-y-4 pt-4"><FormField control={form.control} name="visionCoverage" render={({ field:f }) => (<FormItem><FormLabel>Who was covered?</FormLabel><FormControl><RadioGroup onValueChange={f.onChange} value={f.value} className="flex flex-wrap gap-4">{['Only me', 'Me and spouse', 'Me and family', 'Unsure'].map(o=><FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o}/></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage/></FormItem>)} /><FormField control={form.control} name="visionCoverageEndDate" render={({ field:f }) => (<FormItem className="flex flex-col"><div className="flex items-center gap-1"><FormLabel>Last day of coverage?</FormLabel><Tooltip delayDuration={200}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs">This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect.</p></TooltipContent></Tooltip></div><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/></div>)}
                                    {q.id === 'hadEAP' && watchedFields.hadEAP === 'Yes' && (<div className="pl-6 space-y-4 pt-4"><FormField control={form.control} name="eapCoverageEndDate" render={({ field:f }) => (<FormItem className="flex flex-col"><div className="flex items-center gap-1"><FormLabel>Last day of EAP coverage?</FormLabel><Tooltip delayDuration={200}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs">This date is pre-filled based on your final day of employment. Please verify and update if it's incorrect.</p></TooltipContent></Tooltip></div><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!f.value && "text-muted-foreground")}>{f.value?format(f.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/></div>)}
                                </FormItem>
                                )}
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
        </TooltipProvider>
    );
}
