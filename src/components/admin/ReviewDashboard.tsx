

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useUserData, GuidanceRule, Question, Condition, ExternalResource, MasterTask } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle, XCircle, Pencil, PlusCircle, Trash2, Wand2, Link as LinkIcon, CalendarCheck2, Clock, CalendarDays, Bold, Italic, List, ListOrdered, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { tenureOptions } from '@/lib/guidance-helpers';
import GuidanceRuleForm from './GuidanceRuleForm';


export default function GuidanceEditor() {
  const { 
      masterQuestions, 
      masterProfileQuestions, 
      getAllCompanyConfigs, 
      saveCompanyConfig, 
      externalResources,
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
      // For this prototype, we'll assume guidance is platform-wide and stored on the first company.
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
    if (!firstCompanyKey) return; // Should not happen

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
  }

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
      <div className="space-y-1 mb-6">
        <h1 className="font-headline text-3xl font-bold">Consultant Guidance Editor</h1>
        <p className="text-muted-foreground">
            Create and manage rules to provide specific, targeted advice to users based on their answers.
        </p>
      </div>

      <Alert variant="default" className="mb-6 border-blue-300 bg-blue-50">
        <Info className="h-4 w-4 !text-blue-600" />
        <AlertTitle className="text-blue-900">Feature Note</AlertTitle>
        <AlertDescription className="text-blue-800">
            This guidance editor is for mock-up and demonstration purposes only. The rules configured here are not currently being used to generate the live AI recommendations for end-users.
        </AlertDescription>
      </Alert>
      
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
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(rule)}><Pencil className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRule(rule.id)}><Trash2 className="h-4 w-4"/></Button>
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
        ruleToConvert={editingRule as any}
        onSave={handleSaveRule}
        questions={allQuestions}
        masterTasks={masterTasks}
      />
    </>
  );
}
