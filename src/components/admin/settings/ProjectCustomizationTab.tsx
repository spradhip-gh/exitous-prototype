

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
    const { saveCompanyConfig, companyAssignmentForHr, masterQuestions, masterProfileQuestions } = useUserData();
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
        const config = localCompanyConfig || { customQuestions: {}, companyTasks: [], companyTips: [], resources: [], projectConfigs: {} };
        const allMaster = { ...masterQuestions, ...masterProfileQuestions };
        
        // Only get custom content
        const customQuestions = Object.values(config.customQuestions || {}).map(q => ({ ...q, typeLabel: 'Question' as const, name: q.label, isMaster: false }));
        const tasks = (config.companyTasks || []).map(t => ({ ...t, typeLabel: 'Task' as const, isMaster: false }));
        const tips = (config.companyTips || []).map(t => ({ ...t, typeLabel: 'Tip' as const, name: t.text, isMaster: false }));
        const resources = (config.resources || []).map(r => ({ ...r, typeLabel: 'Resource' as const, name: r.title, isMaster: false }));
        
        const allContent = [...customQuestions, ...tasks, ...tips, ...resources];

        if (auth?.role === 'admin' || !hrManager || !hrManager.projectAccess || hrManager.projectAccess.includes('all')) {
            return allContent;
        }

        const accessibleProjectIds = new Set(hrManager.projectAccess);
        
        return allContent.filter(item => {
            const itemProjectIds = item.projectIds || [];
            if (itemProjectIds.length === 0) {
                return true; // Visible to all, so HR can see it.
            }
            return itemProjectIds.some(id => accessibleProjectIds.has(id));
        });

    }, [localCompanyConfig, auth?.role, hrManager, masterQuestions, masterProfileQuestions]);

    const handleProjectAssignmentChange = (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', isMaster: boolean, projectId: string, isChecked: boolean) => {
        const newConfig = JSON.parse(JSON.stringify(localCompanyConfig));
        
        if(isMaster) { // This block is now unused for master questions but kept for safety
            if (!newConfig.projectConfigs) newConfig.projectConfigs = {};
            if (!newConfig.projectConfigs[projectId]) newConfig.projectConfigs[projectId] = {};
            if (!newConfig.projectConfigs[projectId].hiddenQuestions) newConfig.projectConfigs[projectId].hiddenQuestions = [];
            
            const hiddenSet = new Set(newConfig.projectConfigs[projectId].hiddenQuestions);
            if(isChecked) { 
                hiddenSet.delete(itemId);
            } else { 
                hiddenSet.add(itemId);
            }
            newConfig.projectConfigs[projectId].hiddenQuestions = Array.from(hiddenSet);
        } else { // Handle project assignment for custom content
             let item: any = null;
            switch (itemType) {
                case 'Question': item = newConfig.customQuestions?.[itemId]; break;
                case 'Task': item = (newConfig.companyTasks || []).find((t: MasterTask) => t.id === itemId); break;
                case 'Tip': item = (newConfig.companyTips || []).find((t: MasterTip) => t.id === itemId); break;
                case 'Resource': item = (newConfig.resources || []).find((r: Resource) => r.id === itemId); break;
            }

            if (item) {
                let currentIds = new Set(item.projectIds || []);
                if (isChecked) {
                    currentIds.add(projectId);
                } else {
                    currentIds.delete(projectId);
                }
                item.projectIds = Array.from(currentIds);
            }
        }
        setLocalCompanyConfig(newConfig);
        saveCompanyConfig(companyName, newConfig);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Customization</CardTitle>
                <CardDescription>Manage which custom content is visible to each project. Unchecking all boxes makes an item visible to all projects by default.</CardDescription>
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
                                let isVisibleToAll: boolean;
                                let visibleProjectIds: Set<string>;

                                const itemProjectIds = item.projectIds || [];
                                isVisibleToAll = itemProjectIds.length === 0;
                                visibleProjectIds = new Set(itemProjectIds);
                                
                                const unassignedProjectId = '__none__';

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
                                        <TableCell><Badge variant='secondary'>{`Custom ${item.typeLabel}`}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={isVisibleToAll || visibleProjectIds.has(unassignedProjectId)}
                                                onCheckedChange={(checked) => handleProjectAssignmentChange(item.id, item.typeLabel as any, item.isMaster, unassignedProjectId, !!checked)}
                                                disabled={!canWrite}
                                            />
                                        </TableCell>
                                        {visibleProjects.map(p => (
                                            <TableCell key={p.id} className="text-center">
                                                <Checkbox
                                                    checked={isVisibleToAll || visibleProjectIds.has(p.id)}
                                                    onCheckedChange={(checked) => handleProjectAssignmentChange(item.id, item.typeLabel as any, item.isMaster, p.id, !!checked)}
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
