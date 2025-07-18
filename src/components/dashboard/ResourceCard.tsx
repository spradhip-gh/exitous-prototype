
'use client';

import { useState } from 'react';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, FileWarning, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';


const MOCK_SUMMARY = `This document provides a comprehensive overview of key details and deadlines. It covers topics such as insurance continuation, severance package details, and available outplacement services. Key actions include reviewing your separation agreement, understanding your benefits timeline, and utilizing the career resources provided.`;

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const summary = MOCK_SUMMARY;
  const isLoading = false;
  const canBeSummarized = resource.content && resource.content.startsWith('data:text/plain');


  const getDownloadUrl = () => {
    if (resource.content?.startsWith('data:')) return resource.content;
    if (resource.filePath) return resource.filePath;
    return '#';
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
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isSummaryOpen && "rotate-180")} />
                  <span className="sr-only">Toggle Summary</span>
                </Button>
              </CollapsibleTrigger>
          </div>
          <Separator className="my-3" />
          <CollapsibleContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2"><div className="h-4 w-full" /><div className="h-4 w-[80%]" /></div>
            ) : canBeSummarized ? (
              <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
            ) : (
              <div className="flex items-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                <FileWarning className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-semibold">Cannot Summarize File</p>
                  <p>AI summary is only available for text files.</p>
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
