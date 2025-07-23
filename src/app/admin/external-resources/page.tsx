
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useUserData } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { ExternalResource } from '@/lib/external-resources';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Pencil, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';


export default function ExternalResourcesAdminPage() {
    const { toast } = useToast();
    const { externalResources, saveExternalResources, isLoading } = useUserData();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<ExternalResource | null>(null);

    const handleAddClick = () => {
        setEditingResource(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (resource: ExternalResource) => {
        setEditingResource(resource);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (resourceId: string) => {
        const updatedResources = externalResources.filter(r => r.id !== resourceId);
        saveExternalResources(updatedResources);
        toast({ title: 'Resource Deleted', description: 'The external resource has been removed.' });
    };

    const handleSave = (resourceData: ExternalResource) => {
        let updatedResources;
        if (editingResource) {
            // Update existing
            updatedResources = externalResources.map(r => r.id === resourceData.id ? resourceData : r);
            toast({ title: 'Resource Updated', description: `${resourceData.name} has been updated.` });
        } else {
            // Add new
            updatedResources = [...externalResources, resourceData];
            toast({ title: 'Resource Added', description: `${resourceData.name} has been added.` });
        }
        saveExternalResources(updatedResources);
        setIsFormOpen(false);
        setEditingResource(null);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="font-headline text-3xl font-bold">External Resources</h1>
                        <p className="text-muted-foreground">
                            Manage the directory of professional services and companies.
                        </p>
                    </div>
                    <Button onClick={handleAddClick}><PlusCircle className="mr-2" /> Add New Resource</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Resource Directory</CardTitle>
                        <CardDescription>The full list of external resources available to users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Availability</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {externalResources.map(resource => (
                                    <TableRow key={resource.id}>
                                        <TableCell className="font-medium">{resource.name}</TableCell>
                                        <TableCell><Badge variant="secondary">{resource.category}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {resource.availability?.includes('basic') && <Badge variant="outline">Basic</Badge>}
                                                {resource.availability?.includes('pro') && <Badge className="bg-green-600">Pro</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {resource.isVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(resource)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the resource "{resource.name}". This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteClick(resource.id)}>Yes, Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <ResourceForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                resource={editingResource}
            />
        </div>
    );
}

function ResourceForm({ isOpen, onOpenChange, onSave, resource }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (resource: ExternalResource) => void;
    resource: ExternalResource | null;
}) {
    const { masterQuestions } = useUserData();
    const [formData, setFormData] = useState<Partial<ExternalResource>>({});

    const allTaskIds = Object.keys(masterQuestions);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof ExternalResource, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleArrayChange = (name: 'keywords' | 'relatedTaskIds', value: string) => {
        const arr = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, [name]: arr }));
    };

    const handleAvailabilityChange = (tier: 'basic' | 'pro', checked: boolean) => {
        setFormData(prev => {
            const currentAvailability = prev.availability || [];
            if (checked) {
                return { ...prev, availability: [...currentAvailability, tier] };
            } else {
                return { ...prev, availability: currentAvailability.filter(t => t !== tier) };
            }
        });
    };

    const handleSwitchChange = (name: 'isVerified', checked: boolean) => {
        setFormData(prev => ({...prev, [name]: checked}));
    };

    const handleSubmit = () => {
        const id = resource?.id || `res-${Date.now()}`;
        if (!formData.name || !formData.category || !formData.description) {
            alert('Name, Category, and Description are required.');
            return;
        }
        if (!formData.availability || formData.availability.length === 0) {
            alert('Please select availability (Basic and/or Pro).');
            return;
        }
        onSave({ ...formData, id } as ExternalResource);
    };
    
    React.useEffect(() => {
        if (resource) {
            setFormData(resource);
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'Finances',
                website: 'https://',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: '',
                keywords: [],
                relatedTaskIds: [],
                isVerified: false,
                availability: ['basic', 'pro'],
                basicOffer: '',
                proOffer: ''
            });
        }
    }, [resource, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{resource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
                    <DialogDescription>Fill in the details for the external resource partner.</DialogDescription>
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Finances">Finances</SelectItem>
                                <SelectItem value="Legal">Legal</SelectItem>
                                <SelectItem value="Job Search">Job Search</SelectItem>
                                <SelectItem value="Well-being">Well-being</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="website">Website URL</Label>
                        <Input id="website" name="website" value={formData.website || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="imageHint">Image Hint (for AI)</Label>
                        <Input id="imageHint" name="imageHint" value={formData.imageHint || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                         <Label>Availability</Label>
                         <div className="flex gap-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="avail-basic" checked={formData.availability?.includes('basic')} onCheckedChange={(c) => handleAvailabilityChange('basic', !!c)} />
                                <Label htmlFor="avail-basic">Basic</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="avail-pro" checked={formData.availability?.includes('pro')} onCheckedChange={(c) => handleAvailabilityChange('pro', !!c)} />
                                <Label htmlFor="avail-pro">Pro</Label>
                            </div>
                         </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="basicOffer">Basic Tier Offer</Label>
                        <Input id="basicOffer" name="basicOffer" value={formData.basicOffer || ''} onChange={handleInputChange} placeholder="e.g., Free 15-min consultation" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="proOffer">Pro Tier Offer</Label>
                        <Input id="proOffer" name="proOffer" value={formData.proOffer || ''} onChange={handleInputChange} placeholder="e.g., 15% off first service"/>
                    </div>
                    
                     <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                        <Input id="keywords" name="keywords" value={formData.keywords?.join(', ') || ''} onChange={(e) => handleArrayChange('keywords', e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="relatedTaskIds">Related Task IDs (comma-separated)</Label>
                        <Textarea id="relatedTaskIds" name="relatedTaskIds" value={formData.relatedTaskIds?.join(', ') || ''} onChange={(e) => handleArrayChange('relatedTaskIds', e.target.value)} />
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="isVerified" name="isVerified" checked={formData.isVerified} onCheckedChange={(c) => handleSwitchChange('isVerified', c)} />
                        <Label htmlFor="isVerified">Exitous Verified Partner</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Resource</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

