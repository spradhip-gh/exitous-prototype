
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useUserData, ReviewQueueItem, GuidanceRule, MasterTask, buildQuestionTreeFromMap, Condition, Question, MasterTip, CompanyAssignment } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, GitBranch, ChevronsUpDown, Info, PlusCircle, Trash2, Pencil, CalendarCheck2, Clock, MessageSquareQuote, FilePenLine, CheckCircle, Circle, Archive, ListChecks, Lightbulb, Check, Ban } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function RejectDialog({ open, onOpenChange, onConfirm }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Provide Rejection Reason</DialogTitle>
                    <DialogDescription>Please provide a reason for rejecting this custom question. This will be shown to the HR Manager.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="rejection-reason" className="sr-only">Rejection Reason</Label>
                    <Textarea id="rejection-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., This question is too similar to an existing master question..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => onConfirm(reason)}>Confirm Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function GuidanceRulesTab() {
    const { guidanceRules, saveGuidanceRules, masterQuestions, masterProfileQuestions, masterTasks } = useUserData();
    const { toast } = useToast();
    
    const allQuestions = useMemo(() => {
        const profileQs = buildQuestionTreeFromMap(masterProfileQuestions);
        const assessmentQs = buildQuestionTreeFromMap(masterQuestions);
        return [...profileQs, ...assessmentQs];
    }, [masterProfileQuestions, masterQuestions]);
    
    const getConditionText = (condition: Condition) => {
        if (condition.type === 'question' && condition.questionId) {
            const q = allQuestions.find(q => q.id === condition.questionId) || masterQuestions[condition.questionId] || masterProfileQuestions[condition.questionId];
            return `If "${q?.label || condition.questionId}" is "${condition.answer}"`;
        }
        if (condition.type === 'tenure') {
            return `If tenure is ${condition.label}`;
        }
        if (condition.type === 'date_offset' && condition.dateQuestionId) {
            const q = allQuestions.find(q => q.id === condition.dateQuestionId);
            return `If "${q?.label}" is ${condition.operator === 'gt' ? '>' : '<'} ${condition.value} days from today`;
        }
        return 'Invalid condition';
    };

    const handleDeleteRule = (ruleId: string) => {
        const updatedRules = guidanceRules.filter(r => r.id !== ruleId);
        saveGuidanceRules(updatedRules);
        toast({ title: 'Rule Deleted' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Guidance Rules</CardTitle>
                    <CardDescription>Create and manage deterministic rules for assigning tasks.</CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">Rules are managed in the <span className="font-bold">Master Form Editor</span>.</p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rule Name</TableHead>
                            <TableHead>Conditions</TableHead>
                            <TableHead>Task Assigned</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guidanceRules.length > 0 ? guidanceRules.map(rule => (
                            <TableRow key={rule.id}>
                                <TableCell className="font-medium">{rule.name}</TableCell>
                                <TableCell>
                                    <ul className="list-disc pl-4 text-xs space-y-1">
                                        {rule.conditions.map((cond, i) => <li key={i}>{getConditionText(cond)}</li>)}
                                    </ul>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{masterTasks.find(t => t.id === rule.assignments?.taskIds?.[0])?.name || rule.assignments?.taskIds?.[0]}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to delete the rule "{rule.name}"? This action can only be done here.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteRule(rule.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No guidance rules have been created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function ReviewQueuePage() {
    const { toast } = useToast();
    const { auth } = useAuth();
    const { 
        reviewQueue, 
        saveReviewQueue,
        getAllCompanyConfigs,
        saveCompanyConfig,
        masterQuestions,
        masterProfileQuestions,
        masterTasks,
        masterTips,
        companyAssignments,
    } = useUserData();

    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [currentItemForRejection, setCurrentItemForRejection] = useState<ReviewQueueItem | null>(null);
    
    const companyMap = useMemo(() => {
        return new Map(companyAssignments.map(c => [c.companyId, c.companyName]));
    }, [companyAssignments]);

    const handleRejectClick = (item: ReviewQueueItem) => {
        setCurrentItemForRejection(item);
        setIsRejectDialogOpen(true);
    };

    const handleConfirmRejection = (reason: string) => {
        if (!currentItemForRejection) return;
        handleStatusChange(currentItemForRejection, 'rejected', reason);
        setIsRejectDialogOpen(false);
        setCurrentItemForRejection(null);
    };


    const handleStatusChange = (item: ReviewQueueItem, status: 'approved' | 'rejected' | 'reviewed', rejectionReason?: string) => {
        
        const reviewerId = auth?.email || 'admin';
        let reviewedItem: ReviewQueueItem = { ...item, status, reviewed_at: new Date().toISOString(), reviewer_id: reviewerId, rejection_reason: rejectionReason };
        
        const allConfigs = getAllCompanyConfigs();
        const companyName = companyMap.get(item.company_id);

        if (!companyName) {
            toast({ title: 'Error processing action', description: 'Company name is missing from the review item.', variant: 'destructive' });
            return;
        }

        const companyConfig = allConfigs[companyName];
        if (!companyConfig) {
             toast({ title: 'Error processing action', description: `Could not find configuration for company: ${companyName}.`, variant: 'destructive' });
             return;
        }
        
        const newConfig = JSON.parse(JSON.stringify(companyConfig));

        if (status === 'rejected' && item.type === 'custom_question_guidance') {
            const { question } = item.change_details || {};
            if (!question?.id) return;
            
            // Deactivate the custom question
            if (newConfig.customQuestions && newConfig.customQuestions[question.id]) {
                newConfig.customQuestions[question.id].isActive = false;
            }
            saveCompanyConfig(companyName, newConfig);
            toast({ title: `Custom Question Rejected`, description: `Question "${question.label}" has been deactivated for ${companyName}.` });
        
        } else if (status === 'approved' && item.type === 'question_edit_suggestion') {
            const { questionId, optionsToAdd, optionsToRemove } = item.change_details || {};
            if (!questionId) {
                 toast({ title: 'Error Applying Suggestion', description: 'The suggestion data is incomplete.', variant: 'destructive' });
                 return;
            }

            if (!newConfig.questions) newConfig.questions = {};

            const allMasterQs = { ...masterQuestions, ...masterProfileQuestions };
            const masterQuestion = allMasterQs[questionId];
            if (!masterQuestion) {
                 toast({ title: 'Error Applying Suggestion', description: `Could not find master question with ID: ${questionId}.`, variant: 'destructive' });
                 return;
            }
            
            if (!newConfig.questions[questionId]) {
                newConfig.questions[questionId] = {};
            }

            const currentOptions = newConfig.questions[questionId].options || masterQuestion.options || [];
            let newOptions = [...currentOptions];

            if (optionsToRemove && optionsToRemove.length > 0) {
                newOptions = newOptions.filter((opt: string) => !optionsToRemove.includes(opt));
            }
            if (optionsToAdd && optionsToAdd.length > 0) {
                 optionsToAdd.forEach((suggestion: { option: string }) => {
                    if (!newOptions.includes(suggestion.option)) {
                        newOptions.push(suggestion.option);
                    }
                });
            }

            newConfig.questions[questionId].options = newOptions;

            saveCompanyConfig(companyName, newConfig);
            toast({ title: `Suggestion Approved`, description: `Changes have been applied to ${companyName}'s form.` });
        } else {
            toast({ title: `Item marked as ${status}` });
        }
        
        const updatedQueue = reviewQueue.map(i =>
            i.id === item.id ? reviewedItem : i
        );
        saveReviewQueue(updatedQueue);
    };
    
    const pendingActionItems = reviewQueue.filter(item => item.status === 'pending');
    const reviewedItems = reviewQueue.filter(item => item.status !== 'pending').sort((a,b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime());

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                 <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Guidance &amp; Review</h1>
                    <p className="text-muted-foreground">
                       Review HR-submitted suggestions, audit AI recommendations, and create deterministic guidance rules.
                    </p>
                </div>
                 <Tabs defaultValue="review-queue">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="review-queue">Review Queue</TabsTrigger>
                        <TabsTrigger value="guidance-rules">Guidance Rules</TabsTrigger>
                    </TabsList>
                    <TabsContent value="review-queue" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Review</CardTitle>
                                <CardDescription>These items require your attention.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pendingActionItems.length > 0 ? pendingActionItems.map(item => (
                                     <ReviewItemCard 
                                        key={item.id}
                                        item={item}
                                        companyName={companyMap.get(item.company_id)}
                                        onStatusChange={handleStatusChange}
                                        onRejectClick={handleRejectClick}
                                        masterTasks={masterTasks}
                                        masterTips={masterTips}
                                     />
                                )) : (
                                    <p className="text-muted-foreground text-center py-8">The review queue is empty.</p>
                                )}
                            </CardContent>
                        </Card>
                         <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Reviewed Items</CardTitle>
                                <CardDescription>A log of previously reviewed recommendations and actions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User/Source</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviewedItems.map(item => {
                                            const getStatusBadge = () => {
                                                switch(item.status) {
                                                    case 'approved': return <Badge variant="default" className="bg-green-600">Approved</Badge>;
                                                    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
                                                    case 'reviewed': return <Badge variant="secondary">Reviewed</Badge>;
                                                    default: return <Badge variant="outline">{item.status}</Badge>;
                                                }
                                            }
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.user_email}</TableCell>
                                                    <TableCell>{companyMap.get(item.company_id) || 'N/A'}</TableCell>
                                                    <TableCell>{format(parseISO(item.created_at), 'PPP')}</TableCell>
                                                    <TableCell>
                                                        {getStatusBadge()}
                                                        {item.rejection_reason && (
                                                            <p className="text-xs text-muted-foreground mt-1 italic">Reason: "{item.rejection_reason}"</p>
                                                        )}
                                                        {item.change_details && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {item.change_details.optionsToAdd?.length > 0 && <div>+ Added: {item.change_details.optionsToAdd.map((o: any) => `"${o.option}"`).join(', ')}</div>}
                                                                {item.change_details.optionsToRemove?.length > 0 && <div>- Removed: {item.change_details.optionsToRemove.join(', ')}</div>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="guidance-rules" className="mt-6">
                        <GuidanceRulesTab />
                    </TabsContent>
                 </Tabs>
            </div>
             <RejectDialog 
                open={isRejectDialogOpen}
                onOpenChange={setIsRejectDialogOpen}
                onConfirm={handleConfirmRejection}
             />
        </div>
    );
}

function ReviewItemCard({ item, companyName, onStatusChange, onRejectClick, masterTasks, masterTips }: { 
    item: ReviewQueueItem,
    companyName?: string,
    onStatusChange: (item: ReviewQueueItem, status: 'approved' | 'rejected' | 'reviewed', reason?: string) => void, 
    onRejectClick: (item: ReviewQueueItem) => void, 
    masterTasks: MasterTask[], 
    masterTips: MasterTip[] 
}) {
    const [isInputOpen, setIsInputOpen] = useState(false);
    
    if (item.type === 'question_edit_suggestion') {
        const { questionLabel, optionsToAdd, optionsToRemove, reason } = item.change_details || {};

        return (
            <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                        <FilePenLine /> HR Suggested Question Edit
                     </CardTitle>
                    <CardDescription className="text-xs">
                        Suggested by: {item.user_email} | For Company: {companyName || 'N/A'} | Generated: {format(parseISO(item.created_at), 'Pp')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 border rounded-md bg-background">
                         <p className="text-sm text-muted-foreground">For Question:</p>
                         <p className="font-semibold text-base">"{questionLabel}"</p>
                    </div>
                     {reason && (
                        <div>
                            <p className="text-sm font-medium mb-1">Reason for change:</p>
                             <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground">"{reason}"</blockquote>
                        </div>
                     )}
                     {optionsToRemove?.length > 0 && (
                        <div>
                             <p className="text-sm font-medium mb-1">Suggested Removals:</p>
                             <div className="flex flex-wrap gap-2">
                                {optionsToRemove.map((opt: any, i: number) => <Badge key={i} variant="destructive">{opt}</Badge>)}
                             </div>
                        </div>
                     )}
                      {optionsToAdd?.length > 0 && (
                        <div>
                             <p className="text-sm font-medium mb-2">Suggested Additions:</p>
                             <div className="space-y-2">
                                {optionsToAdd.map((opt: any, i: number) => (
                                    <div key={i} className="p-2 border rounded-md bg-green-50 border-green-200">
                                        <p className="font-semibold text-green-800">{opt.option}</p>
                                        <blockquote className="mt-1 border-l-2 pl-3 border-green-300 italic text-green-700 text-xs flex items-start gap-2">
                                            <MessageSquareQuote className="h-4 w-4 mt-0.5 shrink-0"/>
                                            <span>{opt.guidance || 'No guidance suggested.'}</span>
                                        </blockquote>
                                    </div>
                                ))}
                             </div>
                        </div>
                     )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button size="sm" variant="destructive" onClick={() => onStatusChange(item, 'rejected')}><ThumbsDown className="mr-2"/> Reject</Button>
                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(item, 'approved')}><ThumbsUp className="mr-2"/> Approve</Button>
                </CardFooter>
            </Card>
        )
    }

    if (item.type === 'custom_question_guidance') {
        const { question, newSectionName } = item.change_details || {};
        if (!question) return null;

        return (
             <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                        <PlusCircle /> New Custom Question & Guidance
                     </CardTitle>
                    <CardDescription className="text-xs">
                        Submitted by: {item.user_email} | For Company: {companyName || 'N/A'} | Generated: {format(parseISO(item.created_at), 'Pp')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-md bg-background space-y-4">
                         <div>
                            <p className="text-sm font-semibold">"{question.label}"</p>
                            <p className="text-xs text-muted-foreground">{question.section} | Type: {question.type}</p>
                             {newSectionName && (
                                <p className="text-xs text-blue-600 font-medium mt-1">Added to new section: "{newSectionName}"</p>
                            )}
                        </div>
                        {question.options && question.options.length > 0 && (
                            <div>
                                <h4 className="font-medium text-sm mb-2">Answers & Guidance</h4>
                                <div className="space-y-3">
                                {question.options.filter(Boolean).map((option: string) => {
                                    const guidance = question.answerGuidance?.[option];
                                    if (!guidance) return null;
                                    const assignedTasks = guidance.tasks?.map((taskId: string) => masterTasks.find(t => t.id === taskId)?.name).filter(Boolean);
                                    const assignedTips = guidance.tips?.map((tipId: string) => masterTips.find(t => t.id === tipId)?.text).filter(Boolean);
                                    
                                    if ((assignedTasks?.length || 0) === 0 && (assignedTips?.length || 0) === 0 && !guidance.noGuidanceRequired) return null;

                                    return (
                                        <div key={option} className="p-3 border-l-4 rounded-r-md bg-muted/50">
                                            <p className="font-semibold text-sm">When answer is "{option}":</p>
                                            <div className="pl-4 mt-2 space-y-2">
                                                {assignedTasks && assignedTasks.length > 0 && (
                                                    <div>
                                                         <p className="text-xs font-semibold flex items-center gap-1.5"><ListChecks /> Assign Tasks:</p>
                                                         <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                                            {assignedTasks.map(name => <li key={name}>{name}</li>)}
                                                         </ul>
                                                    </div>
                                                )}
                                                 {assignedTips && assignedTips.length > 0 && (
                                                    <div>
                                                         <p className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb /> Show Tips:</p>
                                                         <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                                            {assignedTips.map(text => <li key={text}>{text}</li>)}
                                                         </ul>
                                                    </div>
                                                )}
                                                {guidance.noGuidanceRequired && <p className="text-xs text-muted-foreground italic">No guidance required.</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button size="sm" variant="destructive" onClick={() => onRejectClick(item)}><Ban className="mr-2"/> Reject</Button>
                    <Button size="sm" variant="secondary" onClick={() => onStatusChange(item, 'reviewed')}><Check className="mr-2"/> Mark as Reviewed</Button>
                </CardFooter>
            </Card>
        )
    }

    // Fallback for AI recommendations audit
    return (
        <Card className="bg-muted/50">
             <Collapsible open={isInputOpen} onOpenChange={setIsInputOpen}>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="text-base">AI Recommendation for: {item.user_email}</CardTitle>
                        <CardDescription className="text-xs">For Company: {item.input_data?.companyName || 'N/A'} | Generated: {format(parseISO(item.created_at), 'Pp')}</CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            View Input Data <ChevronsUpDown className="ml-2 h-4 w-4"/>
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <div className="px-6 pb-4">
                        <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto max-h-60">
                            {JSON.stringify(item.input_data, null, 2)}
                        </pre>
                    </div>
                </CollapsibleContent>
            </Collapsible>
            <CardContent className="space-y-2">
                {item.output_data?.recommendations?.map((rec: any, index: number) => (
                    <div key={index} className="p-3 border rounded-md bg-background">
                        <div className="flex justify-between items-center">
                             <p className="font-semibold">{rec.task}</p>
                             <Badge variant="secondary">{rec.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.timeline} {rec.endDate && `(Due: ${rec.endDate})`}</p>
                        <p className="text-sm mt-1">{rec.details}</p>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button size="sm" variant="secondary" onClick={() => onStatusChange(item, 'reviewed')}><Archive className="mr-2"/> Mark as Reviewed</Button>
            </CardFooter>
        </Card>
    )
}
