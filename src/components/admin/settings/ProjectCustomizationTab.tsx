
'use client';
import { useMemo, useState } from 'react';
import { useUserData, CompanyConfig, MasterTask, MasterTip, Resource, Project, Question } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function ManageVisibilityDialog({ 
    item, 
    projects, 
    open, 
    onOpenChange,
    onSave 
}: { 
    item: (Partial<Question | MasterTask | MasterTip | Resource> & { id: string, typeLabel: 'Question' | 'Task' | 'Tip' | 'Resource', name: string, projectIds?: string[] }) | null;
    projects: Project[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (itemId: string, itemType: 'Question' | 'Task' | 'Tip' | 'Resource', projectIds: string[]) => void;
}) {
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

    React.useEffect(() => {
        if (item) {
            setSelectedProjectIds(item.projectIds || []);
        }
    }, [item]);

    const handleSave = () => {
        if (!item) return;
        onSave(item.id, item.typeLabel, selectedProjectIds);
        onOpenChange(false);
    };

    const handleCheckboxChange = (projectId: string, isChecked: boolean) => {
        setSelectedProjectIds(prev => {
            if (isChecked) {
                return [...prev, projectId];
            } else {
                return prev.filter(id => id !== projectId);
            }
        });
    };
    
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Visibility for "{item.name}"</DialogTitle>
                    <DialogDescription>Select which projects this {item.typeLabel.toLowerCase()} should be visible to. Leave all unchecked to make it visible to all users.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="__none__-checkbox"
                            checked={selectedProjectIds.includes('__none__')}
                            onCheckedChange={(checked) => handleCheckboxChange('__none__', !!checked)}
                        />
                        <Label htmlFor="__none__-checkbox" className="font-normal italic">Unassigned Users</Label>
                    </div>
                    {projects.map(p => (
                         <div key={p.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={p.id}
                                checked={selectedProjectIds.includes(p.id)}
                                onCheckedChange={(checked) => handleCheckboxChange(p.id, !!checked)}
                            />
                            <Label htmlFor={p.id} className="font-normal">{p.name}</Label>
                        </div>
                    ))}
                </div>
                 <div className="p-2 border-t mt-1 bg-muted">
                    <h4 className="text-xs font-bold">Debug Info</h4>
                    <pre className="text-[10px] whitespace-pre-wrap break-all">
                        {JSON.stringify({
                            item: {id: item.id, name: item.name},
                            projects: projects.map(p => p.name),
                            selectedIds: selectedProjectIds,
                        }, null, 2)}
                    </pre>
                </div>
                <DialogFooter>
                     <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Visibility</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ProjectCustomizationTab({ companyConfig, companyName, projects, canWrite }: {
    companyConfig: CompanyConfig;
    companyName: string;
    projects: Project[];
    canWrite: boolean;
}) {
    const { saveCompanyConfig } = useUserData();
    const [editingItem, setEditingItem] = useState<(Partial<Question | MasterTask | MasterTip | Resource> & { id: string, typeLabel: 'Question' | 'Task' | 'Tip' | 'Resource', name: string, projectIds?: string[] }) | null>(null);

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

    const getVisibilityText = (projectIds: string[] | undefined) => {
        if (!projectIds || projectIds.length === 0) {
            return <Badge variant="secondary">All Users</Badge>;
        }
        const hasUnassigned = projectIds.includes('__none__');
        const assignedProjectCount = projectIds.filter(id => id !== '__none__').length;
        
        const parts = [];
        if (assignedProjectCount > 0) parts.push(`${assignedProjectCount} Project${assignedProjectCount > 1 ? 's' : ''}`);
        if (hasUnassigned) parts.push("Unassigned Users");
        
        return <Badge variant="outline">{parts.join(' + ')}</Badge>;
    }

    return (
        <>
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
                                <TableHead className="text-right">Actions</TableHead>
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
                                    <TableCell>{getVisibilityText(item.projectIds)}</TableCell>
                                    <TableCell className="text-right">
                                         <Button variant="outline" size="sm" onClick={() => setEditingItem(item)} disabled={!canWrite}>
                                            <Pencil className="mr-2 h-4 w-4" /> Manage
                                         </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <ManageVisibilityDialog
                item={editingItem}
                projects={projects}
                open={!!editingItem}
                onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
                onSave={handleProjectAssignmentSave}
            />
        </>
    );
}
