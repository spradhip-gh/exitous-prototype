

'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useUserData, ReviewQueueItem, GuidanceRule, MasterTask, buildQuestionTreeFromMap } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, GitBranch, ChevronsUpDown, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import GuidanceRuleForm from '@/components/admin/GuidanceRuleForm';


export default function ReviewQueuePage() {
    const { toast } = useToast();
    const { 
        reviewQueue, 
        saveReviewQueue,
        masterQuestions,
        masterProfileQuestions,
        masterTasks,
    } = useUserData();

    const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
    const [ruleToConvert, setRuleToConvert] = useState<{
        guidanceText: string,
        category: string,
        inputData: ReviewQueueItem['inputData']
    } | null>(null);

    const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
        const updatedQueue = reviewQueue.map(item =>
            item.id === id ? { ...item, status } : item
        );
        saveReviewQueue(updatedQueue);
        toast({ title: `Recommendation ${status}` });
    };
    
    const handleCreateRule = (item: ReviewQueueItem, recommendation: ReviewQueueItem['output']['recommendations'][0]) => {
        setRuleToConvert({
            guidanceText: recommendation.details,
            category: recommendation.category,
            inputData: item.inputData,
        });
        setIsRuleFormOpen(true);
    };

    const handleSaveRule = (rule: GuidanceRule) => {
        // In a real app, this would save to a `guidanceRules` table.
        // For now, we'll just log it and show a success message.
        console.log("Saving new rule:", rule);
        toast({ title: "Guidance Rule Saved", description: `Rule "${rule.name}" has been created.` });
        setIsRuleFormOpen(false);
    };
    
    const allQuestions = useMemo(() => {
        const profileQs = buildQuestionTreeFromMap(masterProfileQuestions);
        const assessmentQs = buildQuestionTreeFromMap(masterQuestions);
        return [...profileQs, ...assessmentQs];
    }, [masterProfileQuestions, masterQuestions]);

    const pendingReviewItems = reviewQueue.filter(item => item.status === 'pending');
    const reviewedItems = reviewQueue.filter(item => item.status !== 'pending');

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                 <div className="space-y-2">
                    <h1 className="font-headline text-3xl font-bold">Guidance & Review</h1>
                    <p className="text-muted-foreground">
                       Review AI-generated recommendations and create deterministic guidance rules.
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
                                <CardTitle>Pending AI Recommendations</CardTitle>
                                <CardDescription>Review the AI's output based on sample user data. Approve, reject, or convert to a rule.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pendingReviewItems.length > 0 ? pendingReviewItems.map(item => (
                                     <ReviewItemCard 
                                        key={item.id}
                                        item={item}
                                        onStatusChange={handleStatusChange}
                                        onCreateRule={handleCreateRule}
                                     />
                                )) : (
                                    <p className="text-muted-foreground text-center py-8">The review queue is empty.</p>
                                )}
                            </CardContent>
                        </Card>
                         <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Reviewed Items</CardTitle>
                                <CardDescription>A log of previously reviewed recommendations.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviewedItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.userEmail}</TableCell>
                                                <TableCell>{item.inputData.companyName || 'N/A'}</TableCell>
                                                <TableCell>{format(parseISO(item.createdAt), 'PPP')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.status === 'approved' ? 'default' : 'destructive'} className={item.status === 'approved' ? 'bg-green-600' : ''}>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="guidance-rules" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Guidance Rules</CardTitle>
                                <CardDescription>This is where you would manage deterministic rules.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Under Construction</AlertTitle>
                                    <AlertDescription>
                                        The full guidance rule editor is still being built. You can create rules from the review queue.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>
                 </Tabs>
            </div>
            <GuidanceRuleForm 
                isOpen={isRuleFormOpen}
                onOpenChange={setIsRuleFormOpen}
                ruleToConvert={ruleToConvert}
                onSave={handleSaveRule}
                questions={allQuestions}
                masterTasks={masterTasks}
            />
        </div>
    );
}

function ReviewItemCard({ item, onStatusChange, onCreateRule }: { item: ReviewQueueItem, onStatusChange: (id: string, status: 'approved' | 'rejected') => void, onCreateRule: (item: ReviewQueueItem, recommendation: ReviewQueueItem['output']['recommendations'][0]) => void }) {
    const [isInputOpen, setIsInputOpen] = useState(false);

    return (
        <Card className="bg-muted/50">
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-base">{item.userEmail}</CardTitle>
                    <CardDescription className="text-xs">For Company: {item.inputData.companyName || 'N/A'} | Generated: {format(parseISO(item.createdAt), 'Pp')}</CardDescription>
                </div>
                 <Collapsible open={isInputOpen} onOpenChange={setIsInputOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            View Input Data <ChevronsUpDown className="ml-2 h-4 w-4"/>
                        </Button>
                    </CollapsibleTrigger>
                </Collapsible>
            </CardHeader>
            <CollapsibleContent>
                <div className="px-6 pb-4">
                    <pre className="text-xs bg-background p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(item.inputData, null, 2)}
                    </pre>
                </div>
            </CollapsibleContent>
            <CardContent className="space-y-2">
                {item.output.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-md bg-background">
                        <div className="flex justify-between items-center">
                             <p className="font-semibold">{rec.task}</p>
                             <Badge variant="secondary">{rec.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.timeline} {rec.endDate && `(Due: ${rec.endDate})`}</p>
                        <p className="text-sm mt-1">{rec.details}</p>
                        <div className="flex gap-2 justify-end mt-2">
                            <Button size="sm" variant="outline" onClick={() => onCreateRule(item, rec)}>
                                <GitBranch className="mr-2"/> Create Rule
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button size="sm" variant="destructive" onClick={() => onStatusChange(item.id, 'rejected')}>
                    <ThumbsDown className="mr-2"/> Reject
                </Button>
                 <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(item.id, 'approved')}>
                    <ThumbsUp className="mr-2"/> Approve
                </Button>
            </CardFooter>
        </Card>
    )
}
