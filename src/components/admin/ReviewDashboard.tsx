

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useUserData, GuidanceRule, Question, Condition, ExternalResource } from '@/hooks/use-user-data';
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

function FormattingToolbar({ textareaRef, onTextChange }: { textareaRef: React.RefObject<HTMLTextAreaElement>, onTextChange: (value: string) => void }) {
    const formatText = (style: 'bold' | 'italic' | 'ul' | 'ol') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText;

        switch (style) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `*${selectedText}*`;
                break;
            case 'ul':
                newText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
                break;
            case 'ol':
                newText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
                break;
            default:
                newText = selectedText;
        }

        const updatedValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        onTextChange(updatedValue);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + newText.length - selectedText.length;
            textarea.selectionEnd = start + newText.length - selectedText.length;
        }, 0);
    };
    
    return (
        <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-input p-1 bg-muted/50">
            <Button type="button" variant="outline" size="sm" onClick={() => formatText('bold')} className="h-7 px-2"><Bold className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => formatText('italic')} className="h-7 px-2"><Italic className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => formatText('ul')} className="h-7 px-2"><List className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => formatText('ol')} className="h-7 px-2"><ListOrdered className="h-4 w-4" /></Button>
        </div>
    );
}

function GuidanceRuleForm({
  isOpen,
  onOpenChange,
  onSave,
  rule,
  questions,
  externalResources
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: GuidanceRule) => void;
  rule: Partial<GuidanceRule> | null;
  questions: Question[];
  externalResources: any[];
}) {
  const { toast } = useToast();
  const [currentRule, setCurrentRule] = useState<Partial<GuidanceRule> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentRule(rule ? { ...rule } : { id: `rule-${Date.now()}`, name: '', conditions: [], guidanceText: '', category: 'General' });
    }
  }, [isOpen, rule]);
  
  const addCondition = (type: 'question' | 'tenure' | 'date_offset') => {
    let newCondition: Condition;
    if (type === 'tenure') {
        newCondition = tenureOptions[0].condition;
    } else if (type === 'date_offset') {
        newCondition = { type: 'date_offset', dateQuestionId: '', operator: 'gt', value: 30, unit: 'days', comparison: 'from_today', label: '' };
    } else {
        newCondition = { type: 'question', questionId: '', answer: '' };
    }
    setCurrentRule(prev => ({
      ...prev,
      conditions: [...(prev?.conditions || []), newCondition],
    }));
  };
  
  const handleRemoveCondition = (index: number) => {
    setCurrentRule(prev => ({
        ...prev,
        conditions: prev?.conditions?.filter((_, i) => i !== index),
    }));
  };

  const handleConditionChange = (index: number, newCondition: Condition) => {
    setCurrentRule(prev => {
        if(!prev?.conditions) return prev;
        const newConditions = [...prev.conditions];
        newConditions[index] = newCondition;
        return {...prev, conditions: newConditions};
    });
  };

  const handleSave = () => {
    if (!currentRule || !currentRule.name || !currentRule.guidanceText || currentRule.conditions?.length === 0) {
      toast({ title: 'Missing Fields', description: 'Please provide a name, guidance text, and at least one condition.', variant: 'destructive' });
      return;
    }
    onSave(currentRule as GuidanceRule);
  };

  if (!isOpen || !currentRule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule?.id ? 'Edit Guidance Rule' : 'Create New Guidance Rule'}</DialogTitle>
          <DialogDescription>Define a rule to provide specific, targeted advice when certain conditions are met.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input id="rule-name" value={currentRule.name || ''} onChange={(e) => setCurrentRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g., 'Advise on COBRA'" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Conditions</CardTitle><CardDescription className="text-xs">This guidance will apply IF all these conditions are true:</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {currentRule.conditions?.map((cond, i) => (
                 <div key={i} className="flex items-end gap-2 p-3 border rounded-md relative">
                    {cond.type === 'question' && (
                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <div className="space-y-2">
                                <Label>Question</Label>
                                <Select value={cond.questionId} onValueChange={val => handleConditionChange(i, { ...cond, questionId: val, answer: '' })}>
                                    <SelectTrigger><SelectValue placeholder="Select a question..." /></SelectTrigger>
                                    <SelectContent>
                                        {questions.filter(q => q.options && q.options.length > 0).map(q => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Answer Is</Label>
                                <Select value={cond.answer} onValueChange={val => handleConditionChange(i, { ...cond, answer: val })} disabled={!cond.questionId}>
                                    <SelectTrigger><SelectValue placeholder="Select an answer..." /></SelectTrigger>
                                    <SelectContent>
                                        {questions.find(q => q.id === cond.questionId)?.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    {cond.type === 'tenure' && (
                         <div className="grid grid-cols-2 gap-2 flex-grow">
                             <div className="space-y-2 col-span-2">
                                <Label>Tenure</Label>
                                <Select value={cond.label} onValueChange={val => {
                                    const selectedOption = tenureOptions.find(t => t.label === val);
                                    if(selectedOption) { handleConditionChange(i, selectedOption.condition) }
                                }}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {tenureOptions.map(opt => <SelectItem key={opt.label} value={opt.label}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                         </div>
                    )}
                    {cond.type === 'date_offset' && (
                        <div className="grid grid-cols-3 gap-2 flex-grow items-end">
                            <div className="space-y-2">
                                <Label>Date Question</Label>
                                <Select value={cond.dateQuestionId} onValueChange={val => handleConditionChange(i, {...cond, dateQuestionId: val})}>
                                    <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>
                                        {questions.filter(q => q.type === 'date').map(q => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Is</Label>
                                <Select value={cond.operator} onValueChange={val => handleConditionChange(i, {...cond, operator: val as any})}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gt">Greater Than</SelectItem>
                                        <SelectItem value="lt">Less Than</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Offset (days)</Label>
                                <Input type="number" value={cond.value} onChange={e => handleConditionChange(i, {...cond, value: parseInt(e.target.value, 10) || 0})}/>
                            </div>
                        </div>
                    )}
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleRemoveCondition(i)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
              ))}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => addCondition('question')}><PlusCircle className="mr-2"/> Question Condition</Button>
                <Button variant="outline" size="sm" onClick={() => addCondition('tenure')}><CalendarCheck2 className="mr-2"/> Tenure Condition</Button>
                 <Button variant="outline" size="sm" onClick={() => addCondition('date_offset')}><Clock className="mr-2"/> Date Condition</Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Label htmlFor="guidance-text">Guidance To Provide</Label>
            <FormattingToolbar textareaRef={textareaRef} onTextChange={(v) => setCurrentRule(p => ({ ...p, guidanceText: v }))} />
            <Textarea 
                ref={textareaRef}
                id="guidance-text" 
                value={currentRule.guidanceText || ''} 
                onChange={(e) => setCurrentRule(p => ({ ...p, guidanceText: e.target.value }))} 
                placeholder="e.g., 'Since you lost medical coverage, it is critical to explore COBRA...'" 
                rows={4}
                className="rounded-t-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guidance-category">Category</Label>
            <Select value={currentRule.category || 'General'} onValueChange={val => setCurrentRule(p => ({...p, category: val}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    {['Healthcare', 'Finances', 'Career', 'Legal', 'Well-being', 'General'].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="linked-resource">Linked Resource (Optional)</Label>
            <Select value={currentRule.linkedResourceId || ''} onValueChange={val => setCurrentRule(p => ({...p, linkedResourceId: val === 'none' ? undefined : val}))}>
                <SelectTrigger><SelectValue placeholder="Select a resource..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {externalResources.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">If selected, a "Connect with a Professional" button will appear with this guidance.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function GuidanceEditor() {
  const { masterQuestions, masterProfileQuestions, getAllCompanyConfigs, saveCompanyConfig, externalResources } = useUserData();
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

  const ruleCategories = useMemo(() => [...new Set(allGuidanceRules.map(r => r.category))], [allGuidanceRules]);
  
  const filteredRules = useMemo(() => {
    return allGuidanceRules.filter(rule => {
        const matchesCategory = activeCategory ? rule.category === activeCategory : true;
        const matchesSearch = searchTerm ? rule.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        return matchesCategory && matchesSearch;
    });
  }, [allGuidanceRules, activeCategory, searchTerm]);
  
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
                        <CardDescription>These rules will be automatically applied to user recommendations.</CardDescription>
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
                        const linkedResource = rule.linkedResourceId ? externalResources.find(r => r.id === rule.linkedResourceId) : null;
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
                                    <p className="text-sm border-l-2 border-primary pl-3 py-1 bg-background rounded-r-md">{rule.guidanceText}</p>
                                     {linkedResource && (
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <LinkIcon className="h-3 w-3" />
                                            <span>Links to: <span className="font-medium text-foreground">{linkedResource.name}</span></span>
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
        rule={editingRule}
        onSave={handleSaveRule}
        questions={allQuestions}
        externalResources={externalResources}
      />
    </>
  );
}

    

