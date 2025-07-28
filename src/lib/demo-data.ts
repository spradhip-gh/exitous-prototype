
import type { CompanyAssignment, CompanyConfig, PlatformUser, Resource, ReviewQueueItem, MasterTask, TaskMapping, GuidanceRule, MasterTip, TipMapping } from '@/hooks/use-user-data';
import { getDefaultQuestions, getDefaultProfileQuestions, type Question } from './questions';
import type { ProfileData, AssessmentData } from './schemas';
import type { ExternalResource } from './external-resources';
import { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';

// This file acts as a persistent in-memory "database" for the demo.
// By attaching the data to the global object, it persists across hot-reloads
// in development, simulating a real database more closely. This ensures that
// changes like adding custom questions are not lost on page refresh.

interface DemoDatabase {
    companyAssignments: CompanyAssignment[];
    companyConfigs: Record<string, CompanyConfig>;
    platformUsers: PlatformUser[];
    masterQuestions: Record<string, Question>;
    masterProfileQuestions: Record<string, Question>;
    profileCompletions: Record<string, boolean>;
    assessmentCompletions: Record<string, boolean>;
    reviewQueue: ReviewQueueItem[];
    // --- Seeded localStorage data for specific demo users ---
    seededData: Record<string, { profile: ProfileData; assessment: Partial<AssessmentData> }>;
    externalResources: ExternalResource[];
    masterTasks: MasterTask[];
    taskMappings: TaskMapping[];
    guidanceRules: GuidanceRule[];
    masterTips: MasterTip[];
    tipMappings: TipMapping[];
}

// Augment the global type to include our custom property
declare global {
  // eslint-disable-next-line no-var
  var __demo_db__: DemoDatabase | undefined;
}

const initializeQuestions = (getQuestionsFn: () => Question[]): Record<string, Question> => {
    const defaultQuestions = getQuestionsFn();
    const flatMap: Record<string, Question> = {};

    const processQuestions = (questions: Question[]) => {
        questions.forEach(q => {
            const { subQuestions, ...questionData } = q;
            flatMap[questionData.id] = { ...questionData, lastUpdated: new Date().toISOString() };
            if (subQuestions) {
                processQuestions(subQuestions);
            }
        });
    };

    processQuestions(defaultQuestions);
    return flatMap;
};

const getFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

const getPastDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

const getSpecificDate = (month: number, day: number) => {
    const date = new Date();
    date.setMonth(month - 1, day); // month is 0-indexed
    return date.toISOString().split('T')[0];
}


const initializeDb = (): DemoDatabase => {
    const defaultPermissions = {
        userManagement: 'read' as const,
        formEditor: 'read' as const,
        resources: 'read' as const,
        companySettings: 'read' as const,
    };

    return {
        companyAssignments: [
            { 
                companyName: 'Globex Corp', 
                hrManagers: [
                    { email: 'hr@globex.com', isPrimary: true, permissions: { userManagement: 'write-upload', formEditor: 'write', resources: 'write', companySettings: 'read' } },
                    { email: 'testnewhr@globex.com', isPrimary: false, permissions: { userManagement: 'invite-only', formEditor: 'read', resources: 'read', companySettings: 'read' }}
                ], 
                version: 'pro', 
                maxUsers: 50,
                severanceDeadlineTime: '23:59',
                severanceDeadlineTimezone: 'America/Los_Angeles',
                preEndDateContactAlias: 'hr@globex.com',
                postEndDateContactAlias: 'alumni-support@globex.com',
            },
            { 
                companyName: 'Initech', 
                hrManagers: [{ email: 'hr@initech.com', isPrimary: true, permissions: { userManagement: 'write-upload', formEditor: 'write', resources: 'write', companySettings: 'read' } }],
                version: 'basic', 
                maxUsers: 10,
                severanceDeadlineTime: '17:00',
                severanceDeadlineTimezone: 'America/Chicago',
                preEndDateContactAlias: 'hr@initech.com',
                postEndDateContactAlias: 'alumni-support@initech.com',
            },
            { 
                companyName: 'Globex Software', 
                hrManagers: [
                    { email: 'hr@globex.com', isPrimary: true, permissions: { userManagement: 'write-upload', formEditor: 'write', resources: 'write', companySettings: 'read' } },
                    { email: 'testnewhr@globex.com', isPrimary: false, permissions: { userManagement: 'write-upload', formEditor: 'write', resources: 'write', companySettings: 'read' }}
                ],
                version: 'pro', 
                maxUsers: 25,
                severanceDeadlineTime: '17:00',
                severanceDeadlineTimezone: 'America/New_York',
                preEndDateContactAlias: 'hr.software@globex.com',
                postEndDateContactAlias: 'alumni-support.software@globex.com',
            }
        ],
        companyConfigs: {
            'Globex Corp': {
                questions: {},
                users: [
                    { email: 'employee1@globex.com', companyId: 'G123', notificationDate: getPastDate(5), notified: true },
                    { 
                        email: 'employee2@globex.com', 
                        companyId: 'G456', 
                        notificationDate: getPastDate(2), 
                        notified: true,
                        personalEmail: 'user.personal@email.com',
                        prefilledAssessmentData: {
                           finalDate: getFutureDate(28),
                           severanceAgreementDeadline: '2025-08-30',
                           medicalCoverageEndDate: '2025-08-31',
                           dentalCoverageEndDate: '2025-08-31',
                           visionCoverageEndDate: '2025-08-31',
                           eapCoverageEndDate: '2025-08-31',
                        }
                    },
                    { email: 's.smith@globex.com', companyId: 'G789', notificationDate: getFutureDate(12), notified: false },
                    { email: 'p.jones@globex.com', companyId: 'G101', notificationDate: getFutureDate(15), notified: false },
                    { email: 'a.williams@globex.com', companyId: 'G112', notificationDate: getFutureDate(20), notified: false },
                    { email: 'b.davis@globex.com', companyId: 'G213', notificationDate: getPastDate(10), notified: false },
                    {
                        email: 'j.doe@globex.com',
                        companyId: 'G314',
                        notificationDate: getPastDate(1),
                        notified: true,
                        prefilledAssessmentData: {
                            relocationPaid: 'Unsure',
                            unionMember: 'No',
                            hadMedicalInsurance: 'Unsure',
                            hadDentalInsurance: 'Yes',
                            hadVisionInsurance: 'No',
                            hadEAP: 'Yes'
                        }
                    },
                    {
                        email: 'm.chen@globex.com',
                        companyId: 'G516',
                        notificationDate: getPastDate(3),
                        notified: true,
                        prefilledAssessmentData: {
                            relocationPaid: 'No',
                            unionMember: 'Unsure',
                            hadMedicalInsurance: 'Yes',
                            hadDentalInsurance: 'Yes',
                            hadVisionInsurance: 'Unsure',
                            hadEAP: 'Unsure'
                        }
                    }
                ],
                customQuestions: {
                    'globex-corp-custom-1': {
                        id: 'globex-corp-custom-1',
                        label: 'Have you already booked any future non-refundable business trips?',
                        section: 'Work Circumstances',
                        type: 'radio',
                        isActive: true,
                        isCustom: true,
                        options: ['Yes', 'No'],
                        defaultValue: 'No',
                        lastUpdated: new Date().toISOString()
                    }
                },
                questionOrderBySection: {},
                resources: [
                    {
                        id: 'globex-resource-3',
                        title: 'Employee Exit Checklist',
                        description: 'A helpful checklist to guide you through the exit process.',
                        fileName: 'Exit_Checklist.txt',
                        category: 'Career',
                        content: `Employee Exit Checklist

This checklist is designed to help you manage key tasks during your employment transition.

**Immediate Actions (First 24-48 Hours)**
- [ ] Review your official separation notice for key dates and details.
- [ ] Understand the timeline for your access to company systems (email, Slack, etc.).
- [ ] Save personal files and contacts from your work computer. Do not take any company property or data.
- [ ] Note the deadline for signing your severance agreement, if one was offered.

**First Week**
- [ ] Apply for unemployment benefits in your state of residence.
- [ ] Review your severance agreement carefully. Consider having it reviewed by a legal professional.
- [ ] Begin researching your health insurance options (COBRA, ACA Marketplace, spouse's plan).
- [ ] Update your resume and LinkedIn profile.

**Financial Planning**
- [ ] Create a transition budget to manage your finances.
- [ ] Understand your 401(k) or other retirement plan options (rollover, cash out, leave in plan).
- [ ] Check on the payout of your final paycheck and any accrued vacation time.
- [ ] Review any stock options or equity grants and understand your exercise window.

**Healthcare**
- [ ] Determine your last day of health insurance coverage.
- [ ] Compare the cost and coverage of COBRA vs. other insurance options.
- [ ] Schedule any necessary medical or dental appointments before your coverage ends.

**Networking & Career**
- [ ] Notify your professional network about your transition.
- [ ] Ask for recommendations from colleagues and managers.
- [ ] Begin your job search activities, tailoring your resume for each application.
`
                    },
                    {
                        id: 'globex-resource-1',
                        title: '2024 Benefits Summary',
                        description: 'A complete overview of your employee benefits for 2024.',
                        fileName: 'Globex_Benefits_Summary_2024.txt',
                        category: 'Benefits',
                        content: `The Globex Corporation 2024 Benefits Summary provides a comprehensive overview of health, dental, and vision insurance plans. It details coverage tiers, premium costs, and enrollment deadlines. The document also outlines the 401(k) matching program, explaining the vesting schedule and contribution limits. Additional benefits covered include the Employee Assistance Program (EAP), life insurance options, and commuter benefits. Key deadlines for open enrollment are listed, along with contact information for the benefits administration team.`
                    },
                    {
                        id: 'globex-resource-2',
                        title: 'Work From Home Policy',
                        description: 'Official company policy regarding remote and hybrid work arrangements.',
                        fileName: 'Work_From_Home_Policy.txt',
                        category: 'Policies',
                        content: `This document outlines the official Work From Home (WFH) policy for Globex Corporation employees. It specifies eligibility criteria for remote and hybrid work, including job roles and performance requirements. The policy details expectations for home office setup, data security protocols, and communication standards. It also covers the process for requesting a WFH arrangement and the guidelines for equipment reimbursement. All remote employees are expected to maintain regular working hours and be available during core business times.`
                    },
                ],
            },
            'Initech': {
                questions: {},
                users: [
                    { 
                        email: 'peter.gibbons@initech.com', 
                        companyId: 'I-001', 
                        notificationDate: getPastDate(14), 
                        notified: true,
                        prefilledAssessmentData: {
                            relocationPaid: 'No',
                            unionMember: 'Unsure',
                        }
                    },
                    { 
                        email: 'samir.nagheenanajar@initech.com', 
                        companyId: 'I-002', 
                        notificationDate: getPastDate(14), 
                        notified: true,
                        prefilledAssessmentData: {
                            relocationPaid: 'Unsure',
                            unionMember: 'No',
                            hadVisionInsurance: 'Unsure',
                        }
                    },
                     { 
                        email: 'michael.bolton@initech.com', 
                        companyId: 'I-003', 
                        notificationDate: getPastDate(14), 
                        notified: true,
                        prefilledAssessmentData: {
                            relocationPaid: 'No',
                            hadMedicalInsurance: 'Unsure',
                            hadDentalInsurance: 'Unsure',
                        }
                    },
                    { email: 'employee@initech.com', companyId: 'I-99', notificationDate: new Date().toISOString().split('T')[0], notified: false }
                ],
                customQuestions: {},
                questionOrderBySection: {},
                resources: [],
            },
            'Globex Software': {
                questions: {},
                users: [
                     { email: 'dev1@globex.software', companyId: 'GS-01', notificationDate: getPastDate(1), notified: true },
                     { email: 'dev2@globex.software', companyId: 'GS-02', notificationDate: getFutureDate(30), notified: false },
                ],
                customQuestions: {},
                questionOrderBySection: {},
                resources: [],
            }
        },
        platformUsers: [
            { email: 'admin@exitous.co', role: 'admin' },
            { email: 'consultant@exitous.co', role: 'consultant' },
        ],
        masterQuestions: initializeQuestions(getDefaultQuestions),
        masterProfileQuestions: initializeQuestions(getDefaultProfileQuestions),
        profileCompletions: {
            'employee1@globex.com': true,
            'j.doe@globex.com': true,
        },
        assessmentCompletions: {
            'employee1@globex.com': true,
            'j.doe@globex.com': true,
        },
        reviewQueue: [
            {
                id: 'review-1',
                userEmail: 'employee.visa@globex.com',
                inputData: {
                    profileData: {
                        citizenshipStatus: 'Foreign national, international student (or on a student visa - CPT, OPT, or OPT STEM)',
                        state: 'New York',
                        birthYear: 1995, gender: 'Male', maritalStatus: 'Single', hasChildrenUnder13: false, hasExpectedChildren: false, impactedPeopleCount: '0', livingStatus: 'Renter', pastLifeEvents: [], hasChildrenAges18To26: false
                    },
                    layoffDetails: {
                        workVisa: 'H-1B'
                    },
                },
                output: {
                    recommendations: [
                        { taskId: 'handle-work-visa-implications', task: 'Consult an Immigration Attorney Immediately', category: 'Legal', timeline: 'Immediately', details: 'Your visa status is tied to your employment. You must consult with an immigration attorney to understand your grace period and options for maintaining legal status, such as a change of status or transferring your visa to a new employer.' },
                        { taskId: 'update-resume-and-linkedin', task: 'Update Your Resume & LinkedIn', category: 'Career', timeline: 'Within 3 days', details: 'Highlight your skills and accomplishments to prepare for your job search. A strong professional presence is crucial for finding a new role quickly.' },
                    ]
                },
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            {
                id: 'review-2',
                userEmail: 'employee.family@globex.com',
                inputData: {
                    profileData: {
                         maritalStatus: 'Married',
                         hasChildrenUnder13: true,
                         state: 'Texas',
                         birthYear: 1988, gender: 'Female', hasExpectedChildren: false, impactedPeopleCount: '4 - 6', livingStatus: 'Homeowner', citizenshipStatus: 'U.S. citizen', pastLifeEvents: [], hasChildrenAges18To26: false
                    },
                    layoffDetails: {
                        hadMedicalInsurance: 'Yes',
                        medicalCoverage: 'Me and family',
                        medicalCoverageEndDate: getFutureDate(30),
                    },
                },
                output: {
                    recommendations: [
                        { taskId: 'explore-health-insurance', task: 'Explore Health Insurance Options (COBRA & ACA)', category: 'Healthcare', timeline: 'Within 1 week', details: 'Since your family was covered by your plan, securing new health insurance is a top priority. Compare the costs of continuing your plan with COBRA against new plans on the ACA Marketplace.' },
                        { taskId: 'create-transition-budget', task: 'Create a Transition Budget', category: 'Finances', timeline: 'Within 1 week', details: 'Analyze your family\'s expenses and create a new budget to manage your finances during this transition period. Account for potential changes in income and new costs like health insurance premiums.' },
                    ]
                },
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
        ],
        seededData: {
            'employee1@globex.com': {
                profile: {
                  birthYear: 1990,
                  state: 'California',
                  gender: 'Female',
                  maritalStatus: 'Single',
                  hasChildrenUnder13: 'No',
                  hasExpectedChildren: 'No',
                  impactedPeopleCount: '1 - 3',
                  livingStatus: 'Renter',
                  citizenshipStatus: 'U.S. citizen',
                  pastLifeEvents: ['None of the above'],
                  hasChildrenAges18To26: 'No',
                },
                assessment: {
                  startDate: '2022-01-15',
                  workStatus: 'Full-time employee',
                  notificationDate: getPastDate(5),
                  finalDate: getFutureDate(25),
                  severanceAgreementDeadline: '2025-08-30',
                  workState: 'California',
                  relocationPaid: 'No',
                  unionMember: 'No',
                  workArrangement: 'Hybrid',
                  workArrangementOther: '',
                  workVisa: 'None of the above',
                  onLeave: ['None of the above'],
                  accessSystems: ['Email', 'HR/Payroll system (e.g., ADP, Workday)'],
                  emailAccessEndDate: getFutureDate(32),
                  hrPayrollSystemAccessEndDate: getFutureDate(60),
                  hadMedicalInsurance: 'Yes',
                  medicalCoverage: 'Me and family',
                  medicalCoverageEndDate: '2025-08-31',
                  hadDentalInsurance: 'No',
                  hadVisionInsurance: 'No',
                  hadEAP: 'Yes',
                  eapCoverageEndDate: '2025-08-31',
                  'globex-corp-custom-1': 'No',
                },
            },
        },
        externalResources: [
            // Finances
            {
                id: 'fin-1',
                name: 'Momentum Financial Planning',
                description: 'Certified financial planners specializing in sudden income changes. Get help with budgeting, 401k rollovers, and investment strategies.',
                category: 'Finances',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'financial planning',
                keywords: ['finance', '401k', 'investment', 'budget', 'severance', 'taxes'],
                relatedTaskIds: ['create-transition-budget', 'understand-401k-options'],
                isVerified: true,
                availability: ['basic', 'pro'],
                proOffer: '15% off your first consultation for Exitous members.'
            },
            {
                id: 'fin-2',
                name: 'Tax Advisors Inc.',
                description: 'Navigate the complex tax implications of severance packages, stock options, and unemployment benefits with our expert CPAs.',
                category: 'Finances',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'tax document',
                keywords: ['tax', 'cpa', 'severance', 'stock options', 'irs'],
                relatedTaskIds: ['consult-tax-advisor'],
                availability: ['basic', 'pro'],
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
                keywords: ['legal', 'lawyer', 'severance agreement', 'negotiation', 'employment law'],
                relatedTaskIds: ['review-severance-agreement'],
                isVerified: true,
                availability: ['basic', 'pro'],
            },
            {
                id: 'legal-2',
                name: 'Visa & Immigration Legal Services',
                description: 'Specialized legal help for individuals on work visas. Understand your options and timelines to maintain your legal status in the U.S.',
                category: 'Legal',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'passport visa',
                keywords: ['visa', 'immigration', 'h1b', 'green card', 'ead'],
                relatedTaskIds: ['handle-work-visa-implications'],
                availability: ['pro'],
            },
            {
                id: 'legal-3',
                name: 'Open Door Legal',
                description: 'Affordable legal services for employment contract reviews. Offering flat-fee packages for severance agreement analysis.',
                category: 'Legal',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'law office',
                keywords: ['legal', 'lawyer', 'severance agreement', 'affordable'],
                relatedTaskIds: ['review-severance-agreement'],
                availability: ['basic'],
                basicOffer: 'Free 15-minute initial assessment.'
            },
            // Career
            {
                id: 'job-1',
                name: 'CareerLeap Coaching',
                description: 'Expert career coaches who provide personalized resume reviews, interview prep, and job search strategies to land your next role faster.',
                category: 'Career',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'career coaching',
                keywords: ['job search', 'resume', 'interview prep', 'career coach', 'linkedin'],
                relatedTaskIds: ['update-resume-and-linkedin', 'practice-interviewing'],
                isVerified: true,
                availability: ['basic', 'pro'],
            },
            {
                id: 'job-2',
                name: 'Tech Recruiter Connect',
                description: 'A specialized recruiting firm that connects talented tech professionals with innovative companies. Get insider access to top roles.',
                category: 'Career',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'tech recruitment',
                keywords: ['recruiter', 'tech job', 'software engineer', 'product manager'],
                relatedTaskIds: ['start-networking'],
                availability: ['pro'],
            },
            {
                id: 'job-3',
                name: 'The Professional Network',
                description: 'Build meaningful connections through curated networking events and workshops designed for professionals in transition.',
                category: 'Career',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'professional networking',
                keywords: ['networking', 'connections', 'career events'],
                relatedTaskIds: ['start-networking'],
                availability: ['basic', 'pro'],
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
                keywords: ['therapy', 'mental health', 'counseling', 'stress', 'anxiety', 'resilience'],
                relatedTaskIds: ['seek-emotional-support'],
                availability: ['basic', 'pro'],
            },
            {
                id: 'well-2',
                name: 'Thrive Health Insurance Brokers',
                description: 'Navigate the complexities of finding new health coverage. Compare COBRA, ACA marketplace plans, and private options.',
                category: 'Well-being',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'health insurance',
                keywords: ['healthcare', 'insurance', 'cobra', 'aca', 'benefits'],
                relatedTaskIds: ['explore-health-insurance'],
                isVerified: true,
                availability: ['basic', 'pro'],
            }
        ],
        masterTasks: [
            { id: 'review-separation-documents', type: 'layoff', name: 'Review Separation Documents', category: 'Basics', detail: 'Carefully read your official separation notice for key dates and details.', deadlineType: 'notification_date', deadlineDays: 1 },
            { id: 'backup-work-files', type: 'layoff', name: 'Backup Personal Files & Contacts', category: 'Basics', detail: 'Save any personal files from your work computer.', deadlineType: 'termination_date', deadlineDays: 0 },
            { id: 'return-company-property', type: 'layoff', name: 'Plan to Return Company Property', category: 'Basics', detail: 'Coordinate the return of all company property, such as your laptop and phone.', deadlineType: 'termination_date', deadlineDays: 1 },
            { id: 'apply-for-unemployment', type: 'layoff', name: 'Apply for Unemployment Benefits', category: 'Financial', detail: 'Visit your state\'s unemployment website and file a claim.', deadlineType: 'termination_date', deadlineDays: 1 },
            { id: 'create-transition-budget', type: 'layoff', name: 'Create a Transition Budget', category: 'Financial', detail: 'Analyze your income and expenses to create a budget for your job search period.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'understand-401k-options', type: 'layoff', name: 'Understand Your 401(k) Options', category: 'Financial', detail: 'Contact your 401(k) provider to understand your rollover and withdrawal options.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'check-pto-payout', type: 'layoff', name: 'Check on Final Paycheck & PTO Payout', category: 'Financial', detail: 'Confirm with HR when you will receive your final paycheck and any unused PTO.', deadlineType: 'termination_date', deadlineDays: 7 },
            { id: 'consult-tax-advisor', type: 'layoff', name: 'Consult a Tax Advisor', category: 'Financial', detail: 'A layoff can have significant tax implications. A tax professional can help.', deadlineType: 'notification_date', deadlineDays: 60 },
            { id: 'review-severance-agreement', type: 'layoff', name: 'Review Severance Agreement', category: 'Legal', detail: 'It is highly recommended to have an employment lawyer review your severance agreement before signing.', deadlineType: 'notification_date', deadlineDays: 21 },
            { id: 'handle-work-visa-implications', type: 'layoff', name: 'Consult an Immigration Attorney', category: 'Legal', detail: 'If you are on a work visa, it is critical to consult an immigration attorney immediately.', deadlineType: 'notification_date', deadlineDays: 3 },
            { id: 'explore-health-insurance', type: 'layoff', name: 'Explore Health Insurance Options', category: 'Health', detail: 'Research COBRA, ACA marketplace plans, and other options to avoid a coverage gap.', deadlineType: 'termination_date', deadlineDays: 14 },
            { id: 'schedule-medical-appointments', type: 'layoff', name: 'Schedule Necessary Medical Appointments', category: 'Health', detail: 'Schedule any needed appointments before your current insurance coverage ends.', deadlineType: 'termination_date', deadlineDays: -7 },
            { id: 'update-resume-and-linkedin', type: 'layoff', name: 'Update Resume & LinkedIn', category: 'Career', detail: 'Update your resume and LinkedIn to reflect your latest accomplishments.', deadlineType: 'notification_date', deadlineDays: 3 },
            { id: 'start-networking', type: 'layoff', name: 'Start Networking', category: 'Career', detail: 'Reach out to your professional network to let them know you are looking for a new role.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'request-recommendations', type: 'layoff', name: 'Request Recommendations', category: 'Career', detail: 'Ask trusted colleagues or managers for recommendations on LinkedIn.', deadlineType: 'termination_date', deadlineDays: 14 },
            { id: 'practice-interviewing', type: 'layoff', name: 'Practice Interviewing', category: 'Career', detail: 'Prepare for interviews by practicing common questions and STAR method stories.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'seek-emotional-support', type: 'layoff', name: 'Seek Emotional Support', category: 'Health', detail: 'Lean on friends, family, or a mental health professional for support.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'confirm-last-day-of-work', type: 'layoff', name: 'Confirm Last Day of Work', category: 'Basics', detail: 'Ensure you have written confirmation of your official last day of employment from HR.', deadlineType: 'notification_date', deadlineDays: 1 },
            { id: 'understand-final-paycheck', type: 'layoff', name: 'Understand Your Final Paycheck', category: 'Financial', detail: 'Get a breakdown of what will be included in your final paycheck (salary, vacation payout, etc.).', deadlineType: 'termination_date', deadlineDays: -7 },
            { id: 'review-stock-options', type: 'layoff', name: 'Review Stock Options/Equity', category: 'Financial', detail: 'If you have stock options or RSUs, understand the vesting schedule and your window to exercise them.', deadlineType: 'termination_date', deadlineDays: -14 },
            { id: 'access-employee-assistance-program', type: 'layoff', name: 'Access Employee Assistance Program (EAP)', category: 'Health', detail: 'If your company offers an EAP, use it for free, confidential counseling and resources.', deadlineType: 'notification_date', deadlineDays: 2 },
            { id: 'forward-your-work-phone', type: 'layoff', name: 'Set Up Work Phone Forwarding/Voicemail', category: 'Basics', detail: 'If applicable, update your work voicemail and set up call forwarding.', deadlineType: 'termination_date', deadlineDays: 0 },
            { id: 'say-goodbye-to-colleagues', type: 'layoff', name: 'Connect with Colleagues', category: 'Career', detail: 'Exchange personal contact information with colleagues you want to stay in touch with.', deadlineType: 'termination_date', deadlineDays: 0 },
            { id: 'check-flexible-spending-account', type: 'layoff', name: 'Check Flexible Spending Account (FSA) Balance', category: 'Financial', detail: 'Check your FSA balance and deadlines. You may lose any unused funds after a grace period.', deadlineType: 'termination_date', deadlineDays: 0 },
            { id: 'update-professional-portfolio', type: 'layoff', name: 'Update Professional Portfolio', category: 'Career', detail: 'Compile examples of your work and update your professional portfolio website or documents.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'identify-skill-gaps', type: 'layoff', name: 'Identify Skill Gaps', category: 'Career', detail: 'Assess the skills required for your target roles and identify any gaps you may need to fill.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'take-online-courses', type: 'layoff', name: 'Enroll in Online Courses or Certifications', category: 'Career', detail: 'Consider enrolling in courses on platforms like Coursera, LinkedIn Learning, or Udemy to enhance your skills.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'attend-industry-webinars', type: 'layoff', name: 'Attend Industry Webinars and Events', category: 'Career', detail: 'Stay current with industry trends and expand your network by attending virtual or in-person events.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'explore-freelance-opportunities', type: 'layoff', name: 'Explore Freelance or Contract Work', category: 'Career', detail: 'Consider freelance or contract work to bridge the income gap and gain new experience.', deadlineType: 'notification_date', deadlineDays: 21 },
            { id: 'review-non-compete-agreements', type: 'layoff', name: 'Review Non-Compete/NDA Agreements', category: 'Legal', detail: 'Review any non-compete or non-disclosure agreements you signed to understand their scope and limitations.', deadlineType: 'notification_date', deadlineDays: 5 },
            { id: 'check-on-tuition-reimbursement', type: 'layoff', name: 'Check on Tuition Reimbursement', category: 'Financial', detail: 'If you were using a tuition reimbursement benefit, find out how your separation affects it.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'set-up-job-alerts', type: 'layoff', name: 'Set Up Job Alerts', category: 'Career', detail: 'Set up job alerts on LinkedIn, Indeed, and other job boards for roles that match your criteria.', deadlineType: 'notification_date', deadlineDays: 2 },
            { id: 'prepare-your-elevator-pitch', type: 'layoff', name: 'Prepare Your Elevator Pitch', category: 'Career', detail: 'Craft a concise and compelling summary of your skills and career goals for networking events.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'research-target-companies', type: 'layoff', name: 'Research Target Companies', category: 'Career', detail: 'Create a list of companies you\'d like to work for and start researching their culture and open roles.', deadlineType: 'notification_date', deadlineDays: 10 },
            { id: 'customize-your-cover-letter', type: 'layoff', name: 'Draft a Customizable Cover Letter Template', category: 'Career', detail: 'Create a strong cover letter template that you can quickly adapt for different job applications.', deadlineType: 'notification_date', deadlineDays: 5 },
            { id: 'organize-your-job-search', type: 'layoff', name: 'Organize Your Job Search', category: 'Career', detail: 'Use a spreadsheet or a tool like Trello to track your job applications, interviews, and networking contacts.', deadlineType: 'notification_date', deadlineDays: 4 },
            { id: 'investigate-pension-plan', type: 'layoff', name: 'Investigate Pension Plan Details', category: 'Financial', detail: 'If your company has a pension plan, contact HR to understand your vested benefits and payout options.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'explore-life-insurance-conversion', type: 'layoff', name: 'Explore Life Insurance Conversion', category: 'Health', detail: 'Check if you can convert your group life insurance policy to an individual policy.', deadlineType: 'termination_date', deadlineDays: 14 },
            { id: 'check-disability-insurance-options', type: 'layoff', name: 'Check Disability Insurance Options', category: 'Health', detail: 'See if your short-term or long-term disability insurance can be converted to an individual policy.', deadlineType: 'termination_date', deadlineDays: 14 },
            { id: 'take-care-of-your-well-being', type: 'anxious', name: 'Prioritize Your Well-being', category: 'Health', detail: 'This is a stressful time. Make sure to prioritize sleep, nutrition, and exercise. Consider mindfulness or meditation.', deadlineType: 'notification_date', deadlineDays: 1 },
            { id: 'get-professional-headshot', type: 'layoff', name: 'Get a Professional Headshot', category: 'Career', detail: 'A professional headshot can make your LinkedIn profile stand out.', deadlineType: 'notification_date', deadlineDays: 21 },
            { id: 'clean-up-social-media', type: 'layoff', name: 'Review and Clean Up Social Media', category: 'Career', detail: 'Review your public social media profiles and ensure they present a professional image to potential employers.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'volunteer-to-stay-active', type: 'layoff', name: 'Consider Volunteering', category: 'Career', detail: 'Volunteering can help you stay active, learn new skills, and expand your network during your job search.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'understand-cobra', type: 'layoff', name: 'Deeply Understand COBRA', category: 'Health', detail: 'COBRA allows you to continue your health coverage, but it can be expensive. Get the exact costs and compare them to other options.', deadlineType: 'termination_date', deadlineDays: 7 },
            { id: 'check-state-health-insurance-programs', type: 'layoff', name: 'Check for State Health Insurance Programs', category: 'Health', detail: 'Some states have their own health insurance programs or subsidies that may be more affordable than COBRA.', deadlineType: 'termination_date', deadlineDays: 7 },
            { id: 'update-your-budgeting-app', type: 'layoff', name: 'Update Your Budgeting App', category: 'Financial', detail: 'If you use a budgeting app like Mint or YNAB, update it with your new income and expense projections.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'negotiate-your-severance', type: 'layoff', name: 'Consider Negotiating Your Severance', category: 'Legal', detail: 'Depending on your circumstances, you may be able to negotiate the terms of your severance package. Consult a lawyer.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'write-down-accomplishments', type: 'layoff', name: 'Write Down Your Accomplishments', category: 'Career', detail: 'Before you forget, write down your key accomplishments and projects from your previous role to use in your resume and interviews.', deadlineType: 'notification_date', deadlineDays: 1 },
            { id: 'set-a-daily-routine', type: 'anxious', name: 'Establish a Daily Routine', category: 'Health', detail: 'Structure your days to stay productive and maintain a sense of normalcy during your job search.', deadlineType: 'notification_date', deadlineDays: 3 },
            { id: 'plan-informational-interviews', type: 'layoff', name: 'Plan Informational Interviews', category: 'Career', detail: 'Reach out to people in your target industry or companies for informational interviews to learn more and network.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'explore-outplacement-services', type: 'layoff', name: 'Explore Outplacement Services', category: 'Career', detail: 'Check if your company offers outplacement services, which can provide career coaching, resume help, and more.', deadlineType: 'notification_date', deadlineDays: 2 },
            { id: 'review-your-credit-report', type: 'layoff', name: 'Review Your Credit Report', category: 'Financial', detail: 'Get a free copy of your credit report to ensure there are no errors and to understand your financial standing.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'contact-your-lenders', type: 'layoff', name: 'Contact Lenders About Hardship Programs', category: 'Financial', detail: 'If you have loans, contact your lenders to see if they offer temporary forbearance or hardship programs.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'create-a-target-job-list', type: 'layoff', name: 'Create a Target Job Description', category: 'Career', detail: 'Write a detailed description of your ideal next job, including responsibilities, company culture, and salary.', deadlineType: 'notification_date', deadlineDays: 5 },
            { id: 'learn-a-new-in-demand-skill', type: 'layoff', name: 'Learn a New In-Demand Skill', category: 'Career', detail: 'Identify one in-demand skill in your field and dedicate time to learning it through an online course.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'schedule-time-for-self-care', type: 'anxious', name: 'Schedule Time for Self-Care', category: 'Health', detail: 'Block out time on your calendar for activities that help you relax and de-stress, like hobbies or exercise.', deadlineType: 'notification_date', deadlineDays: 1 },
            { id: 'join-professional-organizations', type: 'layoff', name: 'Join Professional Organizations or Slack/Discord Groups', category: 'Career', detail: 'Joining professional groups can provide valuable networking opportunities and job leads.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'create-a-professional-website', type: 'layoff', name: 'Create a Professional Website or Portfolio', category: 'Career', detail: 'A personal website can be a great way to showcase your work and skills to potential employers.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'get-feedback-on-your-resume', type: 'layoff', name: 'Get Feedback on Your Resume', category: 'Career', detail: 'Ask trusted friends, mentors, or a professional service to review your resume and provide feedback.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'set-realistic-job-search-goals', type: 'anxious', name: 'Set Realistic Job Search Goals', category: 'Career', detail: 'Set achievable weekly goals for your job search, such as number of applications or networking contacts.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'check-your-linkedin-privacy-settings', type: 'layoff', name: 'Update LinkedIn Privacy Settings', category: 'Career', detail: 'Update your LinkedIn settings to let recruiters know you are open to new opportunities.', deadlineType: 'notification_date', deadlineDays: 1 },
            { id: 'explore-government-assistance-programs', type: 'layoff', name: 'Explore Government Assistance Programs', category: 'Financial', detail: 'Besides unemployment, check if you are eligible for other government assistance programs like SNAP or housing assistance.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'prepare-for-the-salary-negotiation', type: 'layoff', name: 'Prepare for Salary Negotiation', category: 'Career', detail: 'Research the market rate for your target roles so you are prepared to negotiate your salary.', deadlineType: 'notification_date', deadlineDays: 21 },
            { id: 'take-a-break', type: 'anxious', name: 'Take a Break and Recharge', category: 'Health', detail: 'It\'s okay to take a few days to process what has happened before diving into your job search.', deadlineType: 'notification_date', deadlineDays: 2 },
            { id: 're-evaluate-your-career-path', type: 'layoff', name: 'Re-evaluate Your Career Path', category: 'Career', detail: 'Use this time as an opportunity to reflect on your career goals and consider if you want to make a change.', deadlineType: 'notification_date', deadlineDays: 30 },
            { id: 'create-a-list-of-references', type: 'layoff', name: 'Create a List of Professional References', category: 'Career', detail: 'Compile a list of professional references and ask for their permission to be contacted.', deadlineType: 'notification_date', deadlineDays: 14 },
            { id: 'write-thank-you-notes', type: 'layoff', name: 'Write Thank-You Notes After Interviews', category: 'Career', detail: 'Prepare a template for thank-you notes to send promptly after interviews.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'review-your-social-security-benefits', type: 'layoff', name: 'Review Your Social Security Benefits', category: 'Financial', detail: 'Understand how your layoff might impact your future Social Security benefits.', deadlineType: 'notification_date', deadlineDays: 60 },
            { id: 'assess-your-emergency-fund', type: 'layoff', name: 'Assess Your Emergency Fund', category: 'Financial', detail: 'Determine how long your emergency fund will last and make adjustments to your budget if needed.', deadlineType: 'notification_date', deadlineDays: 3 },
            { id: 'find-a-job-search-accountability-partner', type: 'anxious', name: 'Find a Job Search Accountability Partner', category: 'Career', detail: 'Partner with a friend or colleague to keep each other motivated and accountable during your job search.', deadlineType: 'notification_date', deadlineDays: 7 },
            { id: 'review-company-alumni-network', type: 'layoff', name: 'Check for a Company Alumni Network', category: 'Career', detail: 'See if your former company has an alumni network, which can be a great resource for networking.', deadlineType: 'termination_date', deadlineDays: 1 },
            { id: 'download-your-paystubs', type: 'layoff', name: 'Download Your Paystubs and W-2s', category: 'Financial', detail: 'Download your recent paystubs and past W-2s from the HR portal for your records.', deadlineType: 'termination_date', deadlineDays: 0 },
            { id: 'check-for-commuter-benefits-refund', type: 'layoff', name: 'Check for Commuter Benefits Refund', category: 'Financial', detail: 'If you had a pre-tax commuter benefits account, check the policy for using or refunding the remaining balance.', deadlineType: 'termination_date', deadlineDays: 7 },
            { id: 'understand-your-hsa-options', type: 'layoff', name: 'Understand Your Health Savings Account (HSA) Options', category: 'Health', detail: 'If you have an HSA, the money is yours to keep. Understand how you can continue to use it for medical expenses.', deadlineType: 'termination_date', deadlineDays: 7 },
            { id: 'write-a-farewell-email', type: 'layoff', name: 'Write a Farewell Email to Colleagues', category: 'Basics', detail: 'Write a professional and positive farewell email to your colleagues, including your personal contact information if you wish.', deadlineType: 'termination_date', deadlineDays: -1 },
            { id: 'follow-up-on-expense-reports', type: 'layoff', name: 'Follow Up on Outstanding Expense Reports', category: 'Financial', detail: 'Ensure any outstanding expense reports are submitted and approved before you lose system access.', deadlineType: 'termination_date', deadlineDays: -3 },
            { id: 'update-your-personal-contact-information', type: 'layoff', name: 'Update Personal Contact Information with HR', category: 'Basics', detail: 'Ensure HR has your correct personal email and mailing address for future correspondence like your W-2.', deadlineType: 'termination_date', deadlineDays: 0 },
            { id: 'reflect-on-your-accomplishments', type: 'anxious', name: 'Reflect on Your Accomplishments', category: 'Career', detail: 'Take time to reflect on your successes in your previous role to build confidence for your job search.', deadlineType: 'notification_date', deadlineDays: 3 },
            { id: 'create-a-positive-mindset-ritual', type: 'anxious', name: 'Create a Positive Mindset Ritual', category: 'Health', detail: 'Start your day with a positive ritual, like journaling or listening to an uplifting podcast, to stay motivated.', deadlineType: 'notification_date', deadlineDays: 2 },
        ],
        taskMappings: [
            { id: 'relocationPaid-Yes-review-severance-agreement', questionId: 'relocationPaid', answerValue: 'Yes', taskId: 'review-severance-agreement' }
        ],
        guidanceRules: [],
        masterTips: [
            { id: 'tip-cobra-1', type: 'layoff', priority: 'High', category: 'Health', text: 'You generally have 60 days to elect COBRA coverage after your health plan ends.' },
            { id: 'tip-401k-2', type: 'layoff', priority: 'Medium', category: 'Financial', text: 'Rolling over your 401(k) to an IRA can often give you more investment options and lower fees.' }
        ],
        tipMappings: [],
    }
};

// Use a global variable to store the database in development to prevent it from
// being reset on hot-reloads. In a real app, this would be a database connection.
const db = globalThis.__demo_db__ ?? (globalThis.__demo_db__ = initializeDb());


// --- Data Accessors & Mutators ---

export const getCompanyAssignments = () => db.companyAssignments;
export const saveCompanyAssignments = (data: CompanyAssignment[]) => { db.companyAssignments = data; };

export const getCompanyConfigs = () => db.companyConfigs;
export const saveCompanyConfigs = (data: Record<string, CompanyConfig>) => { db.companyConfigs = data; };

export const getPlatformUsers = () => db.platformUsers;
export const savePlatformUsers = (data: PlatformUser[]) => { db.platformUsers = data; };

export const getMasterQuestions = () => db.masterQuestions;
export const saveMasterQuestions = (data: Record<string, Question>) => { db.masterQuestions = data; };

export const getMasterProfileQuestions = () => db.masterProfileQuestions;
export const saveMasterProfileQuestions = (data: Record<string, Question>) => { db.masterProfileQuestions = data; };

export const getProfileCompletions = () => db.profileCompletions;
export const saveProfileCompletions = (data: Record<string, boolean>) => { db.profileCompletions = data; };

export const getAssessmentCompletions = () => db.assessmentCompletions;
export const saveAssessmentCompletions = (data: Record<string, boolean>) => { db.assessmentCompletions = data; };

export const getReviewQueue = () => db.reviewQueue;
export const saveReviewQueue = (data: ReviewQueueItem[]) => { db.reviewQueue = data; };

export const addReviewQueueItem = (item: ReviewQueueItem) => {
    // Ensure the queue exists before trying to access it.
    if (!db.reviewQueue) {
        db.reviewQueue = [];
    }
    // Prevent duplicates for the same user
    const existingIndex = db.reviewQueue.findIndex(i => i.userEmail === item.userEmail);
    if (existingIndex === -1) {
        db.reviewQueue.unshift(item); // Add to the top of the queue
    }
};


export const getSeededDataForUser = (email: string) => db.seededData[email];

export const getExternalResources = () => db.externalResources;
export const saveExternalResources = (data: ExternalResource[]) => { db.externalResources = data; };

export const getMasterTasks = () => db.masterTasks;
export const saveMasterTasks = (data: MasterTask[]) => { db.masterTasks = data; };

export const getTaskMappings = () => db.taskMappings;
export const saveTaskMappings = (data: TaskMapping[]) => { db.taskMappings = data; };

export const getGuidanceRules = () => db.guidanceRules;
export const saveGuidanceRules = (data: GuidanceRule[]) => { db.guidanceRules = data; };

export const getMasterTips = () => db.masterTips;
export const saveMasterTips = (data: MasterTip[]) => { db.masterTips = data; };

export const getTipMappings = () => db.tipMappings;
export const saveTipMappings = (data: TipMapping[]) => { db.tipMappings = data; };
    
