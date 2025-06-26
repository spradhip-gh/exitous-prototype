'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { assessmentSchema, type AssessmentData } from '@/lib/schemas';
import { useUserData } from '@/hooks/use-user-data';
import { usStates } from '@/lib/states';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

const workStatuses = [
    'Contract employee: Employed for a predefined period to provide work according to contract terms',
    'Full-time employee: Employed for 40 hours or more per week with salary and benefits',
    'Independent contractor: Non-employee providing labor according to contract terms',
    'Intern or apprentice: Temporary employee providing labor for educational benefit',
    'Part-time employee: Employed at hourly wage for fewer than 40 hours per week',
    'Other'
];

const workArrangements = ['Onsite', 'Hybrid', 'Remote', 'Other'];

const workVisas = [
    'H-1B', 'H-2A / H-2B', 'H-3', 'I', 'L-1A / L-1B', 'O visa', 'P', 'R', 'TN (NAFTA/USMCA)',
    'E-2 (corporate transfer as either an manager/executive or essential worker)',
    'F-1 or M-1 Students', 'E-2S/L2S/H4 EAD', 'J student / exchange visitor visa',
    'E-3 Visa (Australians only) /H1b1 Visa (Chile or Singapore only)',
    'None of the above', 'Other visa', 'Unsure'
];

const leaveTypes = [
    { id: 'maternity_paternity', label: 'Maternity/paternity leave' },
    { id: 'caregiver', label: 'Caregiver leave' },
    { id: 'fmla', label: 'FMLA' },
    { id: 'sick_health_medical', label: 'Sick / health / medical leave' },
    { id: 'disability', label: 'Short- / long-term disability leave' },
    { id: 'bereavement', label: 'Bereavement leave' },
    { id: 'sabbatical', label: 'Sabbatical leave' },
    { id: 'witness', label: 'Witness leave' },
    { id: 'jury_duty', label: 'Jury duty leave' },
    { id: 'military', label: 'Military leave' },
    { id: 'other', label: 'Other leave' },
    { id: 'none', label: 'None of the above' },
];

const accessSystems = [
    { id: 'messaging', label: 'Internal messaging system (e.g., Slack, Google Chat, Teams)' },
    { id: 'email', label: 'Email' },
    { id: 'network', label: 'Network drive & files' },
    { id: 'portal', label: 'Special layoff portal' },
    { id: 'hr_payroll', label: 'HR/Payroll system (e.g., ADP, Workday)' },
];

const insuranceCoverageOptions = ['Only me', 'Me and spouse', 'Me and family', 'Unsure'];

