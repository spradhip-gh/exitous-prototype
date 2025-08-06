
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfileData, AssessmentData, buildAssessmentSchema, buildProfileSchema } from '@/lib/schemas';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import type { ExternalResource } from '../lib/external-resources';
import { PersonalizedRecommendationsOutput, RecommendationItem } from '@/ai/flows/personalized-recommendations';
import { useToast } from '@/hooks/use-toast';
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
  company_id: string; // The UUID of the company
  email: string;
  company_user_id: string;
  personal_email?: string;
  notification_date?: string;
  is_invited?: boolean;
  prefilled_assessment_data?: Partial<Record<keyof AssessmentData, string | string[]>> & {
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
    isActive?: boolean; // New field for archiving
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
    isActive?: boolean; // New field for archiving
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

export interface MasterQuestionConfig {
    form_type: 'profile' | 'assessment';
    section_order: string[];
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
    
    const [companyAssignments, setCompanyAssignments] = useState<CompanyAssignment[]>([]);
    const [companyConfigs, setCompanyConfigs] = useState<Record<string, CompanyConfig>>({});
    const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
    const [masterProfileQuestions, setMasterProfileQuestions] = useState<Record<string, Question>>({});
    const [masterQuestionConfigs, setMasterQuestionConfigs] = useState<MasterQuestionConfig[]>([]);
    const [guidanceRules, setGuidanceRules] = useState<GuidanceRule[]>([]);
    const [masterTasks, setMasterTasks] = useState<MasterTask[]>([]);
    const [masterTips, setMasterTips] = useState<MasterTip[]>([]);
    
    // This hook will now be responsible for fetching ALL data from Supabase on initial load.
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);

            const [
                { data: companiesData },
                { data: hrAssignmentsData },
                { data: questionsData },
                { data: rulesData },
                { data: companyUsersData },
                { data: companyConfigsData },
                { data: masterConfigsData },
                { data: tasksData },
                { data: tipsData },
            ] = await Promise.all([
                supabase.from('companies').select('*'),
                supabase.from('company_hr_assignments').select('*'),
                supabase.from('master_questions').select('*'),
                supabase.from('guidance_rules').select('*'),
                supabase.from('company_users').select('*'),
                supabase.from('company_question_configs').select('*'),
                supabase.from('master_question_configs').select('*'),
                supabase.from('master_tasks').select('*'),
                supabase.from('master_tips').select('*'),
            ]);

            const assignments: CompanyAssignment[] = (companiesData || []).map(c => {
                const managers = (hrAssignmentsData || [])
                    .filter(a => a.company_id === c.id)
                    .map(a => ({
                        email: a.hr_email,
                        isPrimary: a.is_primary,
                        permissions: a.permissions as HrPermissions
                    }));
                return {
                    companyId: c.id,
                    companyName: c.name,
                    version: c.version as 'basic' | 'pro',
                    maxUsers: c.max_users,
                    hrManagers: managers,
                    severanceDeadlineTime: c.severance_deadline_time,
                    severanceDeadlineTimezone: c.severance_deadline_timezone,
                    preEndDateContactAlias: c.pre_end_date_contact_alias,
                    postEndDateContactAlias: c.post_end_date_contact_alias,
                };
            });
            setCompanyAssignments(assignments);

            const assessmentQuestionsMap: Record<string, Question> = {};
            const profileQuestionsMap: Record<string, Question> = {};
            questionsData?.forEach(q => {
                const question = { ...(q.question_data as object), id: q.id, formType: q.form_type } as Question;
                if(question.formType === 'profile') {
                    profileQuestionsMap[q.id] = question;
                } else {
                    assessmentQuestionsMap[q.id] = question;
                }
            });
            setMasterQuestions(assessmentQuestionsMap);
            setMasterProfileQuestions(profileQuestionsMap);
            
            setMasterQuestionConfigs(masterConfigsData as MasterQuestionConfig[] || []);
            setGuidanceRules(rulesData as GuidanceRule[] || []);
            
            setMasterTasks((tasksData || []).map(t => ({
                id: t.id,
                type: t.type,
                name: t.name,
                category: t.category,
                detail: t.detail,
                deadlineType: t.deadline_type,
                deadlineDays: t.deadline_days,
                linkedResourceId: t.linked_resource_id,
                isCompanySpecific: t.is_company_specific,
                isActive: t.is_active,
            })) as MasterTask[]);

            setMasterTips((tipsData || []).map(t => ({
                id: t.id,
                type: t.type,
                priority: t.priority,
                category: t.category,
                text: t.text,
                isCompanySpecific: t.is_company_specific,
                isActive: t.is_active,
            })) as MasterTip[]);
            
            // Organize company users by companyId
            const usersByCompany = (companyUsersData || []).reduce((acc, user) => {
                const company = companiesData?.find(c => c.id === user.company_id);
                if (company) {
                    if (!acc[company.name]) {
                        acc[company.name] = [];
                    }
                    acc[company.name].push(user as CompanyUser);
                }
                return acc;
            }, {} as Record<string, CompanyUser[]>);

            const configs: Record<string, CompanyConfig> = {};
            (companiesData || []).forEach(company => {
                const companyConfigDb = companyConfigsData?.find(c => c.company_id === company.id);
                configs[company.name] = {
                    users: usersByCompany[company.name] || [],
                    questions: companyConfigDb?.question_overrides || {},
                    customQuestions: companyConfigDb?.custom_questions || {},
                    questionOrderBySection: companyConfigDb?.question_order_by_section || {},
                    answerGuidanceOverrides: companyConfigDb?.answer_guidance_overrides || {},
                    companyTasks: companyConfigDb?.company_tasks || [],
                    companyTips: companyConfigDb?.company_tips || [],
                };
            });
            setCompanyConfigs(configs);
            
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
    
     const addCompanyAssignment = useCallback(async (newAssignment: Omit<CompanyAssignment, 'companyId' | 'hrManagers'> & { hrManagers: { email: string, isPrimary: boolean, permissions: HrPermissions }[] }) => {
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: newAssignment.companyName,
                version: newAssignment.version,
                max_users: newAssignment.maxUsers,
                severance_deadline_time: newAssignment.severanceDeadlineTime,
                severance_deadline_timezone: newAssignment.severanceDeadlineTimezone,
                pre_end_date_contact_alias: newAssignment.preEndDateContactAlias,
                post_end_date_contact_alias: newAssignment.postEndDateContactAlias,
            })
            .select()
            .single();

        if (companyError || !companyData) {
            console.error("Error creating company", companyError);
            return;
        }

        const hrAssignments = newAssignment.hrManagers.map(hr => ({
            company_id: companyData.id,
            hr_email: hr.email,
            is_primary: hr.isPrimary,
            permissions: hr.permissions,
        }));

        const { error: hrError } = await supabase.from('company_hr_assignments').insert(hrAssignments);
        if (hrError) {
            console.error("Error assigning HR manager", hrError);
            // Consider rolling back company creation
            return;
        }
        
        const finalAssignment: CompanyAssignment = {
            ...newAssignment,
            companyId: companyData.id,
        };

        setCompanyAssignments(prev => [...prev, finalAssignment]);
        setCompanyConfigs(prev => ({...prev, [finalAssignment.companyName]: { users: [] }}));

    }, []);

    const saveMasterQuestions = useCallback(async (questionsToSave: Record<string, Question>, formType: 'profile' | 'assessment') => {
        const setFn = formType === 'profile' ? setMasterProfileQuestions : setMasterQuestions;

        const upserts = Object.values(questionsToSave).map(q => ({
            id: q.id,
            form_type: q.formType,
            question_data: {
                ...q,
                id: undefined, // Don't store id inside the jsonb
                formType: undefined, // Don't store formType inside the jsonb
            }
        }));

        const { error } = await supabase.from('master_questions').upsert(upserts, { onConflict: 'id' });

        if(error) {
            console.error("Error saving master questions:", error);
        } else {
            setFn(questionsToSave);
        }
    }, []);

    const saveMasterQuestionConfig = useCallback(async (formType: 'profile' | 'assessment', config: any) => {
        const { error } = await supabase
            .from('master_question_configs')
            .upsert({ form_type: formType, ...config }, { onConflict: 'form_type' });
        
        if (error) {
            console.error('Error saving master question config:', error);
        } else {
            setMasterQuestionConfigs(prev => {
                const existingIndex = prev.findIndex(c => c.form_type === formType);
                if (existingIndex > -1) {
                    const newConfigs = [...prev];
                    newConfigs[existingIndex] = { form_type: formType, ...config };
                    return newConfigs;
                }
                return [...prev, { form_type: formType, ...config }];
            });
        }
    }, []);


    const saveCompanyConfig = useCallback(async (companyName: string, config: CompanyConfig) => {
        const company = companyAssignments.find(c => c.companyName === companyName);
        if (!company) return;

        const { error } = await supabase.from('company_question_configs').upsert({
            company_id: company.companyId,
            question_overrides: config.questions || {},
            custom_questions: config.customQuestions || {},
            question_order_by_section: config.questionOrderBySection || {},
            answer_guidance_overrides: config.answerGuidanceOverrides || {},
            company_tasks: config.companyTasks || [],
            company_tips: config.companyTips || [],
        }, { onConflict: 'company_id' });
        
        if (error) {
            console.error("Error saving company config:", error);
        } else {
            setCompanyConfigs(prev => ({
                ...prev,
                [companyName]: { ...prev[companyName], ...config }
            }));
        }
    }, [companyAssignments]);

    const getMasterQuestionConfig = useCallback((formType: 'profile' | 'assessment') => {
        return masterQuestionConfigs.find(c => c.form_type === formType);
    }, [masterQuestionConfigs]);
    
    const saveMasterTasks = useCallback(async (tasks: MasterTask[]) => {
        const { data: existingTasksData, error: fetchError } = await supabase.from('master_tasks').select('id, created_at').in('id', tasks.map(t => t.id));
        if (fetchError) {
            console.error("Error fetching existing tasks:", fetchError);
            return;
        }

        const existingTasksMap = new Map((existingTasksData || []).map(t => [t.id, t.created_at]));

        const tasksToSave = tasks.map(t => {
            const existingCreatedAt = existingTasksMap.get(t.id);
            return {
                id: t.id,
                type: t.type,
                name: t.name,
                category: t.category,
                detail: t.detail,
                deadline_type: t.deadlineType,
                deadline_days: t.deadlineDays,
                linked_resource_id: t.linkedResourceId,
                is_company_specific: t.isCompanySpecific,
                is_active: t.isActive,
                created_at: existingCreatedAt || new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });
        const { error } = await supabase.from('master_tasks').upsert(tasksToSave);
        if (error) {
            console.error("Error saving master tasks:", error);
        } else {
            setMasterTasks(tasks);
        }
    }, []);

    const saveMasterTips = useCallback(async (tips: MasterTip[]) => {
         const { data: existingTipsData, error: fetchError } = await supabase.from('master_tips').select('id, created_at').in('id', tips.map(t => t.id));
        if (fetchError) {
            console.error("Error fetching existing tips:", fetchError);
            return;
        }

        const existingTipsMap = new Map(existingTipsData.map(t => [t.id, t.created_at]));

        const tipsToSave = tips.map(t => {
            const existingCreatedAt = existingTipsMap.get(t.id);
            return {
                id: t.id,
                type: t.type,
                priority: t.priority,
                category: t.category,
                text: t.text,
                is_company_specific: t.isCompanySpecific ?? false,
                is_active: t.isActive,
                created_at: existingCreatedAt || new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });
        const { error } = await supabase.from('master_tips').upsert(tipsToSave);
        if (error) {
            console.error("Error saving master tips:", error);
        } else {
            setMasterTips(tips);
        }
    }, []);


    // Placeholder implementations for other write functions
    const getCompanyConfig = (companyName: string | undefined, activeOnly = true, formType: 'assessment' | 'profile' | 'all' = 'assessment'): Question[] => {
        return [];
    };

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
        masterProfileQuestions,
        guidanceRules,
        masterTasks,
        masterTips,
        companyAssignments,
        companyConfigs,
        externalResources: [],

        // --- FUNCTIONS ---
        saveProfileData,
        saveAssessmentData,
        addCompanyAssignment,
        saveMasterQuestions,
        saveMasterQuestionConfig,
        saveCompanyConfig,
        saveMasterTasks,
        saveMasterTips,
        setCompanyConfigs,
        getMasterQuestionConfig,
        getCompanyConfig,
        getAllCompanyConfigs: useCallback(() => companyConfigs, [companyConfigs]),
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
        saveCompanyUsers: async () => {},
        saveCompanyResources: async () => {},
        addReviewQueueItem: async () => {},
        saveExternalResources: async () => {},
        saveGuidanceRules: async () => {},
        saveReviewQueue: async () => {},
        saveTaskMappings: async () => {},
        saveTipMappings: async () => {},
        updateCompanyAssignment: async () => {},
        saveCompanyAssignments: async () => {},
        deleteCompanyAssignment: async () => {},
        addPlatformUser: async () => {},
        deletePlatformUser: async () => {},
        getCompaniesForHr: () => [],
        getCompanyUser: () => null,
        getPlatformUserRole: () => null,
        companyAssignmentForHr: companyAssignments.find(c => c.companyName === auth?.companyName),
        profileCompletions: {}, // Placeholder
        assessmentCompletions: {}, // Placeholder
        taskMappings: [], // Placeholder
        tipMappings: [], // Placeholder
        reviewQueue: [], // Placeholder
        platformUsers: [], // Placeholder
    };
}
