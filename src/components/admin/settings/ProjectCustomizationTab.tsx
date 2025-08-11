
'use client';
import { useMemo } from 'react';
import { useUserData, CompanyConfig, MasterTask, MasterTip, Resource, Project } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProjectAssignmentPopover } from './ProjectAssignmentPopover';

export default function ProjectCustomizationTab({ companyConfig, companyName, projects, canWrite }: {
    companyConfig: CompanyConfig;
    companyName: string;
    projects: Project[];
    canWrite: boolean;
}) {
    const { saveCompanyConfig } = useUserData();

    const allCustomContent = useMemo(() => {
        const questions = Object.values(companyConfig?.customQuestions || {}).map(q => ({ ...q, typeLabel: 'Question' as const, name: q.label }));
        const tasks = (companyConfig?.companyTasks || []).map(t => ({ ...t, typeLabel: 'Task' as const }));
        const tips = (companyConfig?.companyTips || []).map(t => ({ ...t, typeLabel: 'Tip' as const, name: t.text }));
        const resources = (companyConfig?.resources || []).map(r => ({ ...r, typeLabel: 'Resource' as const, name: r.title }));
        return [...questions, ...tasks, ...tips, ...resources];
    }, [companyConfig]);

    const handleProjectAssignmentSave = (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', projectIds: string[]) => {
        const newConfig = JSON.parse(JSON.stringify(companyConfig));

        switch (itemType) {
            case 'Question':
                if (newConfig.customQuestions?.[itemId]) newConfig.customQuestions[itemId].projectIds = projectIds;
                break;
            case 'Task':
                const task = newConfig.companyTasks?.find((t: MasterTask) => t.id === itemId);
                if (task) task.projectIds = projectIds;
                break;
            case 'Tip':
                const tip = newConfig.companyTips?.find((t: MasterTip) => t.id === itemId);
                if (tip) tip.projectIds = projectIds;
                break;
            case 'Resource':
                const resource = newConfig.resources?.find((r: Resource) => r.id === itemId);
                if (resource) resource.projectIds = projectIds;
                break;
        }
        
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
                        {allCustomContent.map(item => (
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
                                     <ProjectAssignmentPopover
                                        item={item}
                                        projects={projects}
                                        onSave={handleProjectAssignmentSave}
                                        disabled={!canWrite}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