export default function AssessmentForm() {
    const router = useRouter();
    const { saveAssessmentData, assessmentData } = useUserData();
    const { toast } = useToast();
    
    const form = useForm<AssessmentData>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: {
            workStatus: '',
            workState: '',
            relocationPaid: '',
            unionMember: '',
            workArrangement: '',
            workVisa: '',
            onLeave: [],
            accessSystems: [],
            hadMedicalInsurance: '',
            hadDentalInsurance: '',
            hadVisionInsurance: '',
            hadEAP: '',
        },
    });

    useEffect(() => {
        if (assessmentData) {
            form.reset(assessmentData);
        }
    }, [assessmentData, form]);

    const watchedFields = form.watch([
        'relocationPaid',
        'workArrangement',
        'onLeave',
        'accessSystems',
        'hadMedicalInsurance',
        'hadDentalInsurance',
        'hadVisionInsurance',
        'hadEAP',
    ]);
    const [
        watchedRelocationPaid,
        watchedWorkArrangement,
        watchedOnLeave,
        watchedAccessSystems,
        watchedHadMedical,
        watchedHadDental,
        watchedHadVision,
        watchedHadEAP,
    ] = watchedFields;

    function onSubmit(data: AssessmentData) {
        saveAssessmentData(data);
        router.push('/');
    }

    const onInvalid = () => {
        toast({
            title: "Incomplete Assessment",
            description: "Please review the form and fill out all required fields.",
            variant: "destructive",
        });
    };
    
    const companyName = "your previous company";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Work & Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="workStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Which best describes your work status?</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                                    <SelectContent>{workStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="startDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>What day did you begin work at {companyName} as a {form.getValues('workStatus')?.split(':')[0] || 'employee'}?</FormLabel>
                                <Popover><PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="notificationDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>On what date were you notified you were being laid off?</FormLabel>
                                <Popover><PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="finalDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>What is your final date of employment (termination or severance date)?</FormLabel>
                                <Popover><PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent></Popover>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="workState" render={({ field }) => (
                            <FormItem>
                                <FormLabel>What state was your work based in?</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger></FormControl>
                                    <SelectContent>{usStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Work Circumstances</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="relocationPaid" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Did {companyName} pay for you to relocate to your current residence?</FormLabel>
                                <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem>
                                </RadioGroup></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        {watchedRelocationPaid === 'Yes' && (
                             <FormField control={form.control} name="relocationDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date of your relocation</FormLabel>
                                    <Popover><PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent></Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        <FormField control={form.control} name="unionMember" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Did you belong to a union at the time of the layoff?</FormLabel>
                                <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem>
                                </RadioGroup></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="workArrangement" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Which best describes your work arrangement at the time of the layoff?</FormLabel>
                                <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                                    {workArrangements.map(wa => <FormItem key={wa} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={wa} /></FormControl><FormLabel className="font-normal">{wa}</FormLabel></FormItem>)}
                                </RadioGroup></FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />
                         {watchedWorkArrangement === 'Other' && (
                             <FormField control={form.control} name="workArrangementOther" render={({ field }) => (
                                <FormItem><FormLabel className="sr-only">Other work arrangement</FormLabel><FormControl><Input placeholder="Please specify" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                         )}

                         <FormField control={form.control} name="workVisa" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Were you on any of these work visas at the time of the layoff?</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a visa status" /></SelectTrigger></FormControl>
                                    <SelectContent>{workVisas.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="onLeave" render={() => (
                            <FormItem>
                                <FormLabel>Are you currently on any of the following types of leave?</FormLabel>
                                <CardDescription>Select all that apply.</CardDescription>
                                {leaveTypes.map((item) => (
                                <FormField key={item.id} control={form.control} name="onLeave" render={({ field }) => {
                                    return (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl><Checkbox checked={field.value?.includes(item.label)} onCheckedChange={(checked) => {
                                            return checked ? field.onChange([...field.value, item.label]) : field.onChange(field.value?.filter((value) => value !== item.label));
                                        }} /></FormControl>
                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                    </FormItem>);
                                }} />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )} />
                        {watchedOnLeave && watchedOnLeave.length > 0 && !watchedOnLeave.includes('None of the above') && (
                            <FormField control={form.control} name="usedLeaveManagement" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Were you utilizing leave management (e.g., Tilt, Cocoon)?</FormLabel>
                                    <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem>
                                    </RadioGroup></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Systems &amp; Benefits Access</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="accessSystems" render={() => (
                            <FormItem>
                                <FormLabel>Which of the following internal work systems do you still have access to as of today at {companyName}?</FormLabel>
                                {accessSystems.map((item) => (
                                    <FormField key={item.id} control={form.control} name="accessSystems" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                return checked ? field.onChange([...field.value, item.id]) : field.onChange(field.value?.filter((value) => value !== item.id));
                                            }} /></FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )} />

                        {watchedAccessSystems?.includes('messaging') && <FormField control={form.control} name="internalMessagingAccessEndDate" render={({ field }) => (<FormItem className="flex flex-col pl-6"><FormLabel>Messaging Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                        {watchedAccessSystems?.includes('email') && <FormField control={form.control} name="emailAccessEndDate" render={({ field }) => (<FormItem className="flex flex-col pl-6"><FormLabel>Email Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                        {watchedAccessSystems?.includes('network') && <FormField control={form.control} name="networkDriveAccessEndDate" render={({ field }) => (<FormItem className="flex flex-col pl-6"><FormLabel>Network Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                        {watchedAccessSystems?.includes('portal') && <FormField control={form.control} name="layoffPortalAccessEndDate" render={({ field }) => (<FormItem className="flex flex-col pl-6"><FormLabel>Portal Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                        {watchedAccessSystems?.includes('hr_payroll') && <FormField control={form.control} name="hrPayrollSystemAccessEndDate" render={({ field }) => (<FormItem className="flex flex-col pl-6"><FormLabel>HR/Payroll Access Ends</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>}
                        
                        <Separator />
                        
                        <FormField control={form.control} name="hadMedicalInsurance" render={({ field }) => ( <FormItem><FormLabel>Did you have medical insurance through {companyName}?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                        {watchedHadMedical === 'Yes' && (<div className="pl-6 space-y-4">
                            <FormField control={form.control} name="medicalCoverage" render={({ field }) => (<FormItem><FormLabel>Who was covered?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">{insuranceCoverageOptions.map(o=><FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o}/></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage/></FormItem>)} />
                            <FormField control={form.control} name="medicalCoverageEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Last day of coverage?</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>
                        </div>)}
                        
                        <Separator />
                        
                        <FormField control={form.control} name="hadDentalInsurance" render={({ field }) => ( <FormItem><FormLabel>Did you have dental insurance through {companyName}?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                        {watchedHadDental === 'Yes' && (<div className="pl-6 space-y-4">
                            <FormField control={form.control} name="dentalCoverage" render={({ field }) => (<FormItem><FormLabel>Who was covered?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">{insuranceCoverageOptions.map(o=><FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o}/></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage/></FormItem>)} />
                            <FormField control={form.control} name="dentalCoverageEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Last day of coverage?</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>
                        </div>)}
                        
                        <Separator />

                        <FormField control={form.control} name="hadVisionInsurance" render={({ field }) => ( <FormItem><FormLabel>Did you have vision insurance through {companyName}?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                        {watchedHadVision === 'Yes' && (<div className="pl-6 space-y-4">
                            <FormField control={form.control} name="visionCoverage" render={({ field }) => (<FormItem><FormLabel>Who was covered?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">{insuranceCoverageOptions.map(o=><FormItem key={o} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={o}/></FormControl><FormLabel className="font-normal">{o}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage/></FormItem>)} />
                            <FormField control={form.control} name="visionCoverageEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Last day of coverage?</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>
                        </div>)}

                        <Separator />

                        <FormField control={form.control} name="hadEAP" render={({ field }) => ( <FormItem><FormLabel>Did you have access to the Employee Assistance Program (EAP) through {companyName}?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                        {watchedHadEAP === 'Yes' && (<div className="pl-6 space-y-4">
                            <FormField control={form.control} name="eapCoverageEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Last day of EAP coverage?</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value?format(field.value, "PPP"):<span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>
                        </div>)}

                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'See My Timeline'}
                </Button>
            </form>
        </Form>
    );
}
