

'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserData, ReviewQueueItem, RecommendationItem, GuidanceRule, Condition, Question, MasterTask } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Check, X, Wand2, PlusCircle, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import GuidanceRuleForm from "@/components/admin/GuidanceRuleForm";

export default function ReviewQueuePage() {
    const { 
        reviewQueue, 
        saveReviewQueue, 
        saveCompanyConfig, 
        getAllCompanyConfigs,
        masterQuestions, 
        masterProfileQuestions,
        masterTasks,
        isLoading 
    } = useUserData();
    
    const { toast } = useToast();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [ruleToConvert, setRuleToConvert] = useState<{
        guidanceText: string;
        category: string;
        inputData: ReviewQueueItem['inputData'];
    } | null>(null);

    const allQuestions = useMemo(() => {
        const flatList: Question[] = [];
        const process = (qMap: Record<string, Question>) => {
            Object.values(qMap).forEach(q => flatList.push(q));
        };
        process(masterQuestions);
        process(masterProfileQuestions);
        return flatList;
    }, [masterQuestions, masterProfileQuestions]);
    
    const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
        const updatedQueue = reviewQueue.map(item => item.id === id ? { ...item, status } : item);
        saveReviewQueue(updatedQueue);
        toast({ title: `Recommendations ${status}` });
    };

    const handleConvertToRule = (recommendation: RecommendationItem, inputData: ReviewQueueItem['inputData']) => {
        setRuleToConvert({
            guidanceText: recommendation.details,
            category: recommendation.category,
            inputData,
        });
        setIsFormOpen(true);
    };

    const handleSaveRule = useCallback((rule: GuidanceRule) => {
        const allConfigs = getAllCompanyConfigs();
        const firstCompanyKey = Object.keys(allConfigs)[0];
        if (!firstCompanyKey) return;

        const config = allConfigs[firstCompanyKey];
        const existingRules = config.guidance || [];
        const ruleIndex = existingRules.findIndex(r => r.id === rule.id);

        let updatedRules;
        if (ruleIndex > -1) {
            updatedRules = [...existingRules];
            updatedRules[ruleIndex] = rule;
        } else {
            updatedRules = [...existingRules, rule];
        }
        
        saveCompanyConfig(firstCompanyKey, { ...config, guidance: updatedRules });
        setIsFormOpen(false);
        setRuleToConvert(null);
        toast({ title: "Guidance Rule Saved", description: "The new rule can now be applied to future users." });
    }, [getAllCompanyConfigs, saveCompanyConfig, toast]);

    return (
        <div className="p-4 md:p-8">
            <div className="space-y-2 mb-8">
                <h1 className="font-headline text-3xl font-bold">AI Recommendation Review Queue</h1>
                <p className="text-muted-foreground">
                    Review AI-generated recommendations from completed user assessments. Approve, reject, or convert them into reusable guidance rules.
                </p>
            </div>

            <div className="space-y-4">
                {reviewQueue.length === 0 && !isLoading && (
                    <Card className="text-center py-12">
                         <CardContent className="flex flex-col items-center gap-4">
                            <Wand2 className="h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">The queue is empty.</h3>
                            <p className="text-muted-foreground">As users complete their assessments, their AI-generated recommendations will appear here for review.</p>
                         </CardContent>
                    </Card>
                )}

                {reviewQueue.map(item => (
                    <Card key={item.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Review for: {item.userEmail}</CardTitle>
                                    <CardDescription>
                                        Generated {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Badge variant={
                                        item.status === 'approved' ? 'default' :
                                        item.status === 'rejected' ? 'destructive' :
                                        'secondary'
                                    } className={item.status === 'approved' ? 'bg-green-600' : ''}>
                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </Badge>
                                    {item.status === 'pending' && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(item.id, 'rejected')}><X className="h-4 w-4 text-destructive" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(item.id, 'approved')}><Check className="h-4 w-4 text-green-600" /></Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible>
                                <AccordionItem value="recommendations">
                                    <AccordionTrigger>View {item.output.recommendations.length} AI Recommendations</AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <ul className="space-y-4">
                                            {item.output.recommendations.map(rec => (
                                                <li key={rec.taskId} className="p-3 rounded-md border bg-muted/50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">{rec.task}</p>
                                                            <p className="text-sm text-muted-foreground">{rec.details}</p>
                                                            <Badge variant="outline" className="mt-2">{rec.category}</Badge>
                                                        </div>
                                                        <Button size="sm" variant="outline" onClick={() => handleConvertToRule(rec, item.inputData)}>
                                                            <PlusCircle className="mr-2" /> Create Rule
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="input">
                                    <AccordionTrigger>View Input Data</AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <div>
                                                <h4 className="font-semibold mb-2">Profile Data</h4>
                                                <pre className="p-2 bg-background rounded-md text-xs overflow-auto">
                                                    {JSON.stringify(item.inputData.profileData, null, 2)}
                                                </pre>
                                            </div>
                                             <div>
                                                <h4 className="font-semibold mb-2">Assessment Data</h4>
                                                <pre className="p-2 bg-background rounded-md text-xs overflow-auto">
                                                    {JSON.stringify(item.inputData.layoffDetails, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <GuidanceRuleForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSaveRule}
                ruleToConvert={ruleToConvert}
                questions={allQuestions}
                masterTasks={masterTasks}
            />

        </div>
    );
}
