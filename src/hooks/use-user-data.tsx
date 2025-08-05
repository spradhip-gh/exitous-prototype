
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfileData, AssessmentData, buildAssessmentSchema, buildProfileSchema } from '@/lib/schemas';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import type { ExternalResource } from '../lib/external-resources';
import { PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { useToast } from './use-toast';
import { addDays } from 'date-fns';
import { supabase } from '@/lib/supabase-client';

const PROFILE_KEY = 'exitbetter-profile';
const ASSESSMENT_KEY = 'exitbetter-assessment';
const COMPLETED_TASKS_KEY = 'exitbetter-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitbetter-task-date-overrides';
const CUSTOM_DEADLINES_KEY = 'exitbetter-custom-deadlines';
const RECOMMENDATIONS_KEY = 'exitbetter-recommendations';
const USER_TIMEZONE_KEY = 'exitbetter-user-timezone';
const PREVIEW_SUFFIX = '-hr-preview';

export interface Condition {
    type: 'question' | 'tenure' | 'date_offset';
    questionId?: string;
    answer?: string;
    operator?: 'lt' | 'gt' | 'eq' | 'gte_lt';
    value?: number | number[];
    label?: string;
    dateQuestionId?: string;
    unit?: 'days' | 'weeks' | 'months';
    comparison?: 'from_today';
}

export interface Calculation {
    type: 'age' | 'tenure';
    unit: 'years' | 'days';
    startDateQuestionId?: string;
    endDateQuestionId?: string;
}
export interface RangeAssignment {
    taskIds: string[];
    tipIds: string[];
    noGuidanceRequired?: boolean;
}
export interface GuidanceRule {
    id: string;
    name: string;
    questionId: string;
    type: 'direct' | 'calculated';
    conditions: Condition[];
    calculation?: Calculation;
    ranges?: {
        from: number;
        to: number;
        assignments: RangeAssignment;
    }[];
    assignments: RangeAssignment;
}

export interface HrPermissions {
    userManagement: 'read' | 'write' | 'write-upload' | 'invite-only';
    formEditor: 'read' | 'write';
    resources: 'read' | 'write';
    companySettings: 'read' | 'write';
}

export interface HrManager {
    email: string;
    isPrimary: boolean;
    permissions: HrPermissions;
}

export interface CompanyUser {
  id: string; // The UUID from the company_users table
  email: string;
  companyId: string;
  personalEmail?: string;
  notificationDate?: string;
  notified?: boolean;
  prefilledAssessmentData?: Partial<Record<keyof AssessmentData, string | string[]>> & {
    preEndDateContactAlias?: string;
    postEndDateContactAlias?: string;
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  category: 'Benefits' | 'Policies' | 'Career' | 'Other';
  content?: string;
}

export interface AnswerGuidance {
    tasks?: string[];
    tips?: string[];
    noGuidanceRequired?: boolean;
}

export interface ReviewQueueItem {
    id: string;
    userEmail: string;
    inputData: any;
    output: PersonalizedRecommendationsOutput;
    status: 'pending' | 'approved' | 'rejected' | 'reviewed';
    createdAt: string;
    reviewedAt?: string;
    reviewerId?: string;
    changeDetails?: any;
}

export interface CompanyConfig {
    questions?: Record<string, Partial<Question>>;
    customQuestions?: Record<string, Question>;
    questionOrderBySection?: Record<string, string[]>;
    users?: CompanyUser[];
    resources?: Resource[];
    companyTasks?: MasterTask[];
    companyTips?: MasterTip[];
    answerGuidanceOverrides?: Record<string, Record<string, AnswerGuidance>>;
}

export type UpdateCompanyAssignmentPayload = Partial<Omit<CompanyAssignment, 'hrManagers'>> & {
    newPrimaryManagerEmail?: string;
    hrManagerToRemove?: string;
    hrManagerToAdd?: HrManager;
    hrManagerToUpdate?: { email: string, permissions: HrPermissions };
    delete?: boolean;
};

export interface MasterTask {
    id: string;
    type: 'layoff' | 'anxious';
    name: string;
    category: 'Financial' | 'Career' | 'Health' | 'Basics';
    detail: string;
    deadlineType: 'notification_date' | 'termination_date';
    deadlineDays?: number;
    linkedResourceId?: string;
    isCompanySpecific?: boolean;
}

export interface TaskMapping {
    id: string;
    questionId: string;
    answerValue: string;
    taskId: string;
}

export interface MasterTip {
    id: string;
    type: 'layoff' | 'anxious';
    priority: 'High' | 'Medium' | 'Low';
    category: 'Financial' | 'Career' | 'Health' | 'Basics';
    text: string;
    isCompanySpecific?: boolean;
}

export interface TipMapping {
    id: string;
    questionId: string;
    answerValue: string;
    tipId: string;
}

export interface CompanyAssignment {
    companyId: string;
    companyName: string;
    hrManagers: HrManager[];
    version: 'basic' | 'pro';
    maxUsers: number;
    severanceDeadlineTime?: string;
    severanceDeadlineTimezone?: string;
    preEndDateContactAlias?: string;
    postEndDateContactAlias?: string;
}

export interface PlatformUser {
    id: string;
    email: string;
    role: 'admin' | 'consultant';
}

export const buildQuestionTreeFromMap = (flatQuestionMap: Record<string, Question>): Question[] => {
    if (!flatQuestionMap || Object.keys(flatQuestionMap).length === 0) {
        return [];
    }
    const questionMapWithSubs: Record<string, Question> = {};
    for (const id in flatQuestionMap) {
        questionMapWithSubs[id] = { ...flatQuestionMap[id], subQuestions: [] };
    }

    const rootQuestions: Question[] = [];
    for (const id in questionMapWithSubs) {
        const q = questionMapWithSubs[id];
        if (q.parentId && questionMapWithSubs[q.parentId]) {
            const parent = questionMapWithSubs[q.parentId];
            if (parent.subQuestions) {
                parent.subQuestions.push(q);
            } else {
                parent.subQuestions = [q];
            }
        } else {
            rootQuestions.push(q);
        }
    }
    return rootQuestions;
};

export const convertStringsToDates = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3}Z?)?)?$/.test(obj)) {
        const [year, month, day] = obj.split('T')[0].split('-').map(Number);
        if (year && month && day) {
            return new Date(year, month - 1, day);
        }
    }
    if (Array.isArray(obj)) return obj.map(convertStringsToDates);
    if (typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = convertStringsToDates(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

export const convertDatesToStrings = (obj: any): any => {
    if (!obj) return obj;
    if (obj instanceof Date) {
        return obj.toISOString().split('T')[0];
    }
    if (Array.isArray(obj)) return obj.map(convertDatesToStrings);
    if (typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = convertDatesToStrings(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

export function useUserData() {
    const { auth } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
    const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
    const [customDeadlines, setCustomDeadlines] = useState<Record<string, { label: string; date: string }>>({});
    const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
    
    const [companyConfigs, setCompanyConfigs] = useState<Record<string, CompanyConfig>>({});
    const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
    const [guidanceRules, setGuidanceRules] = useState<GuidanceRule[]>([]);
    
    // This hook will now be responsible for fetching ALL data from Supabase on initial load.
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);

            // Fetch all static/shared data
            const [
                { data: questionsData },
                { data: rulesData },
            ] = await Promise.all([
                supabase.from('master_questions').select('*'),
                supabase.from('guidance_rules').select('*'),
            ]);

            const questionsMap: Record<string, Question> = {};
            questionsData?.forEach(q => {
                questionsMap[q.id] = { ...q.question_data, id: q.id, formType: q.form_type };
            });
            setMasterQuestions(questionsMap);
            setGuidanceRules(rulesData as GuidanceRule[] || []);
            
            // Fetch user-specific data if authenticated
            if (auth?.userId && auth.role === 'end-user') {
                const { data: profile } = await supabase.from('user_profiles').select('data').eq('user_id', auth.userId).single();
                const { data: assessment } = await supabase.from('user_assessments').select('data').eq('user_id', auth.userId).single();
                
                setProfileData(profile ? convertStringsToDates(profile.data) : null);
                setAssessmentData(assessment ? convertStringsToDates(assessment.data) : {});
            }

            setIsLoading(false);
        };
        fetchAllData();
    }, [auth?.userId, auth?.role]);
    
    const saveProfileData = useCallback(async (data: ProfileData) => {
        if (!auth?.userId) return;
        setProfileData(data); // Optimistic update
        const { error } = await supabase.from('user_profiles').upsert({
            user_id: auth.userId,
            data: convertDatesToStrings(data)
        }, { onConflict: 'user_id' });
        if (error) {
            console.error("Error saving profile:", error);
            // Optionally revert optimistic update
        }
    }, [auth?.userId]);

    const saveAssessmentData = useCallback(async (data: AssessmentData) => {
        if (!auth?.userId) return;
        setAssessmentData(data); // Optimistic update
        const { error } = await supabase.from('user_assessments').upsert({
            user_id: auth.userId,
            data: convertDatesToStrings(data)
        }, { onConflict: 'user_id' });
        if (error) {
            console.error("Error saving assessment:", error);
        }
    }, [auth?.userId]);

    // This function is now stable
    const getAllCompanyConfigs = useCallback(() => {
        // This should be updated to fetch from Supabase if needed,
        // but for now, we'll assume it's loaded into the `companyConfigs` state.
        return companyConfigs;
    }, [companyConfigs]);

    // Simplified stubs for other functions for now
    const getCompanyConfig = (companyName: string | undefined, activeOnly = true, formType: 'assessment' | 'profile' | 'all' = 'assessment'): Question[] => {
        // This needs to be reimplemented to use fetched data
        return [];
    };
    
    // ... all other functions from the old useUserData would need to be re-implemented here
    // to interact with Supabase instead of local state/demo-data.ts

    return {
        // --- DATA ---
        profileData,
        assessmentData,
        completedTasks,
        taskDateOverrides,
        customDeadlines,
        recommendations,
        isLoading,
        masterQuestions,
        guidanceRules,

        // --- FUNCTIONS ---
        saveProfileData,
        saveAssessmentData,
        getCompanyConfig,
        getAllCompanyConfigs,
        // The rest of the functions need to be implemented here...
        // For brevity in this example, I'm providing stubs.
        // In a real implementation, each of these would be a Supabase call.
        isAssessmentComplete: !!assessmentData?.workStatus,
        clearRecommendations: () => {},
        saveRecommendations: () => {},
        toggleTaskCompletion: () => {},
        updateTaskDate: () => {},
        addCustomDeadline: () => {},
        clearData: () => {},
        getProfileCompletion: () => ({ percentage: 0, sections: [], isComplete: false }),
        getAssessmentCompletion: () => ({ percentage: 0, sections: [], isComplete: false }),
        getUnsureAnswers: () => ({ count: 0, firstSection: null }),
        getMappedRecommendations: () => [],
        getTargetTimezone: () => 'UTC',
        saveCompanyConfig: async () => {},
        saveCompanyUsers: async () => {},
        saveCompanyResources: async () => {},
        addReviewQueueItem: async () => {},
        saveExternalResources: async () => {},
        saveGuidanceRules: async () => {},
        saveMasterQuestions: async () => {},
        saveMasterProfileQuestions: async () => {},
        saveMasterTasks: async () => {},
        saveMasterTips: async () => {},
        saveReviewQueue: async () => {},
        saveTaskMappings: async () => {},
        saveTipMappings: async () => {},
        addCompanyAssignment: async () => {},
        updateCompanyAssignment: async () => {},
        saveCompanyAssignments: async () => {},
        deleteCompanyAssignment: async () => {},
        addPlatformUser: async () => {},
        deletePlatformUser: async () => {},
        getCompaniesForHr: () => [],
        getCompanyUser: () => null,
        getPlatformUserRole: () => null,
    };
}
