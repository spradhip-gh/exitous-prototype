
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompanyConfig, Project } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export function ProjectAssignmentPopover({ questionId, projects, companyConfig, onVisibilityChange, disabled }: {
    questionId: string;
    projects: Project[];
    companyConfig?: CompanyConfig;
    onVisibilityChange: (hiddenIds: string[]) => void;
    disabled?: boolean;
}) {
    const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>([]);
    
    useEffect(() => {
        const override = companyConfig?.questions?.[questionId];
        const isHiddenForAll = override?.isActive === false;

        if (isHiddenForAll) {
            setHiddenProjectIds(['all']);
        } else {
            const hiddenInProjects: string[] = [];
            projects.forEach(p => {
                if (companyConfig?.projectConfigs?.[p.id]?.hiddenQuestions?.includes(questionId)) {
                    hiddenInProjects.push(p.id);
                }
            });
            if(companyConfig?.projectConfigs?.__none__?.hiddenQuestions?.includes(questionId)) {
                hiddenInProjects.push('__none__');
            }
            setHiddenProjectIds(hiddenInProjects);
        }
    }, [companyConfig, questionId, projects]);

    const isHiddenForAny = hiddenProjectIds.length > 0;
    const Icon = isHiddenForAny ? EyeOff : Eye;
    const tooltipText = isHiddenForAny 
        ? `Hidden for ${hiddenProjectIds.includes('all') ? 'all projects' : `${hiddenProjectIds.length} project(s)`}` 
        : "Visible to all projects";

    const handleCheckboxChange = (id: string, checked: boolean) => {
        let newSelection: string[];
        if (id === 'all') {
            newSelection = checked ? ['all'] : [];
        } else {
            const currentSelection = hiddenProjectIds.filter(pid => pid !== 'all');
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
                    <p className="text-xs text-muted-foreground">Select projects to hide this from.</p>
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
                                checked={hiddenProjectIds.includes('__none__')}
                                onCheckedChange={(c) => handleCheckboxChange('__none__', !!c)}
                                disabled={hiddenProjectIds.includes('all')}
                            />
                            <Label htmlFor="hide-unassigned" className={cn("italic", hiddenProjectIds.includes('all') && "text-muted-foreground")}>Unassigned Users</Label>
                        </div>
                        {projects.map(p => (
                            <div key={p.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`hide-${p.id}`}
                                    checked={hiddenProjectIds.includes(p.id)}
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
