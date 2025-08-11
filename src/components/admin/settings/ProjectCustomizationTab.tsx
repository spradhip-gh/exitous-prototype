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
import { Info, Bug, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

    const handleProjectAssignmentChange = (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', projectId: string, isChecked: boolean) => {
        const newConfig = JSON.parse(JSON.stringify(localCompanyConfig));
        
        let item: any = null;
        let itemArray: any[] | undefined = undefined;
        let itemIndex = -1;

        switch (itemType) {
            case 'Question':
                item = newConfig.customQuestions?.[itemId];
                break;
            case 'Task':
                itemArray = newConfig.companyTasks || [];
                itemIndex = itemArray.findIndex((t: MasterTask) => t.id === itemId);
                if(itemIndex > -1) item = itemArray[itemIndex];
                break;
            case 'Tip':
                itemArray = newConfig.companyTips || [];
                itemIndex = itemArray.findIndex((t: MasterTip) => t.id === itemId);
                if(itemIndex > -1) item = itemArray[itemIndex];
                break;
            case 'Resource':
                itemArray = newConfig.resources || [];
                itemIndex = itemArray.findIndex((r: Resource) => r.id === itemId);
                 if(itemIndex > -1) item = itemArray[itemIndex];
                break;
        }

        if (item) {
            const allPossibleProjectIds = projects.map(p => p.id);
            allPossibleProjectIds.push('__none__'); // For "Unassigned Users"

            let currentIds = item.projectIds || [];
            
            // If currentIds is empty, it implies "All Projects".
            // For the first interaction, we need to treat it as if all were selected.
            if (currentIds.length === 0) {
                currentIds = allPossibleProjectIds;
            }

            let newProjectIds;

            if (isChecked) {
                newProjectIds = [...currentIds, projectId];
            } else {
                newProjectIds = currentIds.filter((id: string) => id !== projectId);
            }

            // If the resulting array contains all possible projects, or is empty, it means "All Projects".
            // We represent "All Projects" with an empty array.
            if (newProjectIds.length === 0 || newProjectIds.length === allPossibleProjectIds.length) {
                item.projectIds = [];
            } else {
                item.projectIds = newProjectIds;
            }
        }


        if(itemArray && itemIndex > -1 && item) {
            itemArray[itemIndex] = item;
        }

        setLocalCompanyConfig(newConfig);
        saveCompanyConfig(companyName, newConfig);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Customization</CardTitle>
                <CardDescription>Manage which custom questions, tasks, tips, and resources are visible to each project. Leave all boxes unchecked to make an item visible to all projects.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px]">Content Title / Text</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-center">
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center justify-center gap-1.5 cursor-help">
                                                    Unassigned Users
                                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Users who are not allocated to a specific project or division.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableHead>
                                {projects.map(p => (
                                    <TableHead key={p.id} className="text-center">{p.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCustomContent.map(item => {
                                const projectIds = item.projectIds || [];
                                // An empty array signifies visibility to all. For UI, we treat it as if all are checked.
                                const isVisibleToAll = projectIds.length === 0;

                                return (
                                    <TableRow key={`${item.typeLabel}-${item.id}`}>
                                        <TableCell className="font-medium">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="text-left"><p className="truncate max-w-xs">{item.name}</p></TooltipTrigger>
                                                    <TooltipContent><p className="max-w-md">{item.name}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary">{item.typeLabel}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={isVisibleToAll || projectIds.includes('__none__')}
                                                onCheckedChange={(checked) => handleProjectAssignmentChange(item.id, item.typeLabel, '__none__', !!checked)}
                                                disabled={!canWrite}
                                            />
                                        </TableCell>
                                        {projects.map(p => (
                                            <TableCell key={p.id} className="text-center">
                                                <Checkbox
                                                    checked={isVisibleToAll || projectIds.includes(p.id)}
                                                    onCheckedChange={(checked) => handleProjectAssignmentChange(item.id, item.typeLabel, p.id, !!checked)}
                                                    disabled={!canWrite}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                 <Collapsible className="mt-6">
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm"><Bug className="mr-2"/> Show Debug Info <ChevronDown className="ml-2"/></Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <pre className="mt-4 text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-96">
                            {JSON.stringify(localCompanyConfig, null, 2)}
                        </pre>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
