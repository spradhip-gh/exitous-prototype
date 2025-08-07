

'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useUserData, ReviewQueueItem, GuidanceRule, MasterTask, buildQuestionTreeFromMap, Condition, Question, MasterTip } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, GitBranch, ChevronsUpDown, Info, PlusCircle, Trash2, Pencil, CalendarCheck2, Clock, MessageSquareQuote, FilePenLine, CheckCircle, Circle, Archive, ListChecks, Lightbulb, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';


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
                                    <Badge variant="outline">{masterTasks.find(t => t.id === rule.taskId)?.name || rule.taskId}</Badge>
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
    } = useUserData();

    const handleStatusChange = (item: ReviewQueueItem, status: 'approved' | 'rejected' | 'reviewed') => {
        
        const reviewerId = auth?.email || 'admin';
        let reviewedItem: ReviewQueueItem = { ...item, status, reviewedAt: new Date().toISOString(), reviewerId };
        
        const allConfigs = getAllCompanyConfigs();
        const companyName = item.inputData?.companyName;

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

        if (status === 'rejected' && item.inputData?.type === 'custom_question_guidance') {
            const { question } = item.inputData;
            if (!question?.id) return;
            
            // Remove the custom question from the company's config
            if (newConfig.customQuestions && newConfig.customQuestions[question.id]) {
                delete newConfig.customQuestions[question.id];
            }
            saveCompanyConfig(companyName, newConfig);
            toast({ title: `Custom Question Rejected`, description: `Question "${question.label}" has been removed from ${companyName}'s form.` });
            reviewedItem = { ...reviewedItem, changeDetails: { rejectedQuestion: question } };

        } else if (status === 'approved' && item.inputData?.type === 'question_edit_suggestion') {
            const { questionId, suggestions } = item.inputData;
            if (!questionId || !suggestions) {
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

            if (suggestions.optionsToRemove && suggestions.optionsToRemove.length > 0) {
                newOptions = newOptions.filter((opt: string) => !suggestions.optionsToRemove.includes(opt));
            }
            if (suggestions.optionsToAdd && suggestions.optionsToAdd.length > 0) {
                 suggestions.optionsToAdd.forEach((suggestion: { option: string }) => {
                    if (!newOptions.includes(suggestion.option)) {
                        newOptions.push(suggestion.option);
                    }
                });
            }

            newConfig.questions[questionId].options = newOptions;

            saveCompanyConfig(companyName, newConfig);
            toast({ title: `Suggestion Approved`, description: `Changes have been applied to ${companyName}'s form.` });
            
            reviewedItem = { ...reviewedItem, changeDetails: suggestions };

        } else {
            toast({ title: `Item marked as ${status}` });
        }
        
        const updatedQueue = reviewQueue.map(i =>
            i.id === item.id ? reviewedItem : i
        );
        saveReviewQueue(updatedQueue);
    };
    
    const pendingActionItems = reviewQueue.filter(item => item.status === 'pending');
    const reviewedItems = reviewQueue.filter(item => item.status !== 'pending').sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());

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
                                        onStatusChange={handleStatusChange}
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
                                                    <TableCell>{item.userEmail}</TableCell>
                                                    <TableCell>{item.inputData.companyName || 'N/A'}</TableCell>
                                                    <TableCell>{format(parseISO(item.createdAt), 'PPP')}</TableCell>
                                                    <TableCell>
                                                        {getStatusBadge()}
                                                        {item.changeDetails && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {item.changeDetails.optionsToAdd?.length > 0 && <div>+ Added: {item.changeDetails.optionsToAdd.map((o: any) => `"${o.option}"`).join(', ')}</div>}
                                                                {item.changeDetails.optionsToRemove?.length > 0 && <div>- Removed: {item.changeDetails.optionsToRemove.join(', ')}</div>}
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
        </div>
    );
}

function ReviewItemCard({ item, onStatusChange, masterTasks, masterTips }: { item: ReviewQueueItem, onStatusChange: (item: ReviewQueueItem, status: 'approved' | 'rejected' | 'reviewed') => void, masterTasks: MasterTask[], masterTips: MasterTip[] }) {
    const [isInputOpen, setIsInputOpen] = useState(false);
    const isSuggestion = item.inputData?.type === 'question_edit_suggestion';
    const isCustomQuestion = item.inputData?.type === 'custom_question_guidance';

    if (isSuggestion) {
        const { companyName, questionLabel, suggestions } = item.inputData;
        const { optionsToAdd, optionsToRemove, reason } = suggestions || {};

        return (
            <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                        <FilePenLine /> HR Suggested Question Edit
                     </CardTitle>
                    <CardDescription className="text-xs">
                        Suggested by: {item.userEmail} | For Company: {companyName || 'N/A'} | Generated: {format(parseISO(item.createdAt), 'Pp')}
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

    if (isCustomQuestion) {
        const { companyName, question, newSectionName } = item.inputData as { companyName: string, question: Question, newSectionName?: string };
        return (
             <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                        <PlusCircle /> New Custom Question & Guidance
                     </CardTitle>
                    <CardDescription className="text-xs">
                        Submitted by: {item.userEmail} | For Company: {companyName || 'N/A'} | Generated: {format(parseISO(item.createdAt), 'Pp')}
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
                                {question.options.filter(Boolean).map(option => {
                                    const guidance = question.answerGuidance?.[option];
                                    if (!guidance) return null;
                                    const assignedTasks = guidance.tasks?.map(taskId => masterTasks.find(t => t.id === taskId)?.name).filter(Boolean);
                                    const assignedTips = guidance.tips?.map(tipId => masterTips.find(t => t.id === tipId)?.text).filter(Boolean);
                                    
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
                    <Button size="sm" variant="destructive" onClick={() => onStatusChange(item, 'rejected')}><ThumbsDown className="mr-2"/> Reject</Button>
                    <Button size="sm" variant="secondary" onClick={() => onStatusChange(item, 'reviewed')}><Check className="mr-2"/> Mark as Reviewed</Button>
                </CardFooter>
            </Card>
        )
    }

    // Default rendering for AI recommendations for audit
    return (
        <Card className="bg-muted/50">
             <Collapsible open={isInputOpen} onOpenChange={setIsInputOpen}>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="text-base">AI Recommendation for: {item.userEmail}</CardTitle>
                        <CardDescription className="text-xs">For Company: {item.inputData.companyName || 'N/A'} | Generated: {format(parseISO(item.createdAt), 'Pp')}</CardDescription>
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
                            {JSON.stringify(item.inputData, null, 2)}
                        </pre>
                    </div>
                </CollapsibleContent>
            </Collapsible>
            <CardContent className="space-y-2">
                {item.output?.recommendations?.map((rec, index) => (
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
