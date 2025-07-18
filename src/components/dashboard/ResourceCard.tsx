
'use client';

import { useState } from 'react';
import { Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const getMimeType = (fileName: string): 'text/plain' | 'application/pdf' | 'unsupported' => {
    if (fileName.toLowerCase().endsWith('.pdf')) return 'application/pdf';
    if (fileName.toLowerCase().endsWith('.txt')) return 'text/plain';
    return 'unsupported';
  };

  const mimeType = getMimeType(resource.fileName);

  const handleToggleSummary = () => {
    setIsSummaryVisible(!isSummaryVisible);
  };

  const getDownloadUrl = () => {
    if (!resource.content) return '#';
    try {
        const blob = new Blob([resource.content], { type: mimeType });
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("Error creating download URL:", e);
        return '#';
    }
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
            <p className="text-sm text-muted-foreground italic">This is where an AI summary would show.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={getDownloadUrl()} download={resource.fileName}>
                <Download className="mr-2" /> Download
              </a>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleToggleSummary}>
              <Sparkles className="mr-2" />
              {isSummaryVisible ? "Hide Summary" : "Show Summary"}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
