
import type { CompanyAssignment, CompanyConfig, PlatformUser, Resource } from '@/hooks/use-user-data';
import { getDefaultQuestions, getDefaultProfileQuestions, type Question } from './questions';
import type { ProfileData, AssessmentData } from './schemas';
import type { ExternalResource } from './external-resources';

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
    // --- Seeded localStorage data for specific demo users ---
    seededData: Record<string, { profile: ProfileData; assessment: AssessmentData }>;
    externalResources: ExternalResource[];
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

    return {
        companyAssignments: [
            { 
                companyName: 'Globex Corp', 
                hrManagerEmail: 'hr@globex.com', 
                version: 'pro', 
                maxUsers: 50,
                severanceDeadlineTime: '23:59',
                severanceDeadlineTimezone: 'America/Los_Angeles',
                preEndDateContactAlias: 'hr@globex.com',
                postEndDateContactAlias: 'alumni-support@globex.com',
            },
            { 
                companyName: 'Initech', 
                hrManagerEmail: 'hr@initech.com', 
                version: 'basic', 
                maxUsers: 10,
                severanceDeadlineTime: '17:00',
                severanceDeadlineTimezone: 'America/Chicago',
                preEndDateContactAlias: 'hr@initech.com',
                postEndDateContactAlias: 'alumni-support@initech.com',
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

**Networking & Job Search**
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
            }
        },
        platformUsers: [
            { email: 'admin@exitous.co', role: 'admin' },
            { email: 'consultant@exitous.co', role: 'consultant' }
        ],
        masterQuestions: initializeQuestions(getDefaultQuestions),
        masterProfileQuestions: initializeQuestions(getDefaultProfileQuestions),
        profileCompletions: {
            'employee1@globex.com': true,
        },
        assessmentCompletions: {
            'employee1@globex.com': true,
        },
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
                  workStatus: 'Full-time employee',
                  startDate: new Date('2020-01-15'),
                  notificationDate: new Date(getPastDate(5)),
                  finalDate: new Date(getFutureDate(25)),
                  severanceAgreementDeadline: new Date('2025-08-30'),
                  workState: 'California',
                  relocationPaid: 'No',
                  unionMember: 'No',
                  workArrangement: 'Hybrid',
                  workArrangementOther: '',
                  workVisa: 'None of the above',
                  onLeave: ['None of the above'],
                  accessSystems: ['Email', 'HR/Payroll system (e.g., ADP, Workday)'],
                  emailAccessEndDate: new Date(getFutureDate(32)),
                  hrPayrollSystemAccessEndDate: new Date(getFutureDate(60)),
                  hadMedicalInsurance: 'Yes',
                  medicalCoverage: 'Me and family',
                  medicalCoverageEndDate: new Date('2025-08-31'),
                  hadDentalInsurance: 'No',
                  hadVisionInsurance: 'No',
                  hadEAP: 'Yes',
                  eapCoverageEndDate: new Date('2025-08-31'),
                  'globex-corp-custom-1': 'No',
                } as any,
            },
            'employee2@globex.com': {
                profile: {
                  birthYear: 1988,
                  state: 'California',
                  gender: 'Female',
                  maritalStatus: 'Married',
                  hasChildrenUnder13: 'Yes, 1 or more',
                  hasExpectedChildren: 'No',
                  impactedPeopleCount: '1 - 3',
                  livingStatus: 'Homeowner',
                  citizenshipStatus: 'U.S. citizen',
                  pastLifeEvents: ['Home purchase'],
                  hasChildrenAges18To26: 'No',
                },
                assessment: {
                  workStatus: 'Full-time employee',
                  startDate: new Date('2018-05-15'),
                  notificationDate: new Date(getPastDate(2)),
                  finalDate: new Date(getFutureDate(28)),
                  severanceAgreementDeadline: '2025-08-30',
                  workState: 'California',
                  relocationPaid: 'No',
                  unionMember: 'No',
                  workArrangement: 'Remote',
                  workVisa: 'None of the above',
                  onLeave: ['None of the above'],
                  accessSystems: ['Email', 'HR/Payroll system (e.g., ADP, Workday)'],
                  emailAccessEndDate: new Date(getFutureDate(32)),
                  hrPayrollSystemAccessEndDate: new Date(getFutureDate(60)),
                  hadMedicalInsurance: 'Yes',
                  medicalCoverage: 'Me and family',
                  medicalCoverageEndDate: '2025-08-31',
                  hadDentalInsurance: 'Yes',
                  dentalCoverage: 'Me and family',
                  dentalCoverageEndDate: '2025-08-31',
                  hadVisionInsurance: 'Yes',
                  visionCoverage: 'Me and family',
                  visionCoverageEndDate: '2025-08-31',
                  hadEAP: 'Yes',
                  eapCoverageEndDate: '2025-08-31',
                } as AssessmentData,
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
                specialOffer: '15% off your first consultation for Exitous members.'
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
                relatedTaskIds: ['consult-tax-advisor']
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
                relatedTaskIds: ['handle-work-visa-implications']
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
                specialOffer: 'Free 15-minute initial assessment.'
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
                keywords: ['job search', 'resume', 'interview prep', 'career coach', 'linkedin'],
                relatedTaskIds: ['update-resume-and-linkedin', 'practice-interviewing'],
                isVerified: true,
            },
            {
                id: 'job-2',
                name: 'Tech Recruiter Connect',
                description: 'A specialized recruiting firm that connects talented tech professionals with innovative companies. Get insider access to top roles.',
                category: 'Job Search',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'tech recruitment',
                keywords: ['recruiter', 'tech job', 'software engineer', 'product manager'],
                relatedTaskIds: ['start-networking']
            },
            {
                id: 'job-3',
                name: 'The Professional Network',
                description: 'Build meaningful connections through curated networking events and workshops designed for professionals in transition.',
                category: 'Job Search',
                website: '#',
                imageUrl: 'https://placehold.co/600x400.png',
                imageHint: 'professional networking',
                keywords: ['networking', 'connections', 'career events'],
                relatedTaskIds: ['start-networking']
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
                relatedTaskIds: ['seek-emotional-support']
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
            }
        ]
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

export const getSeededDataForUser = (email: string) => db.seededData[email];

export const getExternalResources = () => db.externalResources;
export const saveExternalResources = (data: ExternalResource[]) => { db.externalResources = data; };
