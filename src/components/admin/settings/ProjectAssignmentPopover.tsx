

'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompanyConfig, Project, Question } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function ProjectAssignmentPopover({
  question, // This is now a generic item
  projects,
  companyConfig,
  onVisibilityChange,
  disabled,
  itemType = 'Question'
}: {
  question: Question, // Keep this prop name for compatibility, but treat it as a generic item
  projects: Project[];
  companyConfig?: CompanyConfig;
  onVisibilityChange: (hiddenIds: string[]) => void;
  disabled?: boolean;
  itemType?: 'Question' | 'Task' | 'Tip' | 'Resource';
}) {
  const { auth } = useAuth();
  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>([]);
  
  useEffect(() => {
    let initialHiddenIds: string[] = [];
    const itemId = question.id; // Use question.id as the generic item ID

    if (itemType === 'Question') {
      if(companyConfig?.questions?.[itemId]?.isActive === false) {
        initialHiddenIds = ['all'];
      } else {
        const hiddenInProjects: string[] = [];
        projects.forEach(p => {
          if (companyConfig?.projectConfigs?.[p.id]?.hiddenQuestions?.includes(itemId)) {
            hiddenInProjects.push(p.id);
          }
        });
        if (companyConfig?.projectConfigs?.__none__?.hiddenQuestions?.includes(itemId)) {
          hiddenInProjects.push('__none__');
        }
        initialHiddenIds = hiddenInProjects;
      }
    } else {
        // For custom content (Tasks, Tips), visibility is based on presence in `projectIds`
        // So "hidden" is the inverse. If projectIds is empty, it's visible to all, so nothing is hidden.
        // If it has IDs, then all *other* projects are hidden. This popover model is inverted for custom content.
        // Let's adjust the popover to show what it's VISIBLE to for custom content.
        // The component name is now a bit of a misnomer, but we'll adapt its internal logic.
    }
    setHiddenProjectIds(initialHiddenIds);

  }, [companyConfig, question.id, projects, itemType]);


  const { isHiddenForAny, tooltipText } = useMemo(() => {
    if (itemType !== 'Question') {
        const item = question as any; // Treat as Task/Tip etc.
        const visibleProjectIds = item.projectIds || [];
        if (visibleProjectIds.length === 0) {
            return { isHiddenForAny: false, tooltipText: 'Visible to all projects.' };
        }
        const visibleNames = visibleProjectIds.map((id: string) => {
            if (id === '__none__') return 'Unassigned Users';
            return projects.find(p => p.id === id)?.name;
        }).filter(Boolean);
        return { isHiddenForAny: true, tooltipText: `Visible only to: ${visibleNames.join(', ')}` };
    }
    
    // Original logic for master questions
    if (hiddenProjectIds.includes('all')) {
      return { isHiddenForAny: true, tooltipText: `Visible to no projects.` };
    }
    if (hiddenProjectIds.length === 0) {
      return { isHiddenForAny: false, tooltipText: `Visible to all projects.` };
    }
    
    const hiddenNames = hiddenProjectIds.map(id => {
        if (id === '__none__') return 'Unassigned Users';
        return projects.find(p => p.id === id)?.name;
    }).filter(Boolean);
    
    return {
        isHiddenForAny: true,
        tooltipText: `Hidden from: ${hiddenNames.join(', ')}`
    };

  }, [hiddenProjectIds, projects, itemType, question]);
  
  const Icon = itemType !== 'Question' 
    ? (question.projectIds && question.projectIds.length > 0) ? Eye : EyeOff 
    : isHiddenForAny ? EyeOff : Eye;
  
  const handleCheckboxChange = (id: string, checked: boolean) => {
    let newSelection: string[];
    if (id === 'all') {
      newSelection = checked ? ['all'] : [];
    } else {
      const currentSelection = hiddenProjectIds.includes('all') 
        ? projects.map(p => p.id).concat(['__none__'])
        : hiddenProjectIds;
      
      if (checked) {
        newSelection = [...currentSelection, id];
      } else {
        newSelection = currentSelection.filter(pid => pid !== id);
      }
    }
    onVisibilityChange(newSelection);
    setHiddenProjectIds(newSelection);
  };

  if(itemType !== 'Question') {
      // For custom content, we'll show a simpler assignment UI.
      // This popover is becoming complex. A dedicated component might be better,
      // but for this fix, we'll adapt.
      const item = question as any;
      const visibleProjectIds = new Set(item.projectIds || []);

       const handleCustomContentCheckboxChange = (id: string, checked: boolean) => {
            const newSelection = new Set(visibleProjectIds);
            if(checked) {
                newSelection.add(id);
            } else {
                newSelection.delete(id);
            }
            onVisibilityChange(Array.from(newSelection)); // The parent expects an array of VISIBLE IDs
       }


       return (
            <Popover>
                <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={disabled}>
                            <Icon className="h-4 w-4" />
                        </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipText}</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-[250px] p-0">
                    <div className="p-4">
                    <h4 className="font-medium text-sm">Project Visibility</h4>
                    <p className="text-xs text-muted-foreground">Select projects to make this {itemType.toLowerCase()} visible to. Leave all unchecked to show to all.</p>
                    </div>
                    <Separator />
                    <ScrollArea className="max-h-60">
                    <div className="p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="vis-unassigned"
                                checked={visibleProjectIds.has('__none__')}
                                onCheckedChange={(c) => handleCustomContentCheckboxChange('__none__', !!c)}
                            />
                            <Label htmlFor="vis-unassigned" className="italic">Unassigned Users</Label>
                        </div>
                        {projects.map(p => (
                        <div key={p.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`vis-${p.id}`}
                                checked={visibleProjectIds.has(p.id)}
                                onCheckedChange={(c) => handleCustomContentCheckboxChange(p.id, !!c)}
                            />
                            <Label htmlFor={`vis-${p.id}`}>
                                {p.name}
                            </Label>
                        </div>
                        ))}
                    </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
       )
  }

  // Original logic for master questions
  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" disabled={disabled}>
                <Icon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-[250px] p-0">
        <div className="p-4">
          <h4 className="font-medium text-sm">Project Visibility</h4>
          <p className="text-xs text-muted-foreground">Select projects to hide this {itemType.toLowerCase()} from.</p>
        </div>
        <Separator />
        <ScrollArea className="max-h-60">
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-all-projects"
                checked={hiddenProjectIds.includes('all')}
                onCheckedChange={(c) => handleCheckboxChange('all', !!c)}
              />
              <Label htmlFor="hide-all-projects" className="font-semibold">Hidden for All Projects</Label>
            </div>
            <Separator />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-unassigned"
                checked={hiddenProjectIds.includes('all') || hiddenProjectIds.includes('__none__')}
                onCheckedChange={(c) => handleCheckboxChange('__none__', !!c)}
                disabled={hiddenProjectIds.includes('all')}
              />
              <Label htmlFor="hide-unassigned" className={cn("italic", hiddenProjectIds.includes('all') && "text-muted-foreground")}>Unassigned Users</Label>
            </div>
            {projects.map(p => (
              <div key={p.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`hide-${p.id}`}
                  checked={hiddenProjectIds.includes('all') || hiddenProjectIds.includes(p.id)}
                  onCheckedChange={(c) => handleCheckboxChange(p.id, !!c)}
                  disabled={hiddenProjectIds.includes('all')}
                />
                <Label htmlFor={`hide-${p.id}`} className={cn(hiddenProjectIds.includes('all') && "text-muted-foreground")}>
                  {p.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
