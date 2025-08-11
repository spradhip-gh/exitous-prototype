

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
import { useAuth } from '@/hooks/use-auth';

export default function ProjectCustomizationTab({ companyConfig, companyName, projects, canWrite }: {
    companyConfig: CompanyConfig;
    companyName: string;
    projects: Project[];
    canWrite: boolean;
}) {
    const { auth } = useAuth();
    const { saveCompanyConfig, companyAssignmentForHr } = useUserData();
    const [localCompanyConfig, setLocalCompanyConfig] = useState(companyConfig);

    useEffect(() => {
        setLocalCompanyConfig(companyConfig);
    }, [companyConfig]);

    const hrManager = useMemo(() => {
      if (!auth?.email || !companyAssignmentForHr) return null;
      return companyAssignmentForHr.hrManagers.find(hr => hr.email === auth.email);
    }, [auth?.email, companyAssignmentForHr]);
  
    const visibleProjects = useMemo(() => {
      if (auth?.role === 'admin' || !hrManager || !hrManager.projectAccess || hrManager.projectAccess.includes('all')) {
          return projects;
      }
      const accessibleProjectIds = new Set(hrManager.projectAccess);
      return projects.filter(p => accessibleProjectIds.has(p.id));
    }, [projects, hrManager, auth?.role]);

    const allCustomContent = useMemo(() => {
        const config = localCompanyConfig || { customQuestions: {}, companyTasks: [], companyTips: [], resources: [] };
        const questions = Object.values(config.customQuestions || {}).map(q => ({ ...q, typeLabel: 'Question' as const, name: q.label }));
        const tasks = (config.companyTasks || []).map(t => ({ ...t, typeLabel: 'Task' as const }));
        const tips = (config.companyTips || []).map(t => ({ ...t, typeLabel: 'Tip' as const, name: t.text }));
        const resources = (config.resources || []).map(r => ({ ...r, typeLabel: 'Resource' as const, name: r.title }));
        
        const allContent = [...questions, ...tasks, ...tips, ...resources];

        if (auth?.role === 'admin' || !hrManager || !hrManager.projectAccess || hrManager.projectAccess.includes('all')) {
            return allContent;
        }

        const accessibleProjectIds = new Set(hrManager.projectAccess);
        
        return allContent.filter(item => {
            const itemProjectIds = item.projectIds || [];
            if (itemProjectIds.length === 0) {
                return true; // Visible to all, so HR can see it.
            }
            // Check if there is at least one intersection between the item's projects and the HR's accessible projects.
            return itemProjectIds.some(id => accessibleProjectIds.has(id));
        });

    }, [localCompanyConfig, auth?.role, hrManager]);

    const handleProjectAssignmentChange = (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', projectId: string, isChecked: boolean) => {
        const newConfig = JSON.parse(JSON.stringify(localCompanyConfig));
        
        let item: any = null;

        switch (itemType) {
            case 'Question': item = newConfig.customQuestions?.[itemId]; break;
            case 'Task': item = (newConfig.companyTasks || []).find((t: MasterTask) => t.id === itemId); break;
            case 'Tip': item = (newConfig.companyTips || []).find((t: MasterTip) => t.id === itemId); break;
            case 'Resource': item = (newConfig.resources || []).find((r: Resource) => r.id === itemId); break;
        }

        if (item) {
            const currentIds = new Set(item.projectIds || []);
            const wasVisibleToAll = currentIds.size === 0;

            if (isChecked) {
                if (wasVisibleToAll) {
                    currentIds.add(projectId);
                } else {
                    currentIds.add(projectId);
                }
            } else {
                if (wasVisibleToAll) {
                    // Unchecking from "All Projects" means selecting all OTHER projects
                    projects.forEach(p => {
                        if (p.id !== projectId) currentIds.add(p.id);
                    });
                    if (projects.some(p => p.id === '__none__')) currentIds.add('__none__');

                } else {
                    currentIds.delete(projectId);
                }
            }

            const newProjectIds = Array.from(currentIds);

            // If all projects are selected, revert to an empty array (meaning "All")
            const allProjectIds = new Set(projects.map(p => p.id));
            if (projects.some(p => p.id === '__none__')) allProjectIds.add('__none__');
            
            if (newProjectIds.length === allProjectIds.size) {
                 item.projectIds = [];
            } else {
                 item.projectIds = newProjectIds;
            }
        }


        setLocalCompanyConfig(newConfig);
        saveCompanyConfig(companyName, newConfig);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Customization</CardTitle>
                <CardDescription>Manage which custom questions, tasks, tips, and resources are visible to each project. Unchecking all boxes makes the item visible to all projects.</CardDescription>
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
                                {visibleProjects.map(p => (
                                    <TableHead key={p.id} className="text-center">{p.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCustomContent.map(item => {
                                const projectIds = item.projectIds || [];
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
                                        {visibleProjects.map(p => (
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
                             {JSON.stringify({
                                customQuestions: localCompanyConfig?.customQuestions,
                                companyTasks: localCompanyConfig?.companyTasks,
                                companyTips: localCompanyConfig?.companyTips,
                                resources: localCompanyConfig?.resources,
                            }, null, 2)}
                        </pre>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
