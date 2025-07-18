
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card } from '@/components/ui/card';
import { Library, ArrowLeft, ArrowRight } from 'lucide-react';
import ResourceCard from '@/components/dashboard/ResourceCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

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
            {resources.map((resource, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <ResourceCard resource={resource} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </div>
  );
}
