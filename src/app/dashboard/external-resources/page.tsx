
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { findExpertMatches, type ExpertMatchOutput, type ExpertMatchInput } from '@/ai/flows/find-expert-matches';
import { useUserData, type ExternalResource } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { Sparkles, Search, ExternalLink, Terminal, CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';

const categories = ["Finances", "Legal", "Career", "Well-being"];

const ResourceCard = ({ resource, companyVersion }: { resource: ExternalResource; companyVersion: 'basic' | 'pro' }) => {
    const offerText = companyVersion === 'pro' ? resource.proOffer : resource.basicOffer;
    
    return (
        <Card className="flex flex-col h-full overflow-hidden shadow-lg transition-transform hover:scale-105 group">
            <div className="relative h-40 w-full">
                <Image
                    src={resource.imageUrl}
                    alt={resource.name}
                    fill
                    className="object-cover"
                    data-ai-hint={resource.imageHint}
                />
                {resource.isVerified && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                        <CheckCircle className="mr-1.5" /> Exitous Verified
                    </Badge>
                )}
            </div>
            <CardHeader>
                <CardTitle>{resource.name}</CardTitle>
                <Badge variant="secondary" className="w-fit">{resource.category}</Badge>
            </CardHeader>
            <CardContent className="flex-grow">
                {offerText && (
                    <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/20 text-sm text-primary-foreground">
                        <p className="font-bold flex items-center gap-1.5 text-primary"><Star className="fill-current"/> Special Offer</p>
                        <p className="text-primary/90">{offerText}</p>
                    </div>
                )}
                <p className="text-sm text-muted-foreground">{resource.description}</p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" asChild>
                    <a href={resource.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2" /> Learn More
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
};

function ExternalResourcesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCategory = searchParams.get('category');
    const { auth } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(preselectedCategory);
    const [matches, setMatches] = useState<ExpertMatchOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { profileData, assessmentData, externalResources, companyAssignments } = useUserData();

    const companyVersion = useMemo(() => {
        if (!auth?.companyName) return 'basic';
        return companyAssignments.find(c => c.companyName === auth.companyName)?.version || 'basic';
    }, [auth, companyAssignments]);

    useEffect(() => {
        const fetchMatches = async () => {
            if (!profileData || !assessmentData) {
                setIsLoading(false);
                return;
            }
            try {
                const transformedProfileData = {
                    ...profileData,
                    hasChildrenUnder13: String(profileData.hasChildrenUnder13).startsWith('Yes'),
                    hasExpectedChildren: String(profileData.hasExpectedChildren).startsWith('Yes'),
                    hasChildrenAges18To26: String(profileData.hasChildrenAges18To26).startsWith('Yes'),
                };
                
                const stringifiedAssessmentData: Record<string, any> = {};
                Object.keys(assessmentData).forEach(key => {
                    const value = (assessmentData as any)[key];
                    if (value instanceof Date) {
                        stringifiedAssessmentData[key] = value.toISOString();
                    } else if (typeof value === 'string' || typeof value === 'boolean' || Array.isArray(value)) {
                        stringifiedAssessmentData[key] = value;
                    }
                });


                const result = await findExpertMatches({
                    profileData: transformedProfileData,
                    layoffDetails: stringifiedAssessmentData,
                } as ExpertMatchInput);
                setMatches(result);
            } catch (e) {
                console.error(e);
                setError("Could not fetch personalized matches. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatches();
    }, [profileData, assessmentData]);

    const filteredResources = useMemo(() => {
        return externalResources.filter(resource => {
            const isAvailableForTier = resource.availability?.includes(companyVersion);
            if (!isAvailableForTier) return false;

            const matchesCategory = selectedCategory ? resource.category === selectedCategory : true;
            const matchesSearch = searchTerm ? 
                resource.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
                : true;
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory, externalResources, companyVersion]);

    const matchedResources = useMemo(() => {
        if (!matches) return [];
        const matchedIds = new Set(matches.matches.map(m => m.resourceId));
        return externalResources.filter(r => matchedIds.has(r.id) && r.availability?.includes(companyVersion));
    }, [matches, externalResources, companyVersion]);

    const handleCategoryClick = (category: string | null) => {
        setSelectedCategory(category);
        // Clear category from URL when a new one is selected
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete('category');
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.replace(`/dashboard/external-resources${query}`);
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="font-headline text-3xl font-bold">External Resources</h1>
                    <p className="text-muted-foreground">
                        Connect with trusted professionals and companies that can help you navigate your next steps.
                    </p>
                </div>
                
                {isLoading && (
                    <Card>
                        <CardHeader>
                           <Skeleton className="h-8 w-1/3" />
                           <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {!isLoading && !error && matchedResources.length > 0 && (
                     <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="text-primary" />
                                Your Top Matches
                            </CardTitle>
                            <CardDescription>
                                Based on your profile and assessment, these resources are likely to be the most helpful for you right now.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {matchedResources.map(resource => (
                                <ResourceCard key={resource.id} resource={resource} companyVersion={companyVersion} />
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                     <div>
                        <h2 className="font-headline text-2xl font-bold">Browse All Resources</h2>
                        <p className="text-muted-foreground">Search our full directory of partners.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or keyword (e.g., 'resume', '401k')"
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button variant={!selectedCategory ? 'default' : 'outline'} onClick={() => handleCategoryClick(null)}>All</Button>
                            {categories.map(cat => (
                                <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} onClick={() => handleCategoryClick(cat)}>
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredResources.map(resource => (
                            <ResourceCard key={resource.id} resource={resource} companyVersion={companyVersion} />
                        ))}
                    </div>

                    {filteredResources.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>No resources found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ExternalResourcesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ExternalResourcesContent />
        </Suspense>
    );
}
