
'use client';

import { useState } from 'react';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, FileWarning, Loader2 } from 'lucide-react';
import { summarizeDocument } from '@/ai/flows/summarize-document';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const getMimeType = (fileName: string): 'text/plain' | 'application/pdf' | 'unsupported' => {
    if (fileName.toLowerCase().endsWith('.pdf')) return 'application/pdf';
    if (fileName.toLowerCase().endsWith('.txt')) return 'text/plain';
    return 'unsupported';
  };

  const mimeType = getMimeType(resource.fileName);
  const canBeSummarized = resource.content && mimeType !== 'unsupported';

  const handleToggleSummary = async () => {
    if (isSummaryVisible) {
      setIsSummaryVisible(false);
      return;
    }
    
    setIsSummaryVisible(true);

    if (summary || error || !canBeSummarized) {
      return;
    }

    // Definitive guard to prevent calling AI with invalid data.
    if (!resource.content || typeof resource.content !== 'string' || resource.content.trim() === '') {
        setError("Document content is empty or unavailable.");
        return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Encode the content to a data URI on the client, right before sending.
      const contentDataUri = `data:${mimeType};base64,${btoa(resource.content)}`;

      const result = await summarizeDocument({
        contentDataUri: contentDataUri,
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
    if (!resource.content) return '#';
    const blob = new Blob([resource.content], { type: mimeType });
    return URL.createObjectURL(blob);
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
             {!canBeSummarized && (
              <div className="flex items-center text-sm text-muted-foreground">
                <FileWarning className="h-5 w-5 mr-3 flex-shrink-0" />
                AI summary is not available for this file type.
              </div>
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
        <Button variant="secondary" size="sm" onClick={handleToggleSummary}>
          <Sparkles className="mr-2" />
          {isSummaryVisible ? "Hide" : "Show"} Summary
        </Button>
      </CardFooter>
    </Card>
  );
}
