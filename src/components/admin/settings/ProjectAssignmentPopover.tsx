
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';
import { Project, Question, MasterTask, MasterTip, Resource } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ProjectAssignmentPopover({
    item,
    projects,
    onSave,
    disabled,
    initialProjectIds,
    includeUnassignedOption = false,
    popoverContentWidth = "w-[200px]",
}: {
    item: (Partial<Question> | Partial<MasterTask> | Partial<MasterTip> | Partial<Resource>) & { id: string, typeLabel: 'Question' | 'Task' | 'Tip' | 'Resource' | 'User' },
    projects: Omit<Project, 'isArchived' | 'severanceDeadlineTime' | 'severanceDeadlineTimezone' | 'preEndDateContactAlias' | 'postEndDateContactAlias'>[],
    onSave: (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource' | 'User', projectIds: string[]) => void,
    disabled?: boolean;
    initialProjectIds?: string[];
    includeUnassignedOption?: boolean;
    popoverContentWidth?: string;
}) {
    const [open, setOpen] = useState(false);
    const itemProjectIds = useMemo(() => initialProjectIds || item.projectIds || [], [item.projectIds, initialProjectIds]);

    const handleSelect = (projectId: string, isSelected: boolean) => {
        let currentIds = itemProjectIds.includes('all') || itemProjectIds.length === 0 ? [] : [...itemProjectIds];
        let newProjectIds;
    
        if (projectId === 'all') {
            newProjectIds = isSelected ? ['all'] : [];
        } else {
            // Ensure 'all' is not in the list when individual items are selected
            currentIds = currentIds.filter(id => id !== 'all');
            if (isSelected) {
                newProjectIds = [...currentIds, projectId];
            } else {
                newProjectIds = currentIds.filter(id => id !== projectId);
            }
        }
        onSave(item.id, item.typeLabel, newProjectIds);
    };

    const getDisplayText = () => {
        if (itemProjectIds.includes('all') || itemProjectIds.length === 0) return "All Projects";
        
        const hasUnassigned = itemProjectIds.includes('__none__');
        const assignedProjectCount = itemProjectIds.filter(id => id !== '__none__').length;
        
        const parts = [];
        if (assignedProjectCount > 0) parts.push(`${assignedProjectCount} Project${assignedProjectCount > 1 ? 's' : ''}`);
        if (hasUnassigned) parts.push("Unassigned");
        
        return parts.join(' + ');
    };

    const isAllSelected = itemProjectIds.includes('all') || itemProjectIds.length === 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal" disabled={disabled}>
                    {getDisplayText()} <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-0", popoverContentWidth)}>
                 <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem onSelect={() => handleSelect('all', !isAllSelected)}>
                                <Checkbox className="mr-2" checked={isAllSelected} id="all-projects-checkbox"/> 
                                <label htmlFor="all-projects-checkbox" className="w-full">All Projects</label>
                            </CommandItem>
                             {includeUnassignedOption && (
                                <CommandItem onSelect={() => handleSelect('__none__', !itemProjectIds.includes('__none__'))} disabled={isAllSelected}>
                                    <Checkbox className="mr-2" checked={itemProjectIds.includes('__none__')} id="unassigned-checkbox" /> 
                                    <label htmlFor="unassigned-checkbox" className="w-full">Unassigned Users</label>
                                </CommandItem>
                            )}
                        </CommandGroup>
                        <CommandSeparator />
                         <CommandGroup>
                            <ScrollArea className="h-32">
                                {(projects || []).map(p => {
                                    const isChecked = !isAllSelected && itemProjectIds.includes(p.id);
                                    return (
                                        <CommandItem key={p.id} onSelect={() => handleSelect(p.id, !isChecked)} disabled={isAllSelected}>
                                            <Checkbox className="mr-2" checked={isChecked} id={`project-${p.id}-checkbox`}/> 
                                            <label htmlFor={`project-${p.id}-checkbox`} className="w-full">{p.name}</label>
                                        </CommandItem>
                                    )
                                })}
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
