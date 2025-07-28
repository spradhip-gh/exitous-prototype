

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
                relatedTaskIds: ['explore-health-insurance-options'],
                isVerified: true,
                availability: ['basic', 'pro'],
            }
        ],
        masterTasks: [
            { id: "1", type: "layoff", name: "Review budget", category: "Financial", detail: "Take a first pass at identifying expenses that can be cut or reduced.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "2", type: "layoff", name: "Update professional materials", category: "Career", detail: "Add new roles, skills, accomplishments, education, and certifications to your resume and LinkedIn.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "12", type: "layoff", name: "Review child support / alimony", category: "Financial", detail: "Meet with legal counsel and / or prior partner to discuss any temporary changes to child support / alimony payments needed.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "19", type: "layoff", name: "Review childcare arrangements", category: "Financial", detail: "Evaluate costs and explore alternative options", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "21", type: "layoff", name: "Revisit kids' educational plans", category: "Financial", detail: "Reassess savings and financial plans for their education", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "23", type: "layoff", name: "Ensure prenatal / adoption coverage", category: "Health", detail: "Review the details of any health insurance plans you're considering to ensure they cover prenatal care or adoption costs", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "25", type: "layoff", name: "Explore community support for parents", category: "Health", detail: "Feeling supported is critical right now. Look into local groups or programs for expecting parents.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "26", type: "layoff", name: "Review Employment Authorization Document (EAD) status", category: "Basics", detail: "Ensure your work authorization is valid and up to date", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "27", type: "layoff", name: "Research benefits eligibility", category: "Financial", detail: "Investigate eligibility for unemployment and other assistance", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "28", type: "layoff", name: "Consult an immigration attorney", category: "Basics", detail: "Discuss how the job loss might affect your residency status", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "31", type: "layoff", name: "Consult an immigration attorney", category: "Basics", detail: "Discuss any potential impacts the job loss may have on your DACA status or immigration process", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "32", type: "layoff", name: "Review visa status and options", category: "Basics", detail: "Understand the timeline and requirements for maintaining status", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "33", type: "layoff", name: "Seek alternative health insurance", category: "Health", detail: "Research health insurance plans for international students / foreign nationals", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "34", type: "layoff", name: "Consult an immigration attorney", category: "Basics", detail: "Discuss visa alternatives or extension possibilities", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "37", type: "layoff", name: "Explore community resources", category: "Career", detail: "Identify local support services for job seekers", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "38", type: "layoff", name: "Update address in HR system", category: "Basics", detail: "Since you recently relocated, ensure HR has your current address", deadlineType: "notification_date", deadlineDays: 1 },
            { id: "39", type: "layoff", name: "Contact mortgage lender", category: "Financial", detail: "Discuss possible payment options or forbearance", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "42", type: "layoff", name: "Contact financial aid office", category: "Financial", detail: "Explore options for additional aid or payment", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "43", type: "layoff", name: "Download employment verificattion & wage statements", category: "Financial", detail: "Financial aid documentation may require employment verification or wage statements. Make sure to download before access and contacts are limited.", deadlineType: "notification_date", deadlineDays: 1 },
            { id: "44", type: "layoff", name: "Reassess enrollment plans", category: "Financial", detail: "Consider part-time or deferring to manage costs", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "45", type: "layoff", name: "Explore scholarships/grants", category: "Financial", detail: "Search for additional financial support opportunities", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "48", type: "layoff", name: "Update legal documents", category: "Basics", detail: "Review and update any legal documents (e.g., will, prenup)", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "49", type: "layoff", name: "Explore health insurance options", category: "Health", detail: "Investigate COBRA, ACA marketplace, or Medicaid", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "50", type: "layoff", name: "Contact healthcare providers", category: "Health", detail: "Discuss payment plans or financial assistance", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "51", type: "layoff", name: "Adjust budget for medical costs", category: "Basics", detail: "Reallocate funds to cover essential health expenses", deadlineType: "termination_date" },
            { id: "52", type: "layoff", name: "Look into emotional support options", category: "Health", detail: "If you sense that dealing with multiple losses / life changes is taking a toll, find and engage with a therapist, support group or loved ones -- either online or in person.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "56", type: "layoff", name: "Research financial help for elder care", category: "Financial", detail: "Explore programs that offer financial support for elder care.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "58", type: "layoff", name: "Check your benefits eligibility", category: "Basics", detail: "Review your termination paperwork to understand your eligibility for any benefits or severance, given your short tenure. Contact your HR rep if you have questions.", deadlineType: "notification_date", deadlineDays: 2 },
            { id: "68", type: "layoff", name: "Ensure payment for contracted services", category: "Financial", detail: "Invoice any completed work and make note of any outstanding payments so you can follow up.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "71", type: "layoff", name: "Apply for unemployment pay, if eligible", category: "Financial", detail: "Submit unemployment application online or through your state’s agency, once you've verified if you're eligible.", deadlineType: "termination_date", deadlineDays: 7 },
            { id: "73", type: "layoff", name: "Update contract portfolio", category: "Career", detail: "While still fresh, note recent project successes and client testimonials and add to portfolio and LinkedIn", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "76", type: "layoff", name: "Contact academic advisor regarding internship", category: "Career", detail: "Prepare any questions & concerns you have about your internship / apprenticeship ending and discuss any impact to your educational goals with your academic advisor.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "77", type: "layoff", name: "Request references / recommendations", category: "Career", detail: "Reach out to managers & mentors for LinkedIn recommendations or references while your work is still top of mind for them.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "81", type: "layoff", name: "Contact union representative", category: "Basics", detail: "Schedule a meeting to discuss the terms of your job loss and any options available to you.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "82", type: "layoff", name: "Review collective bargaining agreement (CBA)", category: "Basics", detail: "If you have access to it, review the CBA to get an understanding of your rights and any benefits available to you. Prepare questions to discuss with your union rep.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "83", type: "layoff", name: "Check union resources for job placement / training", category: "Career", detail: "Take time to review any union materials (handouts, website) to see what job placement assistance or retraining programs.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "85", type: "layoff", name: "Contact HR / relocation coordinator", category: "Basics", detail: "Discuss the terms of your corporate housing arrangement and any eligibility for reimbursement of moving expenses.", deadlineType: "notification_date", deadlineDays: 3 },
            { id: "86", type: "layoff", name: "Research housing options", category: "Basics", detail: "Explore affordable housing options if relocation is required", deadlineType: "notification_date", deadlineDays: 4 },
            { id: "87", type: "layoff", name: "Review relocation package", category: "Basics", detail: "Review your relocation package to understand the terms and any reimbursement eligibility or even just to prepare questions for discussion with your HR / relocation coordinator.", deadlineType: "notification_date", deadlineDays: 2 },
            { id: "90", type: "layoff", name: "Review severance agreement", category: "Financial", detail: "Ensure you understand all terms, including non-compete clauses or confidentiality agreements", deadlineType: "termination_date" },
            { id: "91", type: "layoff", name: "Consult a financial advisor", category: "Financial", detail: "A good financial advisor can help you understand how to manage a severance payout, roll over a 401(k), manage stock, and utilize your Mega Backdoor to minimize tax impact or penalites.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "93", type: "layoff", name: "Discuss severance options with HR", category: "Financial", detail: "Explore if there are any avenues to negotiate a severance package. Check our Articles section for guidance on approching the conversation.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "94", type: "layoff", name: "Research 401(k) rollover options", category: "Financial", detail: "Compare IRA providers or explore a new employer’s plan if applicable. Get assistance from a financial advisor, if needed.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "96", type: "layoff", name: "Contact plan administrator re: 401(k) loan", category: "Financial", detail: "401(k) loans can sometimes become fully due upon termination. During the discussion, comfirm the repayment terms and timeline for your 401(k) loan so you stay current.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "100", type: "layoff", name: "Review stock vesting schedule", category: "Financial", detail: "Determine how much of your stock is vested and what options are available for selling or holding", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "101", type: "layoff", name: "Develop a stock liquidation plan", category: "Financial", detail: "Consult with a financial advisor to create a plan for selling your stock in a tax-efficient manner", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "102", type: "layoff", name: "Check into options to convert life insurance", category: "Financial", detail: "Inquire with HR or life insurance provider about options to convert your group life insurance to an individual plan", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "103", type: "layoff", name: "Review and update beneficiaries", category: "Financial", detail: "Ensure the beneficiary information is current and accurate on all your life insurance policies", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "104", type: "layoff", name: "Check portability of voluntary life insurance", category: "Financial", detail: "Contact your insurance provider to understand if you can continue your voluntary life insurance policy", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "105", type: "layoff", name: "Purchase individual life insurance, if needed", category: "Financial", detail: "If you won't be converting or porting life insurance from your employer, explore & purchase alternative life insurance policies to replace lost coverage.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "106", type: "layoff", name: "Contact your AD&D insurance provider", category: "Financial", detail: "Inquire about converting or continuing your AD&D coverage after your termination date", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "107", type: "layoff", name: "Purchase AD&D coverage, if needed", category: "Financial", detail: "If you won't be converting or porting your AD&D insurance but have assessed your risk factors and determined you still need it, research and purchase AD&D insurance.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "108", type: "layoff", name: "Check personal accident insurance options", category: "Financial", detail: "Contact your insurance provider to discuss coversion to an individual policy", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "109", type: "layoff", name: "Purchase individual personal accident insurance, if needed", category: "Financial", detail: "If not converting personal accident insurance from employer, research coverage & rates and purchase individual personal accident insurance", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "110", type: "layoff", name: "Check pet insurance continuation options", category: "Financial", detail: "Contact pet insurance provider to discuss options for continuing your pet insurance coverage after the job termination date", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "111", type: "layoff", name: "Purchase new pet insurance, if needed", category: "Financial", detail: "If not continuing pet insurance from employer, research coverage & rates and purchase a new pet insurance plan that meets your budget and needs.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "114", type: "layoff", name: "Cancel or adjust parking plans", category: "Financial", detail: "If you had a paid parking plan, cancel or adjust it to avoid unnecessary costs", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "121", type: "layoff", name: "Update car rental plan", category: "Basics", detail: "Update the email & payment info for your car rental plan so it's no longer associated with your employer.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "123", type: "layoff", name: "Audit professional associations", category: "Career", detail: "List the professional associations you belong and identify those worth maintaining based on the benefits they offer.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "126", type: "layoff", name: "Contact your external career coach", category: "Career", detail: "Discuss the possibility of continuing coaching services at a reduced rate or transitioning to a more affordable relationship.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "127", type: "layoff", name: "Research alternative coaching resources", category: "Career", detail: "Explore whether there are free or low-cost career counseling and coaching options offered online or by local community groups.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "129", type: "layoff", name: "Review tuition reimbursement agreement", category: "Financial", detail: "Check for any clauses requiring repayment after layoff", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "130", type: "layoff", name: "Adjust student loan repayment, if needed", category: "Financial", detail: "If your employer is no longer helping with student loan repayment, contact your loan servicer or go online to adjust your repayment amount or explore deferment / forbearance.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "131", type: "layoff", name: "Research affordable childcare options", category: "Financial", detail: "Explore community programs, family care options, or part-time childcare to reduce costs", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "132", type: "layoff", name: "Check fertility coverage", category: "Health", detail: "Contact fertility clinic to see if new insurance plans you're considering cover fertility treatments.", deadlineType: "notification_date", deadlineDays: 14 },
            { id: "133", type: "layoff", name: "Check options for breast milk shipping", category: "Health", detail: "Contact breast milk shipping provider to inquire about continuing the service independently and the associated costs.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "134", type: "layoff", name: "Research adoption grants and funding", category: "Financial", detail: "With your employer no longer assisting with adoption costs, look into other financial resources that can help.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "135", type: "layoff", name: "Review internet service plan", category: "Financial", detail: "Evaluate if your current plan is necessary or if you can switch to a more cost-effective option", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "136", type: "layoff", name: "Review phone plan and expenses", category: "Financial", detail: "Assess your current plan and explore more affordable options, if needed", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "137", type: "layoff", name: "Audit current software subscriptions", category: "Financial", detail: "List all software and subscriptions you have and identify those that are essential to continue paying for without your employer's help.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "138", type: "layoff", name: "Check into legal plan conversion", category: "Financial", detail: "Contact legal provider to inquire about converting your legal plan to an individual plan or extending coverage", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "139", type: "layoff", name: "Consult an immigration attorney", category: "Basics", detail: "Schedule a consultation to discuss the impact of your layoff on your visa status and explore next steps", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "141", type: "layoff", name: "Research affordable fitness options", category: "Health", detail: "Look for community gyms, parks, or online workout programs that fit your budget", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "142", type: "layoff", name: "Check for gym discounts", category: "Financial", detail: "Gym discounts are sometimes available through EAP or medical insurance.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "143", type: "layoff", name: "Transition perks accounts", category: "Financial", detail: "Some employer perks programs allow you to retain points you've earned by transitioning from an employee account to a personal / alumni account. Check the perks program website.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "144", type: "layoff", name: "Research local laundry services", category: "Basics", detail: "Find affordable and convenient laundry services near your home to replace the use of your employer's laundry services.", deadlineType: "notification_date", deadlineDays: 7 },
            { id: "289", type: "layoff", name: "Schedule medical, dental, vision appointments", category: "Health", detail: "Benefits typically only extend to the end of the month in which your termination occurs. Schedule any needed appointments for you and / or your family before the coverage end date.", deadlineType: "notification_date", deadlineDays: 1 },
            { id: "290", type: "layoff", name: "Check balance of pre-tax commuter benefits", category: "Financial", detail: "Some plans may allow for reimbursement of unused funds for eligible expenses incurred before the layoff date.", deadlineType: "notification_date", deadlineDays: 1 },
            { id: "291", type: "layoff", name: "Request notes from mentor / coach sessions", category: "Career", detail: "If you kept notes or transcripts of mentor sessions, you may be allowed to retrieve them if they don't contain proprietary information.", deadlineType: "notification_date", deadlineDays: 1 },
            { id: "292", type: "layoff", name: "Make COBRA elections when eligible", category: "Health", detail: "The 60-day election period begins when the qualified beneficiary receives the COBRA election notice or when the coverage would otherwise end, whichever is later. If you miss the 60-day deadline, you may lose your right to enroll in COBRA and will no longer have the option to elect it .", deadlineType: "termination_date", deadlineDays: 60 }
        ],
        taskMappings: [
            { id: 'relocationPaid-Yes-review-severance-agreement', questionId: 'relocationPaid', answerValue: 'Yes', taskId: 'review-severance-agreement' }
        ],
        guidanceRules: [],
        masterTips: [
            {
                "id": "tip-cobra-1",
                "type": "layoff",
                "priority": "High",
                "category": "Health",
                "text": "You generally have 60 days from the date of your qualifying event (or the date you receive your election notice) to elect COBRA coverage."
            },
            {
                "id": "tip-401k-2",
                "type": "layoff",
                "priority": "Medium",
                "category": "Financial",
                "text": "Leaving your money in your former employer's 401(k) is an option, but rolling it over to an IRA often gives you more investment choices and potentially lower fees."
            },
            {
                "id": "tip-unemployment-3",
                "type": "layoff",
                "priority": "High",
                "category": "Financial",
                "text": "Most states have a one-week waiting period before unemployment benefits begin. Apply as soon as you're eligible to minimize delays."
            },
            {
                "id": "tip-networking-4",
                "type": "layoff",
                "priority": "Medium",
                "category": "Career",
                "text": "Don't just ask for a job. When networking, ask for advice, information, or insights. This often leads to more meaningful connections and uncovers hidden opportunities."
            },
            {
                "id": "tip-severance-5",
                "type": "layoff",
                "priority": "High",
                "category": "Legal",
                "text": "A severance agreement is a legal contract. It's highly advisable to have an employment lawyer review it before you sign away any rights."
            },
            {
                "id": "tip-fsa-6",
                "type": "layoff",
                "priority": "High",
                "category": "Financial",
                "text": "Flexible Spending Account (FSA) funds are often 'use-it-or-lose-it' after you leave your job. Check your plan's deadlines for submitting claims."
            },
            {
                "id": "tip-linkedin-7",
                "type": "layoff",
                "priority": "Medium",
                "category": "Career",
                "text": "On LinkedIn, you can privately signal to recruiters that you're 'Open to Work' without it showing publicly on your profile."
            },
            {
                "id": "tip-mental-health-8",
                "type": "anxious",
                "priority": "High",
                "category": "Health",
                "text": "Job searching is a marathon, not a sprint. Schedule breaks and do activities you enjoy to avoid burnout and maintain your mental health."
            },
            {
                "id": "tip-budget-9",
                "type": "layoff",
                "priority": "High",
                "category": "Financial",
                "text": "When creating a transition budget, categorize expenses into 'needs' and 'wants' to easily identify areas where you can cut back if necessary."
            },
            {
                "id": "tip-resume-10",
                "type": "layoff",
                "priority": "Medium",
                "category": "Career",
                "text": "Tailor your resume for each job application by using keywords from the job description. This helps get past automated screening systems (ATS)."
            },
            {
                "id": "tip-hsa-11",
                "type": "layoff",
                "priority": "Medium",
                "category": "Health",
                "text": "Unlike an FSA, the money in your Health Savings Account (HSA) is yours to keep and use for medical expenses, even after you've left your job."
            },
            {
                "id": "tip-references-12",
                "type": "layoff",
                "priority": "Low",
                "category": "Career",
                "text": "Always ask for permission before listing someone as a professional reference and give them a heads-up about the roles you're applying for."
            },
            {
                "id": "tip-routine-13",
                "type": "anxious",
                "priority": "Medium",
                "category": "Health",
                "text": "Maintaining a daily routine, including getting dressed for 'work' even if you're at home, can significantly boost productivity and morale."
            },
            {
                "id": "tip-taxes-14",
                "type": "layoff",
                "priority": "High",
                "category": "Financial",
                "text": "Your severance pay is taxable income. You may want to set aside a portion of it for taxes."
            },
            {
                "id": "tip-negotiation-15",
                "type": "layoff",
                "priority": "Medium",
                "category": "Career",
                "text": "Even in a tough market, there can be room to negotiate a job offer. This can include salary, start date, vacation time, or remote work options."
            }
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
    

    
