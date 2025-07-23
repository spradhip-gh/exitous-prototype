
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useUserData, GuidanceRule, Question } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle, XCircle, Pencil, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const sampleProfileData = {
  birthYear: 1988,
  state: 'California',
  gender: 'Female',
  maritalStatus: 'Married',
  hasChildrenUnder13: true,
  hasExpectedChildren: false,
  impactedPeopleCount: '1 - 3',
  livingStatus: 'Homeowner',
  citizenshipStatus: 'U.S. citizen',
  pastLifeEvents: ['Home purchase'],
  hasChildrenAges18To26: false,
};

const sampleAssessmentData = {
  workStatus: 'Full-time employee',
  startDate: new Date('2018-05-15').toISOString(),
  notificationDate: new Date('2024-06-01').toISOString(),
  finalDate: new Date('2024-06-30').toISOString(),
  workState: 'California',
  relocationPaid: 'No',
  unionMember: 'No',
  workArrangement: 'Remote',
  workVisa: 'None of the above',
  onLeave: ['None of the above'],
  accessSystems: ['email', 'hr_payroll'],
  emailAccessEndDate: new Date('2024-07-15').toISOString(),
  hrPayrollSystemAccessEndDate: new Date('2024-07-31').toISOString(),
  hadMedicalInsurance: 'Yes',
  medicalCoverage: 'Me and family',
  medicalCoverageEndDate: new Date('2024-06-30').toISOString(),
  hadDentalInsurance: 'Yes',
  dentalCoverage: 'Me and family',
  dentalCoverageEndDate: new Date('2024-06-30').toISOString(),
  hadVisionInsurance: 'No',
  hadEAP: 'Yes',
  eapCoverageEndDate: new Date('2024-09-30').toISOString(),
};

function GuidanceRuleForm({
  isOpen,
  onOpenChange,
  onSave,
  rule,
  questions,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: GuidanceRule) => void;
  rule: Partial<GuidanceRule> | null;
  questions: Question[];
}) {
  const { toast } = useToast();
  const [currentRule, setCurrentRule] = useState<Partial<GuidanceRule> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentRule(rule ? { ...rule } : { id: `rule-${Date.now()}`, name: '', conditions: [], guidanceText: '', category: 'General' });
    }
  }, [isOpen, rule]);

  const handleAddCondition = () => {
    setCurrentRule(prev => ({
      ...prev,
      conditions: [...(prev?.conditions || []), { questionId: '', answer: '' }],
    }));
  };
  
  const handleRemoveCondition = (index: number) => {
    setCurrentRule(prev => ({
        ...prev,
        conditions: prev?.conditions?.filter((_, i) => i !== index),
    }));
  };

  const handleConditionChange = (index: number, field: 'questionId' | 'answer', value: string) => {
    setCurrentRule(prev => {
        const newConditions = [...(prev?.conditions || [])];
        const newCondition = { ...newConditions[index], [field]: value };
        // If question changes, clear the answer
        if(field === 'questionId') {
            newCondition.answer = '';
        }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule?.id ? 'Edit Guidance Rule' : 'Create New Guidance Rule'}</DialogTitle>
          <DialogDescription>Define a rule to provide specific guidance when certain conditions are met.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input id="rule-name" value={currentRule.name || ''} onChange={(e) => setCurrentRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g., 'Advise on COBRA'" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Conditions</CardTitle><CardDescription className="text-xs">This guidance will apply IF all these conditions are true:</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {currentRule.conditions?.map((cond, i) => {
                const selectedQuestion = questions.find(q => q.id === cond.questionId);
                return (
                  <div key={i} className="flex items-end gap-2 p-3 border rounded-md relative">
                    <div className="grid grid-cols-2 gap-2 flex-grow">
                        <div className="space-y-2">
                            <Label>Question</Label>
                            <Select value={cond.questionId} onValueChange={val => handleConditionChange(i, 'questionId', val)}>
                                <SelectTrigger><SelectValue placeholder="Select a question..." /></SelectTrigger>
                                <SelectContent>
                                    {questions.filter(q => q.options && q.options.length > 0).map(q => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Answer Is</Label>
                            <Select value={cond.answer} onValueChange={val => handleConditionChange(i, 'answer', val)} disabled={!selectedQuestion}>
                                <SelectTrigger><SelectValue placeholder="Select an answer..." /></SelectTrigger>
                                <SelectContent>
                                    {selectedQuestion?.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCondition(i)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={handleAddCondition}><PlusCircle className="mr-2"/> Add Condition</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Label htmlFor="guidance-text">Guidance To Provide</Label>
            <Textarea id="guidance-text" value={currentRule.guidanceText || ''} onChange={(e) => setCurrentRule(p => ({ ...p, guidanceText: e.target.value }))} placeholder="e.g., 'Since you lost medical coverage, it is critical to explore COBRA...'" rows={4}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guidance-category">Category</Label>
            <Select value={currentRule.category || 'General'} onValueChange={val => setCurrentRule(p => ({...p, category: val}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    {['Healthcare', 'Finances', 'Job Search', 'Legal', 'Well-being', 'General'].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
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
  const { masterQuestions, masterProfileQuestions, getAllCompanyConfigs, saveCompanyConfig } = useUserData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<GuidanceRule> | null>(null);

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
      <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h1 className="font-headline text-3xl font-bold">Consultant Guidance Editor</h1>
            <p className="text-muted-foreground">
                Create rules to provide specific, targeted advice to users based on their answers.
            </p>
          </div>
          <Button onClick={handleAddClick}><PlusCircle className="mr-2" /> Add Guidance Rule</Button>
      </div>
      
       <Card>
            <CardHeader>
                <CardTitle>Guidance Rules</CardTitle>
                <CardDescription>These rules will be automatically applied to user recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {allGuidanceRules.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wand2 className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Guidance Rules Created</h3>
                            <p className="mt-1 text-sm">Click "Add Guidance Rule" to create your first one.</p>
                        </div>
                    )}
                    {allGuidanceRules.map(rule => (
                        <Card key={rule.id} className="bg-muted/50">
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{rule.name}</CardTitle>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {rule.conditions.map((c, i) => {
                                            const q = allQuestions.find(q => q.id === c.questionId);
                                            return <Badge key={i} variant="secondary">{q?.label.substring(0, 20)}... is "{c.answer}"</Badge>
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
      
      <GuidanceRuleForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveRule}
        rule={editingRule}
        questions={allQuestions}
      />
    </>
  );
}
