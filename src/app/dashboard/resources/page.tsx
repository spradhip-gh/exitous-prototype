
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, Resource } from '@/hooks/use-user-data';
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Library, Briefcase, FileText, Star, Sparkles, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle } from '@/components/ui/alert';


const categoryIcons: { [key in Resource['category']]: React.ElementType } = {
  Benefits: Briefcase,
  Policies: FileText,
  Career: Star,
  Other: Library
};

export default function ResourcesPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs } = useUserData();

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const companyConfig = auth?.companyName ? getAllCompanyConfigs()[auth.companyName] : undefined;
  const resources = companyConfig?.resources || [];

  const categorizedResources = useMemo(() => {
    const categories: Record<Resource['category'], Resource[]> = {
      Benefits: [],
      Policies: [],
      Career: [],
      Other: [],
    };
    resources.forEach(resource => {
      categories[resource.category].push(resource);
    });
    return Object.entries(categories).filter(([, resources]) => resources.length > 0);
  }, [resources]);

  const handleSummarize = async (resource: Resource) => {
    if (!resource.content) {
      setSummaryTitle(resource.title);
      setSummaryError("This document does not have content available for summarization.");
      setIsSummaryOpen(true);
      return;
    }

    setIsSummarizing(true);
    setSummaryTitle(resource.title);
    setSummaryError('');
    setSummaryContent('');
    setIsSummaryOpen(true);

    try {
      const summary = await summarizeDocument(resource.content);
      setSummaryContent(summary);
    } catch (error) {
      console.error("Summarization failed:", error);
      setSummaryError("Sorry, we couldn't generate a summary for this document at the moment. Please try again later.");
    } finally {
      setIsSummarizing(false);
    }
  };


  if (resources.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="font-headline text-3xl font-bold">Company Resources</h1>
            <p className="text-muted-foreground">
              Helpful documents and links provided by your company.
            </p>
          </div>
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Library className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Resources Available</h2>
            <p className="text-muted-foreground mt-2">Your company has not uploaded any resources yet. Please check back later.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="font-headline text-3xl font-bold">Company Resources</h1>
            <p className="text-muted-foreground">
              Helpful documents and links provided by {auth?.companyName}.
            </p>
          </div>

          <Tabs defaultValue={categorizedResources[0]?.[0] || 'All'} className="w-full">
            <TabsList>
              {categorizedResources.map(([category]) => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
              ))}
            </TabsList>
            {categorizedResources.map(([category, resources]) => {
              const Icon = categoryIcons[category];
              return (
                <TabsContent key={category} value={category}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Icon /> {category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resources.map(resource => (
                        <div key={resource.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 rounded-lg border p-4">
                          <div className="flex-1">
                            <h3 className="font-semibold">{resource.title}</h3>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">File: {resource.fileName}</p>
                          </div>
                          <div className="flex gap-2 self-start sm:self-center">
                            <Button variant="secondary" size="sm" onClick={() => handleSummarize(resource)}>
                                <Sparkles className="mr-2" /> Summarize
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/resources/${resource.fileName}`} download>
                                <Download className="mr-2" /> Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
      <AlertDialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Summary for: {summaryTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              This is an AI-generated summary. For official details, please refer to the original document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
              {isSummarizing && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {summaryError && (
                 <Alert variant="destructive">
                    <AlertTitle>{summaryError}</AlertTitle>
                  </Alert>
              )}
              {!isSummarizing && summaryContent && (
                <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summaryContent.replace(/\n/g, '<br />') }} />
              )}
          </div>
           <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
