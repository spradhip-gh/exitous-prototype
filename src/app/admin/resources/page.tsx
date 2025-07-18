
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, Resource } from '@/hooks/use-user-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, UploadCloud, File, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ResourceManagementPage() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const { getAllCompanyConfigs, saveCompanyResources } = useUserData();
  const companyName = auth?.companyName || '';
  const companyConfig = getAllCompanyConfigs()[companyName];
  const resources = companyConfig?.resources || [];

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Resource['category']>('Other');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState(''); // Store as raw text
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // to reset file input

  const handleAddResource = () => {
    if (!newTitle || !newDescription || !newFileName || !newFileContent) {
      toast({ title: "All Fields Required", description: "Please fill out all fields and select a file.", variant: "destructive" });
      return;
    }

    const newResource: Resource = {
      id: `${companyName}-resource-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      fileName: newFileName,
      category: newCategory,
      content: newFileContent,
    };
    
    saveCompanyResources(companyName, [...resources, newResource]);
    
    toast({ title: "Resource Added", description: `${newTitle} has been added.` });
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Other');
    setNewFileName('');
    setNewFileContent('');
    setFileInputKey(Date.now()); // Reset file input visually
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFileName(file.name);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (typeof result === 'string') {
           // For text files, store raw text. For others (like PDF), we'd need a different strategy
           // but for this app's purpose, we'll assume text for simplicity of summarization.
          setNewFileContent(result);
        } else {
          toast({ title: "File Read Error", description: "Could not read file content.", variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: "File Read Error", description: "An error occurred while reading the file.", variant: "destructive" });
      };
       // Reading as text. For binary files like PDF, this would be readAsDataURL and handled differently.
      reader.readAsText(file);
    }
  };

  const handleDeleteResource = (resourceId: string) => {
    const updatedResources = resources.filter(r => r.id !== resourceId);
    saveCompanyResources(companyName, updatedResources);
    toast({ title: "Resource Removed", description: "The resource has been deleted." });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground">
            Upload and manage company-specific documents for your employees.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Resource</CardTitle>
            <CardDescription>Upload a new document to be shared with your employees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Resource Title</Label>
                <Input id="title" placeholder="e.g., 2024 Benefits Guide" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Benefits">Benefits</SelectItem>
                    <SelectItem value="Policies">Policies</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A brief summary of what this document contains." value={newDescription} onChange={e => setNewDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
              <div className="flex items-center gap-4">
                <Input id="file-upload" type="file" key={fileInputKey} onChange={handleFileChange} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                    <UploadCloud className="mr-2"/> Choose File
                </Button>
                {newFileName && <div className="flex items-center gap-2 text-sm text-muted-foreground"><File className="h-4 w-4"/><span>{newFileName}</span></div>}
              </div>
            </div>
            <Button onClick={handleAddResource}>
              <PlusCircle className="mr-2" /> Add Resource
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Resources</CardTitle>
            <CardDescription>List of all resources available to your employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.length > 0 ? resources.map(resource => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell>{resource.category}</TableCell>
                    <TableCell>{resource.fileName}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the resource "{resource.title}". This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteResource(resource.id)}>
                                      Yes, Delete
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No resources have been uploaded yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
