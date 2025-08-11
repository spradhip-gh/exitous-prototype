
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';
import { Project, Question, MasterTask, MasterTip, Resource } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';

export function ProjectAssignmentPopover({
    item,
    projects,
    onSave,
    disabled,
}: {
    item: (Question | MasterTask | MasterTip | Resource) & { typeLabel: 'Question' | 'Task' | 'Tip' | 'Resource' },
    projects: Project[],
    onSave: (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', projectIds: string[]) => void,
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const itemProjectIds = useMemo(() => item.projectIds || [], [item.projectIds]);

    const handleSelect = (projectId: string, isSelected: boolean) => {
        let newProjectIds;
        if (projectId === 'all') {
            newProjectIds = [];
        } else if (projectId === 'none') {
            newProjectIds = ['none'];
        } else {
            const current = (itemProjectIds.includes('all') || itemProjectIds.length === 0) ? [] : itemProjectIds.filter(id => id !== 'none');
            if (isSelected) {
                newProjectIds = [...current, projectId];
            } else {
                newProjectIds = current.filter(id => id !== projectId);
            }
        }
        onSave(item.id, item.typeLabel, newProjectIds);
    };

    const getDisplayText = () => {
        if (itemProjectIds.length === 0) return "All Projects";
        if (itemProjectIds.includes('none')) return "No Project";
        if (itemProjectIds.length === 1) {
            return projects.find(p => p.id === itemProjectIds[0])?.name || "1 Project";
        }
        return `${itemProjectIds.length} Projects`;
    };

    const isAllSelected = itemProjectIds.length === 0;
    const isNoneSelected = itemProjectIds.includes('none');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-between font-normal" disabled={disabled}>
                    {getDisplayText()} <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                 <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem onSelect={() => handleSelect('all', !isAllSelected)}>
                                <Checkbox className="mr-2" checked={isAllSelected} /> All Projects
                            </CommandItem>
                            <CommandItem onSelect={() => handleSelect('none', !isNoneSelected)}>
                                <Checkbox className="mr-2" checked={isNoneSelected} disabled={isAllSelected} /> No Project
                            </CommandItem>
                            {projects.map(p => {
                                const isChecked = !isAllSelected && !isNoneSelected && itemProjectIds.includes(p.id);
                                return (
                                    <CommandItem key={p.id} onSelect={() => handleSelect(p.id, !isChecked)} disabled={isAllSelected || isNoneSelected}>
                                        <Checkbox className="mr-2" checked={isChecked} /> {p.name}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
