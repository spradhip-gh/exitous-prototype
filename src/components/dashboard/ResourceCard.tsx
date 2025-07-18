
'use client';

import { useState } from 'react';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, FileWarning, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { summarizeDocument } from '@/ai/flows/summarize-document';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const getMimeType = (dataUri?: string) => {
    if (!dataUri) return '';
    const match = dataUri.match(/data:(.*?);base64,/);
    return match ? match[1] : '';
  };

  const mimeType = getMimeType(resource.content);
  const canBeSummarized = resource.content && (mimeType === 'text/plain' || mimeType === 'application/pdf');

  const handleToggleSummary = async () => {
    // If we're closing it, just hide it.
    if (isSummaryVisible) {
      setIsSummaryVisible(false);
      return;
    }
    
    // If we're opening it, show it.
    setIsSummaryVisible(true);

    // If summary is already loaded, do nothing else.
    if (summary || error) {
      return;
    }

    // If it cannot be summarized, show error and stop.
    if (!canBeSummarized) {
      setError("AI summary is only available for TXT and PDF files.");
      return;
    }

    // If there's no content, stop. This is our definitive guard.
    if (!resource.content || typeof resource.content !== 'string' || resource.content.length === 0) {
      setError("Document content is missing or empty.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await summarizeDocument({
        contentDataUri: resource.content,
        mimeType: mimeType,
      });
      setSummary(result);
    } catch (err: any) {
      console.error("Summarization failed for:", resource.title, err);
      setError(err.message || "An error occurred while generating the summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDownloadUrl = () => {
    return resource.content || '#';
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
        <CardDescription>{resource.description}</CardDescription>
        <p className="text-xs text-muted-foreground pt-1">File: {resource.fileName}</p>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {isSummaryVisible && (
          <div className="p-3 bg-muted/50 rounded-md">
            {isLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating summary...
              </div>
            )}
            {error && (
              <div className="flex items-center text-sm text-destructive">
                 <FileWarning className="h-5 w-5 mr-3 flex-shrink-0" />
                 {error}
              </div>
            )}
            {summary && (
              <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={getDownloadUrl()} download={resource.fileName}>
            <Download className="mr-2" /> Download
          </a>
        </Button>
        <Button variant="secondary" size="sm" onClick={handleToggleSummary} disabled={!canBeSummarized}>
          <Sparkles className="mr-2" />
          {isSummaryVisible ? "Hide" : "Show"} Summary
        </Button>
      </CardFooter>
    </Card>
  );
}
