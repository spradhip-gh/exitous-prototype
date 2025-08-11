
'use client';
import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useUserData, CompanyConfig, MasterTask, MasterTip, Resource, Project, Question } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export default function ProjectCustomizationTab({ companyConfig, companyName, projects, canWrite }: {
    companyConfig: CompanyConfig;
    companyName: string;
    projects: Project[];
    canWrite: boolean;
}) {
    const { saveCompanyConfig } = useUserData();
    const [localCompanyConfig, setLocalCompanyConfig] = useState(companyConfig);

    useEffect(() => {
        setLocalCompanyConfig(companyConfig);
    }, [companyConfig]);

    const allCustomContent = useMemo(() => {
        const config = localCompanyConfig || { customQuestions: {}, companyTasks: [], companyTips: [], resources: [] };
        const questions = Object.values(config.customQuestions || {}).map(q => ({ ...q, typeLabel: 'Question' as const, name: q.label }));
        const tasks = (config.companyTasks || []).map(t => ({ ...t, typeLabel: 'Task' as const }));
        const tips = (config.companyTips || []).map(t => ({ ...t, typeLabel: 'Tip' as const, name: t.text }));
        const resources = (config.resources || []).map(r => ({ ...r, typeLabel: 'Resource' as const, name: r.title }));
        return [...questions, ...tasks, ...tips, ...resources];
    }, [localCompanyConfig]);

    const handleProjectAssignmentChange = (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', newProjectIds: string[]) => {
        const newConfig = JSON.parse(JSON.stringify(localCompanyConfig));

        let item: any = null;
        switch (itemType) {
            case 'Question':
                item = newConfig.customQuestions?.[itemId];
                break;
            case 'Task':
                item = newConfig.companyTasks?.find((t: MasterTask) => t.id === itemId);
                break;
            case 'Tip':
                item = newConfig.companyTips?.find((t: MasterTip) => t.id === itemId);
                break;
            case 'Resource':
                item = newConfig.resources?.find((r: Resource) => r.id === itemId);
                break;
        }
        
        if (item) {
            item.projectIds = newProjectIds;
        }

        setLocalCompanyConfig(newConfig);
        saveCompanyConfig(companyName, newConfig);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Customization</CardTitle>
                <CardDescription>Manage which custom questions, tasks, tips, and resources are visible to each project.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Content Title / Text</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Visible To</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allCustomContent.map(item => {
                            const currentProjectIds = item.projectIds || [];
                            const isAllSelected = currentProjectIds.length === 0;

                            const handleCheckboxChange = (projectId: string, isChecked: boolean) => {
                                let newProjectIds: string[];
                                if (projectId === 'all') {
                                    newProjectIds = []; // Empty array means "All Projects"
                                } else {
                                    // Start with the current IDs, but remove 'all' if it exists
                                    let currentIds = isAllSelected ? [] : [...currentProjectIds];
                                    if (isChecked) {
                                        newProjectIds = [...currentIds, projectId];
                                    } else {
                                        newProjectIds = currentIds.filter(id => id !== projectId);
                                    }
                                }
                                handleProjectAssignmentChange(item.id, item.typeLabel, newProjectIds);
                            };

                            return (
                                <TableRow key={`${item.typeLabel}-${item.id}`}>
                                    <TableCell className="font-medium">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger className="text-left"><p className="truncate max-w-sm">{item.name}</p></TooltipTrigger>
                                                <TooltipContent><p className="max-w-md">{item.name}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{item.typeLabel}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`all-${item.id}`}
                                                    checked={isAllSelected}
                                                    onCheckedChange={(checked) => handleCheckboxChange('all', !!checked)}
                                                    disabled={!canWrite}
                                                />
                                                <Label htmlFor={`all-${item.id}`} className="font-semibold">All Projects</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`unassigned-${item.id}`}
                                                                    checked={!isAllSelected && currentProjectIds.includes('__none__')}
                                                                    onCheckedChange={(checked) => handleCheckboxChange('__none__', !!checked)}
                                                                    disabled={isAllSelected || !canWrite}
                                                                />
                                                                <Label htmlFor={`unassigned-${item.id}`} className="font-normal italic flex items-center gap-1.5 cursor-help">
                                                                    Unassigned Users
                                                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                                </Label>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Users who are not allocated to a specific project or division.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {projects.map(p => (
                                                <div key={p.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`${p.id}-${item.id}`}
                                                        checked={!isAllSelected && currentProjectIds.includes(p.id)}
                                                        onCheckedChange={(checked) => handleCheckboxChange(p.id, !!checked)}
                                                        disabled={isAllSelected || !canWrite}
                                                    />
                                                    <Label htmlFor={`${p.id}-${item.id}`} className="font-normal">{p.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
