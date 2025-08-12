
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
  question,
  projects,
  companyConfig,
  onVisibilityChange,
  disabled,
  itemType = 'Question'
}: {
  question: Question,
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
    
    // Check master override first
    if(companyConfig?.questions?.[question.id]?.isActive === false) {
      initialHiddenIds = ['all'];
    } else {
        // If not hidden for all, check project-specific configs
        const hiddenInProjects: string[] = [];
        projects.forEach(p => {
            if (companyConfig?.projectConfigs?.[p.id]?.hiddenQuestions?.includes(question.id)) {
                hiddenInProjects.push(p.id);
            }
        });
        if (companyConfig?.projectConfigs?.__none__?.hiddenQuestions?.includes(question.id)) {
            hiddenInProjects.push('__none__');
        }
        initialHiddenIds = hiddenInProjects;
    }

    setHiddenProjectIds(initialHiddenIds);

  }, [companyConfig, question.id, projects]);


  const { isHiddenForAny, tooltipText } = useMemo(() => {
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

  }, [hiddenProjectIds, projects]);
  
  const Icon = isHiddenForAny ? EyeOff : Eye;
  
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
