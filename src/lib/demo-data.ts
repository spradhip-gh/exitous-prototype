import type { CompanyAssignment, CompanyConfig, CompanyUser, PlatformUser } from '@/hooks/use-user-data';
import { getDefaultQuestions, type Question } from './questions';

// This file acts as an in-memory "database" for the demo.
// Data will persist across navigation but will reset on a full browser refresh.

// --- Data Initialization ---

let companyAssignments: CompanyAssignment[] = [
    { companyName: 'Globex Corp', hrManagerEmail: 'hr@globex.com', version: 'pro', maxUsers: 50 },
    { companyName: 'Initech', hrManagerEmail: 'hr@initech.com', version: 'basic', maxUsers: 10 }
];

let companyConfigs: Record<string, CompanyConfig> = {
    'Globex Corp': {
        questions: {},
        users: [
            { email: 'employee1@globex.com', companyId: 'G123' },
            { email: 'employee2@globex.com', companyId: 'G456' }
        ],
        customQuestions: {},
        questionOrderBySection: {}
    },
    'Initech': {
        questions: {},
        users: [
            { email: 'employee@initech.com', companyId: 'I-99' }
        ],
        customQuestions: {},
        questionOrderBySection: {}
    }
};

let platformUsers: PlatformUser[] = [
    { email: 'admin@exitous.co', role: 'admin' },
    { email: 'consultant@exitous.co', role: 'consultant' }
];

const initializeMasterQuestions = (): Record<string, Question> => {
    const defaultQuestions = getDefaultQuestions();
    const flatMap: Record<string, Question> = {};
    const processQuestion = (q: Question) => {
        const { subQuestions, ...rest } = q;
        flatMap[q.id] = { ...rest, lastUpdated: new Date().toISOString() };
        if (subQuestions) {
            subQuestions.forEach(processQuestion);
        }
    };
    defaultQuestions.forEach(q => processQuestion(q));
    return flatMap;
};
let masterQuestions: Record<string, Question> = initializeMasterQuestions();


let assessmentCompletions: Record<string, boolean> = {
    'employee1@globex.com': true,
};


// --- Data Accessors & Mutators ---

export const getCompanyAssignments = () => companyAssignments;
export const saveCompanyAssignments = (data: CompanyAssignment[]) => { companyAssignments = data; };

export const getCompanyConfigs = () => companyConfigs;
export const saveCompanyConfigs = (data: Record<string, CompanyConfig>) => { companyConfigs = data; };

export const getPlatformUsers = () => platformUsers;
export const savePlatformUsers = (data: PlatformUser[]) => { platformUsers = data; };

export const getMasterQuestions = () => masterQuestions;
export const saveMasterQuestions = (data: Record<string, Question>) => { masterQuestions = data; };

export const getAssessmentCompletions = () => assessmentCompletions;
export const saveAssessmentCompletions = (data: Record<string, boolean>) => { assessmentCompletions = data; };
