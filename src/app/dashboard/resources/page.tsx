
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserData, Resource } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Library, Briefcase, FileText, Star } from 'lucide-react';

const categoryIcons: { [key in Resource['category']]: React.ElementType } = {
  Benefits: Briefcase,
  Policies: FileText,
  Career: Star,
  Other: Library
};

export default function ResourcesPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs } = useUserData();

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
                      <div key={resource.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                        <div>
                          <h3 className="font-semibold">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">File: {resource.fileName}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/resources/${resource.fileName}`} download>
                            <Download className="mr-2" /> Download
                          </a>
                        </Button>
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
  );
}
