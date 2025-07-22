export interface ExternalResource {
    id: string;
    name: string;
    description: string;
    category: 'Finances' | 'Legal' | 'Job Search' | 'Well-being';
    website: string;
    imageUrl: string;
    imageHint: string;
    keywords: string[];
}

export const externalResources: ExternalResource[] = [
    // Finances
    {
        id: 'fin-1',
        name: 'Momentum Financial Planning',
        description: 'Certified financial planners specializing in sudden income changes. Get help with budgeting, 401k rollovers, and investment strategies.',
        category: 'Finances',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'financial planning',
        keywords: ['finance', '401k', 'investment', 'budget', 'severance', 'taxes']
    },
    {
        id: 'fin-2',
        name: 'Tax Advisors Inc.',
        description: 'Navigate the complex tax implications of severance packages, stock options, and unemployment benefits with our expert CPAs.',
        category: 'Finances',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'tax document',
        keywords: ['tax', 'cpa', 'severance', 'stock options', 'irs']
    },
    // Legal
    {
        id: 'legal-1',
        name: 'Carter & Associates Legal Group',
        description: 'Employment lawyers ready to review your severance agreement, discuss negotiation options, and ensure your rights are protected.',
        category: 'Legal',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'legal document',
        keywords: ['legal', 'lawyer', 'severance agreement', 'negotiation', 'employment law']
    },
    {
        id: 'legal-2',
        name: 'Visa & Immigration Legal Services',
        description: 'Specialized legal help for individuals on work visas. Understand your options and timelines to maintain your legal status in the U.S.',
        category: 'Legal',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'passport visa',
        keywords: ['visa', 'immigration', 'h1b', 'green card', 'ead']
    },
    // Job Search
    {
        id: 'job-1',
        name: 'CareerLeap Coaching',
        description: 'Expert career coaches who provide personalized resume reviews, interview prep, and job search strategies to land your next role faster.',
        category: 'Job Search',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'career coaching',
        keywords: ['job search', 'resume', 'interview prep', 'career coach', 'linkedin']
    },
    {
        id: 'job-2',
        name: 'Tech Recruiter Connect',
        description: 'A specialized recruiting firm that connects talented tech professionals with innovative companies. Get insider access to top roles.',
        category: 'Job Search',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'tech recruitment',
        keywords: ['recruiter', 'tech job', 'software engineer', 'product manager']
    },
    {
        id: 'job-3',
        name: 'The Professional Network',
        description: 'Build meaningful connections through curated networking events and workshops designed for professionals in transition.',
        category: 'Job Search',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'professional networking',
        keywords: ['networking', 'connections', 'career events']
    },
    // Well-being
    {
        id: 'well-1',
        name: 'Mindful Transitions Therapy',
        description: 'Licensed therapists offering counseling services to help you process the emotional challenges of a job loss and build resilience.',
        category: 'Well-being',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'therapy session',
        keywords: ['therapy', 'mental health', 'counseling', 'stress', 'anxiety', 'resilience']
    },
    {
        id: 'well-2',
        name: 'Thrive Health Insurance Brokers',
        description: 'Navigate the complexities of finding new health coverage. Compare COBRA, ACA marketplace plans, and private options.',
        category: 'Well-being',
        website: '#',
        imageUrl: 'https://placehold.co/600x400.png',
        imageHint: 'health insurance',
        keywords: ['healthcare', 'insurance', 'cobra', 'aca', 'benefits']
    }
];
