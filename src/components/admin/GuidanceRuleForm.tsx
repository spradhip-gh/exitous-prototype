
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, CalendarCheck2, Clock, Link as LinkIcon, Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Question, Condition, GuidanceRule, ExternalResource } from '@/hooks/use-user-data';
import { tenureOptions } from '@/lib/guidance-helpers';
import { PersonalizedRecommendationsInput } from '@/ai/flows/personalized-recommendations';


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

export default function GuidanceRuleForm({
  isOpen,
  onOpenChange,
  onSave,
  ruleToConvert,
  questions,
  externalResources
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: GuidanceRule) => void;
  ruleToConvert: { guidanceText: string, category: string, inputData: Omit<PersonalizedRecommendationsInput, 'userEmail'> } | null;
  questions: Question[];
  externalResources: ExternalResource[];
}) {
  const { toast } = useToast();
  const [currentRule, setCurrentRule] = useState<Partial<GuidanceRule>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && ruleToConvert) {
      setCurrentRule({
        id: `rule-${Date.now()}`,
        name: `Rule from: ${ruleToConvert.inputData.profileData.state} user`,
        guidanceText: ruleToConvert.guidanceText,
        category: ruleToConvert.category,
        conditions: [],
      });
    } else if (!isOpen) {
        setCurrentRule({});
    }
  }, [isOpen, ruleToConvert]);

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
      if (!prev?.conditions) return prev;
      const newConditions = [...prev.conditions];
      newConditions[index] = newCondition;
      return { ...prev, conditions: newConditions };
    });
  };

  const handleSave = () => {
    if (!currentRule || !currentRule.name || !currentRule.guidanceText || currentRule.conditions?.length === 0) {
      toast({ title: 'Missing Fields', description: 'Please provide a name, guidance text, and at least one condition.', variant: 'destructive' });
      return;
    }
    onSave(currentRule as GuidanceRule);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert to Guidance Rule</DialogTitle>
          <DialogDescription>Create a reusable rule based on this AI recommendation.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input id="rule-name" value={currentRule.name || ''} onChange={(e) => setCurrentRule(p => ({ ...p, name: e.target.value }))} />
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
                          if (selectedOption) { handleConditionChange(i, selectedOption.condition) }
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
                        <Select value={cond.dateQuestionId} onValueChange={val => handleConditionChange(i, { ...cond, dateQuestionId: val })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {questions.filter(q => q.type === 'date').map(q => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Is</Label>
                        <Select value={cond.operator} onValueChange={val => handleConditionChange(i, { ...cond, operator: val as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gt">Greater Than</SelectItem>
                            <SelectItem value="lt">Less Than</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Offset (days)</Label>
                        <Input type="number" value={cond.value} onChange={e => handleConditionChange(i, { ...cond, value: parseInt(e.target.value, 10) || 0 })} />
                      </div>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleRemoveCondition(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => addCondition('question')}><PlusCircle className="mr-2" /> Question Condition</Button>
                <Button variant="outline" size="sm" onClick={() => addCondition('tenure')}><CalendarCheck2 className="mr-2" /> Tenure Condition</Button>
                <Button variant="outline" size="sm" onClick={() => addCondition('date_offset')}><Clock className="mr-2" /> Date Condition</Button>
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
                rows={4} 
                className="rounded-t-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guidance-category">Category</Label>
            <Select value={currentRule.category || 'General'} onValueChange={val => setCurrentRule(p => ({ ...p, category: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Healthcare', 'Finances', 'Job Search', 'Legal', 'Well-being', 'General'].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="linked-resource">Linked Resource (Optional)</Label>
            <Select value={currentRule.linkedResourceId || ''} onValueChange={val => setCurrentRule(p => ({ ...p, linkedResourceId: val === 'none' ? undefined : val }))}>
              <SelectTrigger><SelectValue placeholder="Select a resource..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {externalResources.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Create Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
