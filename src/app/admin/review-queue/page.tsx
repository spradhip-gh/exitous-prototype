
'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserData, ReviewQueueItem, RecommendationItem, GuidanceRule, Condition, Question, MasterTask } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Check, X, Wand2, PlusCircle, ArrowRight, Search, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import GuidanceRuleForm from "@/components/admin/GuidanceRuleForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { tenureOptions } from "@/lib/guidance-helpers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function GuidanceRulesEditor() {
    const { 
        masterQuestions, 
        masterProfileQuestions, 
        getAllCompanyConfigs, 
        saveCompanyConfig, 
        masterTasks,
    } = useUserData();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<GuidanceRule> | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

     const allQuestions = useMemo(() => {
        const flatList: Question[] = [];
        const process = (qMap: Record<string, Question>) => {
            Object.values(qMap).forEach(q => flatList.push(q));
        };
        process(masterQuestions);
        process(masterProfileQuestions);
        return flatList;
    }, [masterQuestions, masterProfileQuestions]);

    const allGuidanceRules = useMemo(() => {
      const firstCompanyKey = Object.keys(getAllCompanyConfigs())[0];
      return firstCompanyKey ? getAllCompanyConfigs()[firstCompanyKey].guidance || [] : [];
    }, [getAllCompanyConfigs]);

    const ruleCategories = useMemo(() => {
      const taskCategoryMap = new Map(masterTasks.map(t => [t.id, t.category]));
      return [...new Set(allGuidanceRules.map(r => taskCategoryMap.get(r.taskId) || 'General'))]
    }, [allGuidanceRules, masterTasks]);

     const filteredRules = useMemo(() => {
        const taskCategoryMap = new Map(masterTasks.map(t => [t.id, t.category]));
        return allGuidanceRules.filter(rule => {
            const category = taskCategoryMap.get(rule.taskId) || 'General';
            const matchesCategory = activeCategory ? category === activeCategory : true;
            const matchesSearch = searchTerm ? rule.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            return matchesCategory && matchesSearch;
        });
    }, [allGuidanceRules, activeCategory, searchTerm, masterTasks]);

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
        setEditingRule(null);
    }, [getAllCompanyConfigs, saveCompanyConfig]);

    const handleDeleteRule = (ruleId: string) => {
        const allConfigs = getAllCompanyConfigs();
        const firstCompanyKey = Object.keys(allConfigs)[0];
        if (!firstCompanyKey) return;
        
        const config = allConfigs[firstCompanyKey];
        const updatedRules = (config.guidance || []).filter(r => r.id !== ruleId);
        saveCompanyConfig(firstCompanyKey, { ...config, guidance: updatedRules });
    };

    const handleEditClick = (rule: GuidanceRule) => {
        setEditingRule(rule);
        setIsFormOpen(true);
    };
    
    const handleAddClick = () => {
        setEditingRule(null);
        setIsFormOpen(true);
    }
    
    const getTaskForRule = (rule: GuidanceRule) => masterTasks.find(t => t.id === rule.taskId);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Guidance Rules</CardTitle>
                            <CardDescription>These rules will automatically assign tasks to users when conditions are met.</CardDescription>
                        </div>
                        <Button onClick={handleAddClick}><PlusCircle className="mr-2" /> Add Rule</Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search by rule name..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button variant={!activeCategory ? 'default' : 'outline'} onClick={() => setActiveCategory(null)}>All</Button>
                            {ruleCategories.map(cat => (
                                <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} onClick={() => setActiveCategory(cat)}>
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredRules.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Wand2 className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">No Guidance Rules Found</h3>
                                <p className="mt-1 text-sm">No rules match your current filters. Try adjusting your search or filter.</p>
                            </div>
                        )}
                        {filteredRules.map(rule => {
                            const task = getTaskForRule(rule);
                            return (
                                <Card key={rule.id} className="bg-muted/50">
                                    <CardHeader className="flex flex-row justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{rule.name}</CardTitle>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {rule.conditions.map((c, i) => {
                                                    if (c.type === 'question') {
                                                        const q = allQuestions.find(q => q.id === c.questionId);
                                                        return <Badge key={i} variant="secondary">IF {q?.label.substring(0, 20)}... is "{c.answer}"</Badge>
                                                    }
                                                    if (c.type === 'tenure') {
                                                        return <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">IF Tenure is {c.label}</Badge>
                                                    }
                                                    if (c.type === 'date_offset') {
                                                        const q = allQuestions.find(q => q.id === c.dateQuestionId);
                                                        const operator = c.operator === 'gt' ? '>' : '<';
                                                        return <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">IF {q?.label} is {operator} {c.value} days away</Badge>
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(rule)}>
                                                <span className="sr-only">Edit Rule</span>
                                                <PlusCircle className="h-4 w-4"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                                                <span className="sr-only">Delete Rule</span>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {task ? (
                                            <div className="text-sm border-l-2 border-primary pl-3 py-1 bg-background rounded-r-md">
                                                <p><span className="font-semibold text-muted-foreground">Task:</span> {task.name}</p>
                                                <p className="text-xs text-muted-foreground">{task.detail}</p>
                                            </div>
                                        ) : (
                                            <div className="text-sm border-l-2 border-destructive pl-3 py-1 bg-background rounded-r-md">
                                                <p className="text-destructive">Invalid Task ID: {rule.taskId}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
            <GuidanceRuleForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                ruleToConvert={editingRule}
                onSave={handleSaveRule}
                questions={allQuestions}
                masterTasks={masterTasks}
            />
        </>
    )
}

function ReviewQueue() {
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
    const [ruleToConvert, setRuleToConvert] = useState<Partial<GuidanceRule> | null>(null);

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
            id: `rule-${Date.now()}`,
            name: `Rule for: ${recommendation.category} need`,
            conditions: [],
            taskId: recommendation.taskId || '',
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


    if (reviewQueue.length === 0 && !isLoading) {
        return (
            <Card className="text-center py-12">
                 <CardContent className="flex flex-col items-center gap-4">
                    <Wand2 className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">The queue is empty.</h3>
                    <p className="text-muted-foreground">As users complete their assessments, their AI-generated recommendations will appear here for review.</p>
                 </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-4">
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
            
            <GuidanceRuleForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                ruleToConvert={ruleToConvert}
                onSave={handleSaveRule}
                questions={allQuestions}
                masterTasks={masterTasks}
            />
        </div>
    );
}


export default function GuidancePage() {
    return (
        <div className="p-4 md:p-8">
            <div className="space-y-2 mb-8">
                <h1 className="font-headline text-3xl font-bold">Guidance & Review</h1>
                <p className="text-muted-foreground">
                    Improve AI accuracy and create deterministic rules for user guidance.
                </p>
            </div>
             <Alert variant="default" className="mb-6 border-blue-300 bg-blue-50">
                <Info className="h-4 w-4 !text-blue-600" />
                <AlertTitle className="text-blue-900">How This Works</AlertTitle>
                <AlertDescription className="text-blue-800">
                    The AI-generated recommendations for users are automatically added to the "Review Queue". From there, you can approve them, or convert them into a permanent "Guidance Rule". The rules you create here are not currently applied to user timelines but are for demonstration.
                </AlertDescription>
            </Alert>
            <Tabs defaultValue="review">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="review">Review Queue</TabsTrigger>
                    <TabsTrigger value="rules">Guidance Rules</TabsTrigger>
                </TabsList>
                <TabsContent value="review" className="mt-6">
                    <ReviewQueue />
                </TabsContent>
                <TabsContent value="rules" className="mt-6">
                    <GuidanceRulesEditor />
                </TabsContent>
            </Tabs>

        </div>
    );
}
