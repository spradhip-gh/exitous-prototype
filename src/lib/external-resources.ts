export interface ExternalResource {
    id: string;
    name: string;
    description: string;
    category: 'Finances' | 'Legal' | 'Job Search' | 'Well-being';
    website: string;
    imageUrl: string;
    imageHint: string;
    keywords: string[];
    relatedTaskIds?: string[];
    isVerified?: boolean;
    specialOffer?: string;
}
