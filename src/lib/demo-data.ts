

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
                        lastUpdated: new Date().toISOString(),
                        answerGuidance: {
                            'Yes': {
                                tasks: ['company-task-cancel-trip'],
                                tips: ['company-tip-travel-insurance']
                            }
                        }
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
                companyTasks: [
                    { id: 'company-task-cancel-trip', name: 'Reach out to Globex travel partners to see about cancelling your trip for refund.', category: 'Financial', type: 'layoff', detail: 'Contact the travel agency or airline to inquire about cancellation policies and potential refunds for your business trip.', deadlineType: 'notification_date', deadlineDays: 7, isCompanySpecific: true }
                ],
                companyTips: [
                    { id: 'company-tip-travel-insurance', text: 'Some travel insurance policies cover cancellations due to job loss. Check your policy details.', category: 'Financial', priority: 'Medium', type: 'layoff', isCompanySpecific: true }
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
                companyTasks: [],
                companyTips: [],
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
                companyTasks: [],
                companyTips: [],
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
            { "id": "1", "type": "layoff", "name": "Review budget", "category": "Financial", "detail": "Take a first pass at identifying expenses that can be cut or reduced.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "2", "type": "layoff", "name": "Update professional materials", "category": "Career", "detail": "Add new roles, skills, accomplishments, education, and certifications to your resume and LinkedIn.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "12", "type": "layoff", "name": "Review child support / alimony", "category": "Financial", "detail": "Meet with legal counsel and / or prior partner to discuss any temporary changes to child support / alimony payments needed.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "19", "type": "layoff", "name": "Review childcare arrangements", "category": "Financial", "detail": "Evaluate costs and explore alternative options", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "21", "type": "layoff", "name": "Revisit kids' educational plans", "category": "Financial", "detail": "Reassess savings and financial plans for their education", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "23", "type": "layoff", "name": "Ensure prenatal / adoption coverage", "category": "Health", "detail": "Review the details of any health insurance plans you're considering to ensure they cover prenatal care or adoption costs", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "25", "type": "layoff", "name": "Explore community support for parents", "category": "Health", "detail": "Feeling supported is critical right now. Look into local groups or programs for expecting parents.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "26", "type": "layoff", "name": "Review Employment Authorization Document (EAD) status", "category": "Basics", "detail": "Ensure your work authorization is valid and up to date", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "27", "type": "layoff", "name": "Research benefits eligibility", "category": "Financial", "detail": "Investigate eligibility for unemployment and other assistance", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "28", "type": "layoff", "name": "Consult an immigration attorney", "category": "Basics", "detail": "Discuss how the job loss might affect your residency status", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "31", "type": "layoff", "name": "Consult an immigration attorney", "category": "Basics", "detail": "Discuss any potential impacts the job loss may have on your DACA status or immigration process", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "32", "type": "layoff", "name": "Review visa status and options", "category": "Basics", "detail": "Understand the timeline and requirements for maintaining status", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "33", "type": "layoff", "name": "Seek alternative health insurance", "category": "Health", "detail": "Research health insurance plans for international students / foreign nationals", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "34", "type": "layoff", "name": "Consult an immigration attorney", "category": "Basics", "detail": "Discuss visa alternatives or extension possibilities", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "37", "type": "layoff", "name": "Explore community resources", "category": "Career", "detail": "Identify local support services for job seekers", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "38", "type": "layoff", "name": "Update address in HR system", "category": "Basics", "detail": "Since you recently relocated, ensure HR has your current address", "deadlineType": "notification_date", "deadlineDays": 1 },
            { "id": "39", "type": "layoff", "name": "Contact mortgage lender", "category": "Financial", "detail": "Discuss possible payment options or forbearance", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "42", "type": "layoff", "name": "Contact financial aid office", "category": "Financial", "detail": "Explore options for additional aid or payment", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "43", "type": "layoff", "name": "Download employment verificattion & wage statements", "category": "Financial", "detail": "Financial aid documentation may require employment verification or wage statements. Make sure to download before access and contacts are limited.", "deadlineType": "notification_date", "deadlineDays": 1 },
            { "id": "44", "type": "layoff", "name": "Reassess enrollment plans", "category": "Financial", "detail": "Consider part-time or deferring to manage costs", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "45", "type": "layoff", "name": "Explore scholarships/grants", "category": "Financial", "detail": "Search for additional financial support opportunities", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "48", "type": "layoff", "name": "Update legal documents", "category": "Basics", "detail": "Review and update any legal documents (e.g., will, prenup)", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "49", "type": "layoff", "name": "Explore health insurance options", "category": "Health", "detail": "Investigate COBRA, ACA marketplace, or Medicaid", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "50", "type": "layoff", "name": "Contact healthcare providers", "category": "Health", "detail": "Discuss payment plans or financial assistance", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "51", "type": "layoff", "name": "Adjust budget for medical costs", "category": "Basics", "detail": "Reallocate funds to cover essential health expenses", "deadlineType": "termination_date" },
            { "id": "52", "type": "layoff", "name": "Look into emotional support options", "category": "Health", "detail": "If you sense that dealing with multiple losses / life changes is taking a toll, find and engage with a therapist, support group or loved ones -- either online or in person.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "56", "type": "layoff", "name": "Research financial help for elder care", "category": "Financial", "detail": "Explore programs that offer financial support for elder care.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "58", "type": "layoff", "name": "Check your benefits eligibility", "category": "Basics", "detail": "Review your termination paperwork to understand your eligibility for any benefits or severance, given your short tenure. Contact your HR rep if you have questions.", "deadlineType": "notification_date", "deadlineDays": 2 },
            { "id": "68", "type": "layoff", "name": "Ensure payment for contracted services", "category": "Financial", "detail": "Invoice any completed work and make note of any outstanding payments so you can follow up.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "71", "type": "layoff", "name": "Apply for unemployment pay, if eligible", "category": "Financial", "detail": "Submit unemployment application online or through your state’s agency, once you've verified if you're eligible.", "deadlineType": "termination_date", "deadlineDays": 7 },
            { "id": "73", "type": "layoff", "name": "Update contract portfolio", "category": "Career", "detail": "While still fresh, note recent project successes and client testimonials and add to portfolio and LinkedIn", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "76", "type": "layoff", "name": "Contact academic advisor regarding internship", "category": "Career", "detail": "Prepare any questions & concerns you have about your internship / apprenticeship ending and discuss any impact to your educational goals with your academic advisor.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "77", "type": "layoff", "name": "Request references / recommendations", "category": "Career", "detail": "Reach out to managers & mentors for LinkedIn recommendations or references while your work is still top of mind for them.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "81", "type": "layoff", "name": "Contact union representative", "category": "Basics", "detail": "Schedule a meeting to discuss the terms of your job loss and any options available to you.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "82", "type": "layoff", "name": "Review collective bargaining agreement (CBA)", "category": "Basics", "detail": "If you have access to it, review the CBA to get an understanding of your rights and any benefits available to you. Prepare questions to discuss with your union rep.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "83", "type": "layoff", "name": "Check union resources for job placement / training", "category": "Career", "detail": "Take time to review any union materials (handouts, website) to see what job placement assistance or retraining programs.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "85", "type": "layoff", "name": "Contact HR / relocation coordinator", "category": "Basics", "detail": "Discuss the terms of your corporate housing arrangement and any eligibility for reimbursement of moving expenses.", "deadlineType": "notification_date", "deadlineDays": 3 },
            { "id": "86", "type": "layoff", "name": "Research housing options", "category": "Basics", "detail": "Explore affordable housing options if relocation is required", "deadlineType": "notification_date", "deadlineDays": 4 },
            { "id": "87", "type": "layoff", "name": "Review relocation package", "category": "Basics", "detail": "Review your relocation package to understand the terms and any reimbursement eligibility or even just to prepare questions for discussion with your HR / relocation coordinator.", "deadlineType": "notification_date", "deadlineDays": 2 },
            { "id": "90", "type": "layoff", "name": "Review severance agreement", "category": "Financial", "detail": "Ensure you understand all terms, including non-compete clauses or confidentiality agreements", "deadlineType": "termination_date" },
            { "id": "91", "type": "layoff", "name": "Consult a financial advisor", "category": "Financial", "detail": "A good financial advisor can help you understand how to manage a severance payout, roll over a 401(k), manage stock, and utilize your Mega Backdoor to minimize tax impact or penalites.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "93", "type": "layoff", "name": "Discuss severance options with HR", "category": "Financial", "detail": "Explore if there are any avenues to negotiate a severance package. Check our Articles section for guidance on approching the conversation.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "94", "type": "layoff", "name": "Research 401(k) rollover options", "category": "Financial", "detail": "Compare IRA providers or explore a new employer’s plan if applicable. Get assistance from a financial advisor, if needed.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "96", "type": "layoff", "name": "Contact plan administrator re: 401(k) loan", "category": "Financial", "detail": "401(k) loans can sometimes become fully due upon termination. During the discussion, comfirm the repayment terms and timeline for your 401(k) loan so you stay current.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "100", "type": "layoff", "name": "Review stock vesting schedule", "category": "Financial", "detail": "Determine how much of your stock is vested and what options are available for selling or holding", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "101", "type": "layoff", "name": "Develop a stock liquidation plan", "category": "Financial", "detail": "Consult with a financial advisor to create a plan for selling your stock in a tax-efficient manner", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "102", "type": "layoff", "name": "Check into options to convert life insurance", "category": "Financial", "detail": "Inquire with HR or life insurance provider about options to convert your group life insurance to an individual plan", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "103", "type": "layoff", "name": "Review and update beneficiaries", "category": "Financial", "detail": "Ensure the beneficiary information is current and accurate on all your life insurance policies", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "104", "type": "layoff", "name": "Check portability of voluntary life insurance", "category": "Financial", "detail": "Contact your insurance provider to understand if you can continue your voluntary life insurance policy", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "105", "type": "layoff", "name": "Purchase individual life insurance, if needed", "category": "Financial", "detail": "If you won't be converting or porting life insurance from your employer, explore & purchase alternative life insurance policies to replace lost coverage.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "106", "type": "layoff", "name": "Contact your AD&D insurance provider", "category": "Financial", "detail": "Inquire about converting or continuing your AD&D coverage after your termination date", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "107", "type": "layoff", "name": "Purchase AD&D coverage, if needed", "category": "Financial", "detail": "If you won't be converting or porting your AD&D insurance but have assessed your risk factors and determined you still need it, research and purchase AD&D insurance.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "108", "type": "layoff", "name": "Check personal accident insurance options", "category": "Financial", "detail": "Contact your insurance provider to discuss coversion to an individual policy", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "109", "type": "layoff", "name": "Purchase individual personal accident insurance, if needed", "category": "Financial", "detail": "If not converting personal accident insurance from employer, research coverage & rates and purchase individual personal accident insurance", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "110", "type": "layoff", "name": "Check pet insurance continuation options", "category": "Financial", "detail": "Contact pet insurance provider to discuss options for continuing your pet insurance coverage after the job termination date", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "111", "type": "layoff", "name": "Purchase new pet insurance, if needed", "category": "Financial", "detail": "If not continuing pet insurance from employer, research coverage & rates and purchase a new pet insurance plan that meets your budget and needs.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "114", "type": "layoff", "name": "Cancel or adjust parking plans", "category": "Financial", "detail": "If you had a paid parking plan, cancel or adjust it to avoid unnecessary costs", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "121", "type": "layoff", "name": "Update car rental plan", "category": "Basics", "detail": "Update the email & payment info for your car rental plan so it's no longer associated with your employer.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "123", "type": "layoff", "name": "Audit professional associations", "category": "Career", "detail": "List the professional associations you belong and identify those worth maintaining based on the benefits they offer.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "126", "type": "layoff", "name": "Contact your external career coach", "category": "Career", "detail": "Discuss the possibility of continuing coaching services at a reduced rate or transitioning to a more affordable relationship.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "127", "type": "layoff", "name": "Research alternative coaching resources", "category": "Career", "detail": "Explore whether there are free or low-cost career counseling and coaching options offered online or by local community groups.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "129", "type": "layoff", "name": "Review tuition reimbursement agreement", "category": "Financial", "detail": "Check for any clauses requiring repayment after layoff", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "130", "type": "layoff", "name": "Adjust student loan repayment, if needed", "category": "Financial", "detail": "If your employer is no longer helping with student loan repayment, contact your loan servicer or go online to adjust your repayment amount or explore deferment / forbearance.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "131", "type": "layoff", "name": "Research affordable childcare options", "category": "Financial", "detail": "Explore community programs, family care options, or part-time childcare to reduce costs", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "132", "type": "layoff", "name": "Check fertility coverage", "category": "Health", "detail": "Contact fertility clinic to see if new insurance plans you're considering cover fertility treatments.", "deadlineType": "notification_date", "deadlineDays": 14 },
            { "id": "133", "type": "layoff", "name": "Check options for breast milk shipping", "category": "Health", "detail": "Contact breast milk shipping provider to inquire about continuing the service independently and the associated costs.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "134", "type": "layoff", "name": "Research adoption grants and funding", "category": "Financial", "detail": "With your employer no longer assisting with adoption costs, look into other financial resources that can help.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "135", "type": "layoff", "name": "Review internet service plan", "category": "Financial", "detail": "Evaluate if your current plan is necessary or if you can switch to a more cost-effective option", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "136", "type": "layoff", "name": "Review phone plan and expenses", "category": "Financial", "detail": "Assess your current plan and explore more affordable options, if needed", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "137", "type": "layoff", "name": "Audit current software subscriptions", "category": "Financial", "detail": "List all software and subscriptions you have and identify those that are essential to continue paying for without your employer's help.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "138", "type": "layoff", "name": "Check into legal plan conversion", "category": "Financial", "detail": "Contact legal provider to inquire about converting your legal plan to an individual plan or extending coverage", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "139", "type": "layoff", "name": "Consult an immigration attorney", "category": "Basics", "detail": "Schedule a consultation to discuss the impact of your layoff on your visa status and explore next steps", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "141", "type": "layoff", "name": "Research affordable fitness options", "category": "Health", "detail": "Look for community gyms, parks, or online workout programs that fit your budget", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "142", "type": "layoff", "name": "Check for gym discounts", "category": "Financial", "detail": "Gym discounts are sometimes available through EAP or medical insurance.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "143", "type": "layoff", "name": "Transition perks accounts", "category": "Financial", "detail": "Some employer perks programs allow you to retain points you've earned by transitioning from an employee account to a personal / alumni account. Check the perks program website.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "144", "type": "layoff", "name": "Research local laundry services", "category": "Basics", "detail": "Find affordable and convenient laundry services near your home to replace the use of your employer's laundry services.", "deadlineType": "notification_date", "deadlineDays": 7 },
            { "id": "289", "type": "layoff", "name": "Schedule medical, dental, vision appointments", "category": "Health", "detail": "Benefits typically only extend to the end of the month in which your termination occurs. Schedule any needed appointments for you and / or your family before the coverage end date.", "deadlineType": "notification_date", "deadlineDays": 1 },
            { "id": "290", "type": "layoff", "name": "Check balance of pre-tax commuter benefits", "category": "Financial", "detail": "Some plans may allow for reimbursement of unused funds for eligible expenses incurred before the layoff date.", "deadlineType": "notification_date", "deadlineDays": 1 },
            { "id": "291", "type": "layoff", "name": "Request notes from mentor / coach sessions", "category": "Career", "detail": "If you kept notes or transcripts of mentor sessions, you may be allowed to retrieve them if they don't contain proprietary information.", "deadlineType": "notification_date", "deadlineDays": 1 },
            { "id": "292", "type": "layoff", "name": "Make COBRA elections when eligible", "category": "Health", "detail": "The 60-day election period begins when the qualified beneficiary receives the COBRA election notice or when the coverage would otherwise end, whichever is later. If you miss the 60-day deadline, you may lose your right to enroll in COBRA and will no longer have the option to elect it .", "deadlineType": "termination_date", "deadlineDays": 60 }
        ],
        taskMappings: [
            { id: 'relocationPaid-Yes-review-severance-agreement', questionId: 'relocationPaid', answerValue: 'Yes', taskId: 'review-severance-agreement' }
        ],
        guidanceRules: [],
        masterTips: [
            { "id": "3", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Staying connected with friends, family, or support groups. and avoiding the temptation to isolate can help you maintain your mental and emotional well-being." },
            { "id": "4", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Talking candidly about your current situation with your spouse / significant other can help broaden your perspective when deciding what life adjustments are needed." },
            { "id": "6", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Setting regular check-ins to share your feelings, discuss progress, and explore options with a spouse, partner, other family member, or close friend can ensure you're getting the emotional support you need." },
            { "id": "8", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If you live with other adults, starting open communication with them now can help you get a handle on how your job loss might affect your current living arrangement, especially if you have some financial dependence on them." },
            { "id": "9", "type": "layoff", "priority": "Medium", "category": "Health", "text": "You may be able to make use of your partner’s benefits. Look into any services and coverage available to you through your partner’s health insurance for practical peace of mind." },
            { "id": "10", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Taking time to reassess any post-divorce finances (e.g., budget, lump-sum payments, or debt repayment) may show you qualify to negotiate a temporary, more affordable structured payment plan." },
            { "id": "11", "type": "layoff", "priority": "High", "category": "Financial", "text": "If you pay child support or alimony you may be able to negotiate a temporary, more affordable payment so you can fulfill your obligations and maintain entitlements." },
            { "id": "13", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "This may be a good time to review any pending divorce agreements before you finalize to ensure settlement and division of assets are still fair considering your loss of steady income." },
            { "id": "17", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Prioritizing your emotional support is critical since the death of someone close plus your job loss constitute a dual impact of loss. Welcome the kindness of friends, family, and a counselor or therapist." },
            { "id": "18", "type": "layoff", "priority": "Medium", "category": "Career", "text": "If you'd been working in your role out of necessity when you became widowed, it's worth taking time to consider if you want a new career skill or path." },
            { "id": "20", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Maintaining a stable routine for young children is essential. Consider how to keep their daily life consistent despite changes at home." },
            { "id": "21", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Kids might not fully understand your job loss, but they can sense stress. Be mindful of how you communicate changes to them and ensure they feel secure." },
            { "id": "23", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Teenagers can understand job loss more fully and might have concerns about how it affects them. Have open and honest conversations about the family’s new financial reality." },
            { "id": "25", "type": "layoff", "priority": "High", "category": "Health", "text": "If you opt to switch your insurance plan from COBRA to another alternative (exchange or your partner's insurance), your preferred providers/hospital may not be covered. Check before finalizing any new coverage outside of COBRA." },
            { "id": "27", "type": "layoff", "priority": "Medium", "category": "Health", "text": "The stress of a job loss and the unknowns of a new baby can be overwhelming. With emotional support from your partner or loved ones, you can focus on the positive aspects of welcoming a new child." },
            { "id": "28", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Checking whether your employment authorization document (EAD) is up to date is a good proactive move since a job loss might impact your status if your work permit is tied to your employment." },
            { "id": "31", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Protections and rights for DACA recipients, DREAMers, and other people who aren't citizens can be explained by legal advocates in your community." },
            { "id": "32", "type": "layoff", "priority": "High", "category": "Basics", "text": "Unemployment benefits may vary by state for DACA recipients, DREAMers, and other people who aren't citizens. You may have access to support, such as community organizations or nonprofits that assist mixed-status families." },
            { "id": "33", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Immigration status concerns during a job loss can be especially stressful. Trusted community groups and mental health professionals who understand your situation can offer support and guidance." },
            { "id": "34", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If your employment was linked to your visa, you may have a limited time to find a new job to maintain your visa. Consulting with your school can help you understand your options." },
            { "id": "35", "type": "layoff", "priority": "High", "category": "Health", "text": "Alternatives to employer-provided health insurance are available, including plans for international students and foreign nationals. Consulting with your school can help you understand your options." },
            { "id": "36", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "To extend your stay legally, you may want to continue your education or return to your home country and apply for a different visa. Consulting with your school can help you understand your options." },
            { "id": "37", "type": "layoff", "priority": "Medium", "category": "Career", "text": "If you're unfamiliar with the local job market and professional network because of your recent relocation, your local chamber of commerce may be able to help connect you." },
            { "id": "39", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Joining a local community group to build a support system and access local resources can help you discover new options and manage the stress that comes with adjusting to both a new area and a job loss." },
            { "id": "44", "type": "layoff", "priority": "High", "category": "Financial", "text": "A job loss doesn't necessarily mean giving up on college goals. Talk to a school counselor about financial aid, scholarships, payment plans, enrolling part-time, or deferring a semester." },
            { "id": "50", "type": "layoff", "priority": "Medium", "category": "Health", "text": "A recent major change in your partner relationship status combined with a job loss can be emotionally taxing in ways that aren't always evident immediately. Support from trusted friends, family, or a counselor can make all the difference." },
            { "id": "52", "type": "layoff", "priority": "Medium", "category": "Health", "text": "After employer-provided healthcare ends, there are other insurance options, like COBRA, that ensure continuous coverage." },
            { "id": "53", "type": "layoff", "priority": "Medium", "category": "Finance", "text": "To help manage ongoing medical expenses, some healthcare providers will negotiate a payment plan. You can reach out to your patient advocate for more info." },
            { "id": "56", "type": "layoff", "priority": "High", "category": "Health", "text": "The emotional toll and added responsibilities of losing a loved one combined with the stress of a job loss can take a toll in ways that aren't immediately evident. Stay open to support from trusted friends, family, counselors, and community support groups to help you take time and space to heal." },
            { "id": "60", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "If your ability to contribute to elder care is affected by your job loss, you may qualify for financial aid or assistance programs." },
            { "id": "62", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "With less than 30 days at the company, you may not be eligible for severance or unemployment benefits, but you may have other support options and rights." },
            { "id": "63", "type": "layoff", "priority": "Medium", "category": "Career", "text": "Even with a brief time at the company, mentioning all that you learned during that time may dispel concerns from future employers." },
            { "id": "69", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Your unemployment eligibility is based on the last four calendar quarters before you file your claim. Check your state's specific eligibility." },
            { "id": "78", "type": "layoff", "priority": "Medium", "category": "Career", "text": "After a long tenure, your identity may be closely tied to your previous job, but you can continue to define and evolve your professional self independent of past roles and associations." },
            { "id": "81", "type": "layoff", "priority": "Medium", "category": "Career", "text": "After a long tenure, a refreshed professional image can energize and inspire new considerations, such as conferences, courses or certifications for staying competitive in today’s job market." },
            { "id": "82", "type": "layoff", "priority": "Medium", "category": "Career", "text": "Taking courses or earning certifications in role-adjacent skills can diversify and strengthen your resume and help you stay competitive." },
            { "id": "88", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Applying for unemployment benefits promptly can help avoid gaps in income, keeping in mind that your state may have a waiting period to receive payment. Check with your state unemployment office." },
            { "id": "90", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "As a contractor, it may be worth checking that all payments for completed work are accounted for, including any bonuses outlined in your contract." },
            { "id": "92", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If the job loss was unexpected and you think the contract terms were not honored, It may be helpful to consult a legal professional to discuss your options." },
            { "id": "93", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If your internship or apprenticeship was part of an academic program, an academic advisor can help you understand any impacts to your academic progress, credit requirements, and next steps." },
            { "id": "94", "type": "layoff", "priority": "Medium", "category": "Career", "text": "Even if your internship or apprenticeshicp was brief, it’s worth staying in touch with supervisors and colleagues, who can be valuable connections for references or future opportunities." },
            { "id": "96", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Part-time employees may still qualify for unemployment benefits, especially when the job was a main income source. Reviewing your state’s guidelines may clarify options." },
            { "id": "99", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Union reps can help clarify rights and benefits after a job loss. They may also assist with severance, contract terms, and general guidance." },
            { "id": "100", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Reviewing your union's collective bargaining agreement can help clarify protections and benefits related to job loss." },
            { "id": "101", "type": "layoff", "priority": "Medium", "category": "Career", "text": "Some unions offer job placement, retraining, or legal support. Exploring these options may help with the transition." },
            { "id": "102", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Your HR or relocation coordinator can help you determine how long you're allowed to stay in corporate housing after your severance date and let you know if any available extensions are available." },
            { "id": "104", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "The terms of your housing relocation package may have provisions for covering moving costs back to your original location or to a new one." },
            { "id": "116", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Severance pay is taxable and may face higher withholding due to its lump-sum form. Planning ahead can help manage finances." },
            { "id": "117", "type": "layoff", "priority": "Medium", "category": "Health", "text": "It may help to review your severance package to see if it includes extended payment coverage like COBRA and how long it lasts." },
            { "id": "119", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "In some cases, negotiating with your employer to receive severance pay may be an option." },
            { "id": "120", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Leaving your 401(k) in your employer's plan may mean fewer options or higher fees so explore whether moving your 401(k) to an IRA or to a new employer’s plan would be beneficial." },
            { "id": "121", "type": "layoff", "priority": "High", "category": "Financial", "text": "If you have a Roth 401K, rolling it over could have tax implications depending on the destination account you roll it into. Consulting a financial advisor can help you make the best choice." },
            { "id": "122", "type": "layoff", "priority": "High", "category": "Financial", "text": "A 401(k) loan may become due in full with your job loss, so it's essential to understand the repayment terms to avoid penalties." },
            { "id": "123", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Failure to repay your 401(k) loan in the required timeframe may result in it being considered a distribution, subject to taxes and early withdrawal penalties." },
            { "id": "127", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Selling your company stock could result in capital gains taxes. Carefully planning the sale of your stock can help minimize your tax burden, particularly if you have a significant amount of stock" },
            { "id": "128", "type": "layoff", "priority": "High", "category": "Financial", "text": "Reviewing your union's collective bargaining agreement can help clarify protections and benefits in the case of job loss." },
            { "id": "129", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Reviewing your life insurance beneficiaries can help ensure they’re current, especially after recent life changes." },
            { "id": "130", "type": "layoff", "priority": "High", "category": "Financial", "text": "Voluntary life insurance is usually an elective benefit that you may be able to continue after your employment for a cost." },
            { "id": "131", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "If portability of voluntary life insurance isn’t available, exploring individual life insurance may help maintain coverage, especially if you have dependents." },
            { "id": "132", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "AD&D insurance is often linked to your employment. Depending on your personal and family situation, if you're involved in any high-risk activities, finding a replacement AD&D policy may be a good choice." },
            { "id": "135", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "If you decide to continue personal accident coverage, a comparison of costs and benefits with other available policies can help you find more affordable, equivalent coverage." },
            { "id": "140", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Some transportation benefits can be continued after employment." },
            { "id": "141", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "It's worth checking if you have a usable balance on your pre-tax commuter benefits (transit passes, parking accounts). Some plans allow for reimbursement of unused funds for eligible expenses incurred before the termination date." },
            { "id": "142", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Typically, a full mileage reimbursement must be submitted before your last day of employment. Check with your employer if this might apply to you." },
            { "id": "153", "type": "layoff", "priority": "High", "category": "Financial", "text": "It might be worth taking on the cost of professional memberships that your company paid for to continue valuable networking and job opportunities." },
            { "id": "157", "type": "layoff", "priority": "Medium", "category": "Career", "text": "If your company paid for an external coach and you benefited professionally, it might be worth taking on this cost as an investment in your career and personal development." },
            { "id": "158", "type": "layoff", "priority": "Medium", "category": "Career", "text": "Free career counseling services or peer mentoring can be a good, temporary replacement for paid coaching so you can continue your professional development." },
            { "id": "164", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Student loan payments without company support may be manageable by adjusting your budget and working with your lender to reduce or defer your payments." },
            { "id": "165", "type": "layoff", "priority": "High", "category": "Financial", "text": "Reviewing and updating any autopayments now can help avoid insufficient funds and fees." },
            { "id": "168", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Some health plans allow for continued fertility treaments via COBRA. Discuss with your HR rep." },
            { "id": "174", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Switching internet / phone providers or downgrading your plan to a lower-tier, pre-paid, or pay-as-you-go plan can help you control mobile phone costs." },
            { "id": "181", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Employers sometimes offer departing employees discounted access to software and apps, such as Microsoft Office Suite, and others." },
            { "id": "184", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Losing employer-sponsored immigration assistance may affect your visa status or application process so checking with an immigration representative or attorney is essential." },
            { "id": "186", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Reviewing your upcoming travel plans and your own risk tolerance can help assess whether you need to secure your own travel insurance." },
            { "id": "189", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Community centers, local parks, meetups, and online fitness programs can be free or low-cost alternatives to your lost employer-sponsored gym membership or wellness benefits." },
            { "id": "196", "type": "layoff", "priority": "High", "category": "Basics", "text": "Keeping your visa and passport up to date are essential for getting hired at your next job, and may be necessary for travel to interviews." },
            { "id": "197", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "You have 60 days from last pay period (60 day grace period) to change employers and still maintain status." },
            { "id": "198", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "To avoid unlawful presence, you must maintain your visa status even after job loss." },
            { "id": "200", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "With your employer-sponsored visa, your employer is required to pay return travel costs if your termination is involuntary." },
            { "id": "203", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Your H-3 visa is unique to your specific employer – changing employers will not maintain your status." },
            { "id": "204", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Even with a 60-day grace period to change employers to maintain status, it's extremely unlikely that you'll qualify for an L1 visa with another employer. Consulting with an immigration attorney as soon as possible is advisable." },
            { "id": "206", "type": "layoff", "priority": "High", "category": "Basics", "text": "Your P-visa can be unique to your specific employer so finding a new employer may not maintain your status. Consulting with an immigration attorney as soon as possible is advisable." },
            { "id": "207", "type": "layoff", "priority": "High", "category": "Basics", "text": "If your R visa is used for your next employer, your new position will need to be the same as or similar to the position you're leaving." },
            { "id": "208", "type": "layoff", "priority": "High", "category": "Basics", "text": "If you change employers, your visa petition must be approved before your start date, and your new role must be one that's approved for a TN visa." },
            { "id": "209", "type": "layoff", "priority": "High", "category": "Basics", "text": "Maintaining your visa status after your job loss depends on your stage in the F-1 or M-1 process. A Designated School Official (DSO) can help with dates and requirements." },
            { "id": "210", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If you have OPT work authorization, it requires \"productive work,\" but not pay. So even if you volunteer, your work must be defined as productive." },
            { "id": "211", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If you're on OPT STEM work authorization, pay is required to show maintenance of your OPT STEM authorization status." },
            { "id": "212", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If you have CPT work authorization, to maintain your CPT status you only need to maintain your full-time status at the university. Work isn't required." },
            { "id": "213", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Being mindful of your I-94 expiration date is critical, especially for entry to the United States." },
            { "id": "214", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Your particular visa allows you to freely change employers to any position, any occupation and still maintain your visa status." },
            { "id": "215", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If your visa status is dependent on your spouse, your work authorization and status will be impacted if your spouse leaves the United States, can't maintain their status for any reason, or you divorce." },
            { "id": "216", "type": "layoff", "priority": "High", "category": "Basics", "text": "With your particular visa, unlawful presence begins to accrue as soon as you lose your job." },
            { "id": "217", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "With your particular visa, the foreign residency requirement is a 2-year period in your home country before you can change status or re-enter on another status." },
            { "id": "221", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "Until your I-485 is approved, you'll need to have access to all of your immigration-related paperwork. If you don't have copies, contact your immigration attorney." },
            { "id": "223", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "If you're on OPT you're allowed 90 days of being unemployed for the full 1 year of work authorization, If you're on OPT STEM, you're allowed 150 days of being unemployed in total between your OPT and OPT STEM combined. Consulting with your school will help you understand your options." },
            { "id": "435", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Making new arrangements now for any child / spousal support automatic pay deductions can help you stay in compliance with the courts." },
            { "id": "436", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Benefits coverage changes can impact medical visits and more for children, especially high-school age children who require medical sign-off to participate in sports." },
            { "id": "437", "type": "layoff", "priority": "High", "category": "Health", "text": "If your adult children are in the workforce and will lose benefits due to your job loss, they may be eligible for their company’s benefits outside of open enrollment. They should discuss entitlements with their HR team." },
            { "id": "438", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Dependent care accounts (DCA) typically have an expiration date for submitting receipts." },
            { "id": "439", "type": "layoff", "priority": "Medium", "category": "Health", "text": "You can request additional COBRA coverage for help dealing with a serious mental or physical illness or an accident that involves you or a dependent." },
            { "id": "440", "type": "layoff", "priority": "High", "category": "Financial", "text": "Some companies will provide the value in cash for outplacement services you don't use." },
            { "id": "441", "type": "layoff", "priority": "High", "category": "Property", "text": "Before returning your company laptop, allow time to access any special portals set up by your employer or retrieve approved digital files. Some employers will require those activities only be done from a company laptop." },
            { "id": "442", "type": "layoff", "priority": "High", "category": "Property", "text": "If you have mail at your company, you may want to pick it up in person if you don't trust them to forward it to you." },
            { "id": "443", "type": "layoff", "priority": "High", "category": "Financial", "text": "You may be able to use your company discounts to purchase laptops & phones if you have proof you recently worked at the company." },
            { "id": "444", "type": "layoff", "priority": "High", "category": "Financial", "text": "When buying a new phone, many US carriers offer discounts for additional lines so it may be economical to share a plan with family or friends." },
            { "id": "445", "type": "layoff", "priority": "High", "category": "Property", "text": "Companies can't ship your personal alcohol, flammable liquids, prescription medications, and other items that violdate local laws or shipping regulations so they'll need to be picked up." },
            { "id": "446", "type": "layoff", "priority": "High", "category": "Social", "text": "Reaching out to local or online groups similar to any ERGs you belonged to at work can provide support and connection." },
            { "id": "447", "type": "layoff", "priority": "High", "category": "Career", "text": "Volunteering can be a great way to learn something new, connect with like-minded peope, network, and prevent isolating." },
            { "id": "448", "type": "layoff", "priority": "High", "category": "Health", "text": "Self-care is so important to well-being and a clear head for job interviews. Fun, inventive, and creative activities, especially those you may have put off because of work, can create balance and energize your job search." },
            { "id": "452", "type": "layoff", "priority": "High", "category": "Health", "text": "If your children 18-26 are not dependents, they typically can't be covered by your Marketplace Exchange (ACA) insurance plans, but they can be covered by COBRA." },
            { "id": "454", "type": "layoff", "priority": "High", "category": "Health", "text": "To ensure COBRA or any new insurance coverage for your new child, your child must be enrolled within 30 days." },
            { "id": "455", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "Severance packages can sometimes be negotiated to cover reamining maternity or paternity leave." },
            { "id": "456", "type": "layoff", "priority": "Medium", "category": "Career", "text": "You can contiue mentoring former work mentees, if you all agree, as long as you don't discuss anything confidential to your former employer." },
            { "id": "457", "type": "layoff", "priority": "Medium", "category": "Property", "text": "Some companies will allow you to keep any large office furniture items rather than pay the cost for you to return it." },
            { "id": "458", "type": "layoff", "priority": "Medium", "category": "Career", "text": "If you initiated or had a leading role or significant achievements/outcomes in any ERGs you belonged to, they'll make noteworthy additions to your resume and LinkedIn." },
            { "id": "459", "type": "layoff", "priority": "High", "category": "Health", "text": "Having the right support is critical right now. Your EAP benefits can be a great resource to discuss issues before coverage ends." },
            { "id": "460", "type": "layoff", "priority": "Medium", "category": "Health", "text": "If the company you're leaving is entering bankruptcy, COBRA will eventually end and you'll need to find a new health plan." },
            { "id": "462", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Each qualified beneficiary has an independent right to elect COBRA coverage, meaning spouses and dependent children can make their own decisions about whether to enroll." },
            { "id": "463", "type": "layoff", "priority": "Medium", "category": "Health", "text": "COBRA coverage can be retroactive, meaning it can start on the first day of the qualifying event, such as a job termination, even if enrollment is delayed." },
            { "id": "465", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "If you currently receive Social Security payments you can still collect any unemployment benefits you qualify for." },
            { "id": "466", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "If you received a severance package or draw a pension from your company, your unemployment compensation payment amount may be reduced." },
            { "id": "467", "type": "layoff", "priority": "Medium", "category": "Health", "text": "Anyone 65 or older has the option to apply for Original Medicare or buy a Medicare Advantage (Part C) plan through a private carrier." },
            { "id": "472", "type": "layoff", "priority": "High", "category": "Financial", "text": "BenefitsCheckUp® (benefitscheckup.org) connects millions of older adults and people with disabilities with benefits programs that can help them afford nutritious food, health care, and more." },
            { "id": "473", "type": "layoff", "priority": "High", "category": "Financial", "text": "Some landlords, especially large companies, may allow delayed or partial rent payments." },
            { "id": "475", "type": "layoff", "priority": "High", "category": "Financial", "text": "Many banks offer mortgage relief programs or allow borrowers to temporarily postpone payments. Federally-backed mortgages may qualify for forbearance and allow you to postpone payments for up to a year, or in some cases, 18 months." },
            { "id": "476", "type": "layoff", "priority": "High", "category": "Financial", "text": "Options for mortgage relief, such as your state's Homeowner's Assistance Fund program, may be available. Your state may also have a housing counselor you can talk to, to learn more about assistance." },
            { "id": "477", "type": "layoff", "priority": "High", "category": "Financial", "text": "Many auto companies and other lenders have emergency programs that will let you defer payments for a month or more." },
            { "id": "478", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "While spousal support is calculated on previous income, the court will consider your change in income when calculating or determining whether to award alimony." },
            { "id": "479", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "A job loss can change which spouse has the higher income and may switch who has to pay support and who will be awarded support." },
            { "id": "486", "type": "layoff", "priority": "Medium", "category": "Financial", "text": "While job loss can be stressful, it's important to consider how divorce decisions will impact your future. Consult an attorney and don't rush into an unfair settlement." },
            { "id": "487", "type": "layoff", "priority": "High", "category": "Health", "text": "Generally, employers aren't legally obligated to continue fertility benefits after termination, but they may choose to support employees during a difficult time. Your employer can share how your fertility benefits will be impacted." },
            { "id": "488", "type": "layoff", "priority": "High", "category": "Financial", "text": "FindHelp.org is a zipcode-based service that can help you find free or reduced-cost resources like food, housing, financial assistance, health care, and more in your area." },
            { "id": "489", "type": "layoff", "priority": "Medium", "category": "Basics", "text": "You may have to be responsible for taking over the tasks your leave management company was handling. Check with your leave management firm." }
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
    

    

    