
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Library, ArrowLeft, ArrowRight, LifeBuoy } from 'lucide-react';
import ResourceCard from '@/components/dashboard/ResourceCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useMemo } from 'react';
import { isPast, parse } from 'date-fns';

function ContactAliasCard() {
    const { auth } = useAuth();
    const { companyAssignments, getCompanyUser, assessmentData } = useUserData();

    const companyUser = useMemo(() => auth?.email && !auth.isPreview ? getCompanyUser(auth.email) : null, [auth?.email, auth?.isPreview, getCompanyUser]);
    const companyAssignment = useMemo(() => {
        const companyName = auth?.companyName;
        if (!companyName) return null;
        return companyAssignments.find(c => c.companyName === companyName) || null;
    }, [auth?.companyName, companyAssignments]);

    const finalDayString = assessmentData?.finalDate;
    
    let isPostLayoff = false;
    if (finalDayString) {
      try {
        const finalDate = (finalDayString instanceof Date) ? finalDayString : parse(finalDayString, 'yyyy-MM-dd', new Date());
        isPostLayoff = isPast(finalDate);
      } catch (e) {
        console.error("Could not parse final day for alias logic", e);
      }
    }
    
    const userOverrides = companyUser?.user.prefilledAssessmentData;

    const contactAlias = isPostLayoff
      ? userOverrides?.postLayoffContactAlias || companyAssignment?.postLayoffContactAlias
      : userOverrides?.preLayoffContactAlias || companyAssignment?.preLayoffContactAlias;
    
    const contactTitle = isPostLayoff ? "Post-Layoff Support" : "Pre-Layoff Support";
      
    if (!contactAlias) {
      return null;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                        <LifeBuoy className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle>{contactTitle}</CardTitle>
                        <CardDescription>Your primary point of contact.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-semibold text-primary">{contactAlias}</p>
            </CardContent>
        </Card>
    );
}

export default function ResourcesPage() {
  const { auth } = useAuth();
  const { getAllCompanyConfigs } = useUserData();

  const companyConfig = auth?.companyName ? getAllCompanyConfigs()[auth.companyName] : undefined;
  const resources = companyConfig?.resources || [];

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold">Company Resources</h1>
          <p className="text-muted-foreground">
            Helpful documents and links provided by {auth?.companyName}.
          </p>
        </div>

        <ContactAliasCard />
        
        {resources.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Library className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Additional Resources</h2>
            <p className="text-muted-foreground mt-2">Your company has not uploaded any other resources yet. Please check back later.</p>
          </Card>
        )}

        {resources.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
