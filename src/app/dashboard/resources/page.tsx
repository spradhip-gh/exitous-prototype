
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { Library, Download, Briefcase, FileText, Star } from 'lucide-react';

export default function ResourcesPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs } = useUserData();

  const companyConfig = auth?.companyName ? getAllCompanyConfigs()[auth.companyName] : undefined;
  const resources = companyConfig?.resources || [];

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

  const categoryIcons = {
    Benefits: Briefcase,
    Policies: FileText,
    Career: Star,
    Other: Library
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Company Resources</h1>
          <p className="text-muted-foreground">
            Helpful documents and links provided by {auth?.companyName}.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {resources.map((resource, index) => {
               const Icon = categoryIcons[resource.category] || Library;
               return (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="flex flex-col h-full">
                      <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Icon className="h-5 w-5"/>
                            <span className="font-semibold">{resource.category}</span>
                        </div>
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-xs text-muted-foreground pt-1">File: {resource.fileName}</p>
                      </CardContent>
                      <CardFooter>
                         <Button variant="outline" size="sm" asChild>
                            <a href={`/resources/${resource.fileName}`} download>
                                <Download className="mr-2" /> Download Document
                            </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}
