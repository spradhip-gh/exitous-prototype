

'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown, EyeOff } from 'lucide-react';
import { Project } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';

export function ProjectAssignmentPopover({
    item,
    projects,
    onSave,
    disabled,
    initialProjectIds,
    includeUnassignedOption = false,
    popoverContentWidth = "w-[200px]",
}: {
    item: { id: string, typeLabel: 'Question' | 'Task' | 'Tip' | 'Resource' | 'User', name: string, projectIds?: string[] },
    projects: Omit<Project, 'isArchived' | 'severanceDeadlineTime' | 'severanceDeadlineTimezone' | 'preEndDateContactAlias' | 'postEndDateContactAlias'>[],
    onSave: (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource' | 'User', projectIds: string[]) => void,
    disabled?: boolean;
    initialProjectIds?: string[];
    includeUnassignedOption?: boolean;
    popoverContentWidth?: string;
}) {
    const [open, setOpen] = useState(false);
    const [itemProjectIds, setItemProjectIds] = useState<string[]>([]);
    
    useEffect(() => {
        setItemProjectIds(initialProjectIds || item.projectIds || []);
    }, [initialProjectIds, item.projectIds, open]);

    const handleSelect = (projectId: string) => {
        const isSelected = itemProjectIds.includes(projectId);
        let newProjectIds: string[];

        if (projectId === 'all') {
            newProjectIds = itemProjectIds.includes('all') ? [] : ['all'];
        } else {
            let currentIds = itemProjectIds.filter(id => id !== 'all');
            if (isSelected) {
                newProjectIds = currentIds.filter(id => id !== projectId);
            } else {
                newProjectIds = [...currentIds, projectId];
            }
        }
        
        onSave(item.id, item.typeLabel, newProjectIds);
        setItemProjectIds(newProjectIds); // Update local state to reflect change immediately
    };

    const getDisplayText = () => {
        if (item.typeLabel === 'Question') {
            if (itemProjectIds.includes('all')) return "Hidden for All Projects";
            if (itemProjectIds.length === 0) return "Visible to All Projects";
            return `Hidden for ${itemProjectIds.length} project(s)`;
        }

        if (itemProjectIds.includes('all') || itemProjectIds.length === 0) return "All Projects";
        
        const hasUnassigned = itemProjectIds.includes('__none__');
        const assignedProjectCount = itemProjectIds.filter(id => id !== '__none__').length;
        
        const parts = [];
        if (assignedProjectCount > 0) parts.push(`${assignedProjectCount} Project${assignedProjectCount > 1 ? 's' : ''}`);
        if (hasUnassigned) parts.push("Unassigned Users");
        
        return parts.join(' + ');
    };
    
    const popoverButton = item.typeLabel === 'Question' 
        ? <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={disabled}><EyeOff className="h-4 w-4" /></Button>
        : <Button variant="outline" className="w-full justify-between font-normal" disabled={disabled}><span className="truncate">{getDisplayText()}</span> <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/></Button>

    const isAllSelected = itemProjectIds.includes('all');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {popoverButton}
            </PopoverTrigger>
            <PopoverContent className={cn("p-0", popoverContentWidth)}>
                 <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem onSelect={() => handleSelect('all')}>
                                <Checkbox className="mr-2" checked={isAllSelected} id={`all-projects-checkbox-${item.id}`}/> 
                                <label htmlFor={`all-projects-checkbox-${item.id}`} className="w-full cursor-pointer">{item.typeLabel === 'Question' ? 'Hide for All Projects' : 'All Projects'}</label>
                            </CommandItem>
                             {includeUnassignedOption && (
                                <CommandItem onSelect={() => handleSelect('__none__')} disabled={isAllSelected}>
                                    <Checkbox className="mr-2" checked={!isAllSelected && itemProjectIds.includes('__none__')} id={`unassigned-checkbox-${item.id}`} /> 
                                    <label htmlFor={`unassigned-checkbox-${item.id}`} className="w-full cursor-pointer">Unassigned Users</label>
                                </CommandItem>
                            )}
                        </CommandGroup>
                        <CommandSeparator />
                         <CommandGroup>
                            <ScrollArea className="h-32">
                                {(projects || []).map(p => {
                                    const isChecked = !isAllSelected && itemProjectIds.includes(p.id);
                                    return (
                                        <CommandItem key={p.id} onSelect={() => handleSelect(p.id)} disabled={isAllSelected}>
                                            <Checkbox className="mr-2" checked={isChecked} id={`project-${p.id}-checkbox-${item.id}`}/> 
                                            <label htmlFor={`project-${p.id}-checkbox-${item.id}`} className="w-full cursor-pointer">{p.name}</label>
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
