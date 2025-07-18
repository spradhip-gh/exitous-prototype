
'use client';

import { useState, useEffect } from 'react';
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Download, Sparkles, Terminal, FileWarning } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canBeSummarized = resource.content && typeof resource.content === 'string' && resource.content.trim() !== '';

  useEffect(() => {
    // This guard prevents calling the flow with invalid data.
    if (!canBeSummarized) {
      return;
    }

    const fetchSummary = async () => {
      setIsLoading(true);
      setError('');
      try {
        let textContent: string | null = null;
        
        // Handle Base64 encoded text files from HR uploads
        if (resource.content?.startsWith('data:text/plain;base64,')) {
            const base64Content = resource.content.split(',')[1];
            textContent = atob(base64Content);
        } else if (!resource.content?.startsWith('data:')) {
            // Handle raw text content from demo-data
            textContent = resource.content;
        }

        if (textContent) {
          const result = await summarizeDocument(textContent);
          setSummary(result);
        } else {
          // This handles cases where content might be a non-text data URI
          throw new Error("Cannot summarize non-text files.");
        }

      } catch (err: any) {
        console.error("Summarization failed for:", resource.title, err);
        setError(err.message || "An error occurred while generating the summary.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [resource.content, resource.title, canBeSummarized]);

  const getDownloadUrl = () => {
    // If filePath exists, it's a file in /public.
    if (resource.filePath) return resource.filePath;
    // If content exists and it's a data URI, it's an uploaded file.
    if (resource.content?.startsWith('data:')) return resource.content;
    // Fallback if something is wrong.
    return '#';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
        <CardDescription>{resource.description}</CardDescription>
        <p className="text-xs text-muted-foreground pt-1">File: {resource.fileName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold mb-2 text-primary">
            <Sparkles className="h-4 w-4" />
            AI Summary
          </h4>
          <Separator className="mb-3" />
          {isLoading && <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[80%]" /></div>}
          {error && <Alert variant="destructive" className="text-xs"><Terminal className="h-4 w-4" /><AlertTitle>{error}</AlertTitle></Alert>}
          
          {!isLoading && !error && canBeSummarized && summary && (
             <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
          )}
           
           {!canBeSummarized && (
            <div className="flex items-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
              <FileWarning className="h-5 w-5 mr-3" />
              <div>
                <p className="font-semibold">Cannot Summarize File</p>
                <p>AI summary is only available for text files.</p>
              </div>
            </div>
          )}

        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <a href={getDownloadUrl()} download={resource.fileName}>
            <Download className="mr-2" /> Download Full Document
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
