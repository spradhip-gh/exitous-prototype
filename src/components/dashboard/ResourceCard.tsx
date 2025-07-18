'use client';

import { useState, useEffect } from 'react';
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Download, Sparkles, Terminal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // This effect now depends on resource.content.
    // It will only run when resource.content has a valid value.
    if (!resource.content || typeof resource.content !== 'string' || resource.content.trim() === '') {
      // If content is or becomes invalid, set an error and stop.
      // This handles the initial render case where content might be undefined.
      setError("This document does not have content available for summarization.");
      setIsLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setError('');
        const result = await summarizeDocument(resource.content as string);
        setSummary(result);
      } catch (err) {
        console.error("Summarization failed for:", resource.title, err);
        setError("An error occurred while generating the summary.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [resource.content, resource.title]); // Dependency array ensures this runs when content is available.

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
          {!isLoading && !error && (
             <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <a href={`/resources/${resource.fileName}`} download>
            <Download className="mr-2" /> Download Full Document
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
