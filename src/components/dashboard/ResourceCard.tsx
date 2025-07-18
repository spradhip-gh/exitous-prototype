
'use client';

import { useState, useEffect } from 'react';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, FileWarning, ChevronDown, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { summarizeDocument } from '@/ai/flows/summarize-document';


export default function ResourceCard({ resource }: { resource: Resource }) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getMimeType = (dataUri?: string) => {
    if (!dataUri) return '';
    return dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';'));
  }

  const mimeType = getMimeType(resource.content);
  const canBeSummarized = resource.content && (mimeType === 'text/plain' || mimeType === 'application/pdf');

  useEffect(() => {
    const fetchSummary = async () => {
        // Guard against running if there's no content, it's already loaded, not summarizable, or invalid.
        if (!isSummaryOpen || summary || !canBeSummarized || !resource.content || typeof resource.content !== 'string' || resource.content.length === 0) {
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
    fetchSummary();
  }, [isSummaryOpen, canBeSummarized, resource, summary, mimeType]);


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
      <CardContent className="flex-grow">
        <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                AI Summary
              </h4>
              {canBeSummarized ? (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isSummaryOpen && "rotate-180")} />
                    <span className="sr-only">Toggle Summary</span>
                  </Button>
                </CollapsibleTrigger>
              ) : null}
          </div>
          <Separator className="my-3" />
          <CollapsibleContent className="space-y-4">
             {isLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating summary...
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            {summary && (
              <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
            )}
             {!canBeSummarized && (
                <div className="flex items-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                    <FileWarning className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div>
                    <p className="font-semibold">Cannot Summarize File</p>
                    <p>AI summary is only available for text and PDF files.</p>
                    </div>
                </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <a href={getDownloadUrl()} download={resource.fileName}>
            <Download className="mr-2" /> Download Document
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

    