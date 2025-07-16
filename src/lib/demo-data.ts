
import type { CompanyAssignment, CompanyConfig, PlatformUser } from '@/hooks/use-user-data';
import { getDefaultQuestions, type Question } from './questions';

// This file acts as a persistent in-memory "database" for the demo.
// By attaching the data to the global object, it persists across hot-reloads
// in development, simulating a real database more closely. This ensures that
// changes like adding custom questions are not lost on page refresh.

interface DemoDatabase {
    companyAssignments: CompanyAssignment[];
    companyConfigs: Record<string, CompanyConfig>;
    platformUsers: PlatformUser[];
    masterQuestions: Record<string, Question>;
    profileCompletions: Record<string, boolean>;
    assessmentCompletions: Record<string, boolean>;
}

// Augment the global type to include our custom property
declare global {
  // eslint-disable-next-line no-var
  var __demo_db__: DemoDatabase | undefined;
}

const initializeMasterQuestions = (): Record<string, Question> => {
    const defaultQuestions = getDefaultQuestions();
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


const initializeDb = (): DemoDatabase => {
    return {
        companyAssignments: [
            { companyName: 'Globex Corp', hrManagerEmail: 'hr@globex.com', version: 'pro', maxUsers: 50 },
            { companyName: 'Initech', hrManagerEmail: 'hr@initech.com', version: 'basic', maxUsers: 10 }
        ],
        companyConfigs: {
            'Globex Corp': {
                questions: {},
                users: [
                    { email: 'employee1@globex.com', companyId: 'G123', notificationDate: getPastDate(5), notified: true },
                    { email: 'employee2@globex.com', companyId: 'G456', notificationDate: getPastDate(2), notified: false },
                    { email: 's.smith@globex.com', companyId: 'G789', notificationDate: getFutureDate(12), notified: false },
                    { email: 'p.jones@globex.com', companyId: 'G101', notificationDate: getFutureDate(15), notified: false },
                    { email: 'a.williams@globex.com', companyId: 'G112', notificationDate: getFutureDate(20), notified: false },
                ],
                customQuestions: {},
                questionOrderBySection: {}
            },
            'Initech': {
                questions: {},
                users: [
                    { email: 'employee@initech.com', companyId: 'I-99', notificationDate: new Date().toISOString().split('T')[0], notified: false }
                ],
                customQuestions: {},
                questionOrderBySection: {}
            }
        },
        platformUsers: [
            { email: 'admin@exitous.co', role: 'admin' },
            { email: 'consultant@exitous.co', role: 'consultant' }
        ],
        masterQuestions: initializeMasterQuestions(),
        profileCompletions: {
            'employee1@globex.com': true,
        },
        assessmentCompletions: {
            'employee1@globex.com': true,
        },
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

export const getProfileCompletions = () => db.profileCompletions;
export const saveProfileCompletions = (data: Record<string, boolean>) => { db.profileCompletions = data; };

export const getAssessmentCompletions = () => db.assessmentCompletions;
export const saveAssessmentCompletions = (data: Record<string, boolean>) => { db.assessmentCompletions = data; };
