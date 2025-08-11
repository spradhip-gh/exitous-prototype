

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfileData, AssessmentData, buildAssessmentSchema, buildProfileSchema } from '@/lib/schemas';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import type { ExternalResource } from '../lib/external-resources';
import { PersonalizedRecommendationsOutput, RecommendationItem, TipItem } from '@/ai/flows/personalized-recommendations';
import { useToast } from '@/hooks/use-toast';
import { addDays, parse, parseISO, differenceInYears } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';
import { tenureOptions } from '@/lib/guidance-helpers';

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
    projectManagement?: 'read' | 'write';
}

export interface HrManager {
    email: string;
    isPrimary: boolean;
    permissions: HrPermissions;
    projectAccess?: string[];
}

export interface CompanyUser {
  id: string; // The UUID from the company_users table
  company_id: string; // The UUID of the company
  project_id?: string | null;
  email: string;
  company_user_id: string;
  notification_date?: string;
  personal_email?: string;
  phone?: string;
  is_invited?: boolean;
  prefilled_assessment_data?: Partial<Record<keyof AssessmentData, string | string[]>> & {
    preEndDateContactAlias?: string;
    postEndDateContactAlias?: string;
  };
  assessment_completed_at?: string;
  profile_completed_at?: string;
  initial_unsure_answers?: string[];
  all_answers_resolved_at?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  category: 'Benefits' | 'Policies' | 'Career' | 'Other';
  content?: string;
  projectIds?: string[];
  summary?: string;
}

export interface AnswerGuidance {
    tasks?: string[];
    tips?: string[];
    noGuidanceRequired?: boolean;
}

export interface ReviewQueueItem {
    id: string;
    company_id: string;
    user_email: string;
    type: 'custom_question_guidance' | 'question_edit_suggestion' | 'ai_recommendation_audit';
    status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
    change_details: {
        questionId?: string;
        questionLabel?: string;
        reason?: string;
        optionsToAdd?: { option: string; guidance?: AnswerGuidance }[];
        optionsToRemove?: string[];
        guidanceOverrides?: Record<string, AnswerGuidance>;
        question?: Question;
        newSectionName?: string;
    };
    rejection_reason?: string;
    created_at: string;
    reviewed_at?: string;
    reviewer_id?: string;
    input_data?: any;
    output_data?: any;
    companyName?: string;
}

export interface QuestionOverride {
    label?: string;
    description?: string;
    isActive?: boolean;
    lastUpdated?: string;
    optionOverrides?: {
        add: string[];
        remove: string[];
    };
}

export interface Project {
    id: string;
    name: string;
    isArchived: boolean;
    severanceDeadlineTime?: string | null;
    severanceDeadlineTimezone?: string | null;
    preEndDateContactAlias?: string | null;
    postEndDateContactAlias?: string | null;
}

export interface CompanyConfig {
    questions?: Record<string, QuestionOverride>;
    customQuestions?: Record<string, Question>;
    questionOrderBySection?: Record<string, string[]>;
    users?: CompanyUser[];
    resources?: Resource[];
    projects?: Project[];
    companyTasks?: MasterTask[];
    companyTips?: MasterTip[];
    answerGuidanceOverrides?: Record<string, Record<string, AnswerGuidance>>;
    projectConfigs?: Record<string, {
        hiddenQuestions?: string[],
        hiddenAnswers?: Record<string, string[]>,
        answerGuidanceOverrides?: Record<string, Record<string, AnswerGuidance>>
    }>;
}

export type UpdateCompanyAssignmentPayload = Partial<Omit<CompanyAssignment, 'hrManagers'>> & {
    newPrimaryManagerEmail?: string;
    hrManagerToRemove?: string;
    hrManagerToAdd?: HrManager;
    hrManagerToUpdate?: { email: string, permissions: HrPermissions, projectAccess?: string[] };
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
    isCompanySpecific: boolean;
    isActive: boolean;
    created_at?: string;
    updated_at?: string;
    projectIds?: string[];
}

export interface TaskMapping {
    id: string;
    question_id: string;
    answer_value: string;
    task_id: string;
}

export interface MasterTip {
    id: string;
    type: 'layoff' | 'anxious';
    priority: 'High' | 'Medium' | 'Low';
    category: 'Financial' | 'Career' | 'Health' | 'Basics';
    text: string;
    isCompanySpecific: boolean;
    isActive: boolean;
    created_at?: string;
    updated_at?: string;
    projectIds?: string[];
}

export interface TipMapping {
    id: string;
    question_id: string;
    answer_value: string;
    tip_id: string;
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
    projects?: Project[];
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

const getApplicableQuestions = (allQuestions: Question[], allAnswers: any, profileDataForDeps: ProfileData | null): Question[] => {
    const applicable: Question[] = [];

    const traverse = (questions: Question[], parentIsActive: boolean = true) => {
        for (const q of questions) {
            if (!q.isActive || !parentIsActive) continue;

            let isDependencyMet = true;
            if (q.dependsOn && q.dependencySource === 'profile' && profileDataForDeps) {
                const dependencyValue = profileDataForDeps[q.dependsOn as keyof typeof profileDataForDeps];
                let isTriggered = false;
                if (Array.isArray(q.dependsOnValue)) {
                    isTriggered = q.dependsOnValue.includes(dependencyValue as string);
                } else {
                    isTriggered = dependencyValue === q.dependsOnValue;
                }
                if (!isTriggered) return;
            }
            
            if (isDependencyMet) {
                applicable.push(q);
                 if (q.subQuestions) {
                    const parentValue = allAnswers[q.id];
                    let isParentTriggered = false;
                     if (Array.isArray(parentValue)) {
                        isParentTriggered = parentValue.length > 0;
                    } else if (parentValue) {
                        isParentTriggered = true;
                    }
                    
                    if (isParentTriggered) {
                        q.subQuestions.forEach(subQ => {
                             let isSubTriggered = false;
                            if (q.type === 'checkbox') {
                                if (subQ.triggerValue === 'NOT_NONE') {
                                    isSubTriggered = Array.isArray(parentValue) && parentValue.length > 0 && !parentValue.includes('None of the above');
                                } else {
                                    isSubTriggered = Array.isArray(parentValue) && parentValue.includes(subQ.triggerValue);
                                }
                            } else {
                                isSubTriggered = parentValue === subQ.triggerValue;
                            }

                            if(isSubTriggered && subQ.isActive) {
                                traverse([subQ], true);
                            }
                        });
                    }
                }
            }
        }
    };
    
    traverse(allQuestions);
    return applicable;
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
    const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
    const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
    const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);
    
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
                { data: platformUsersData },
                { data: reviewQueueData },
                { data: resourcesData },
                { data: projectsData },
            ] = await Promise.all([
                supabase.from('companies').select('*'),
                supabase.from('company_hr_assignments').select('*'),
                supabase.from('master_questions').select('*'),
                supabase.from('guidance_rules').select('*'),
                supabase.from('company_users').select('*'),
                supabase.from('company_question_configs').select('*'),
                supabase.from('master_question_configs').select('*'),
                supabase.from('master_tasks').select('id, type, name, category, detail, deadline_type, deadline_days, "linkedResourceId", "isCompanySpecific", "isActive", created_at, updated_at'),
                supabase.from('master_tips').select('id, type, priority, category, text, "isCompanySpecific", "isActive", created_at, updated_at'),
                supabase.from('platform_users').select('*'),
                supabase.from('review_queue').select('*'),
                supabase.from('external_resources').select('*'),
                supabase.from('projects').select('*'),
            ]);
            
            setPlatformUsers((platformUsersData as PlatformUser[]) || []);
            setReviewQueue((reviewQueueData as ReviewQueueItem[]) || []);
            setExternalResources((resourcesData as ExternalResource[]) || []);

            const assignments: CompanyAssignment[] = (companiesData || []).map(c => {
                const managers = (hrAssignmentsData || [])
                    .filter(a => a.company_id === c.id)
                    .map(a => ({
                        email: a.hr_email,
                        isPrimary: a.is_primary,
                        permissions: a.permissions as HrPermissions,
                        projectAccess: a.project_access || ['all'],
                    }));
                
                const companyProjects = (projectsData || []).filter(p => p.company_id === c.id).map(p => ({
                    id: p.id,
                    name: p.name,
                    isArchived: p.is_archived,
                    severanceDeadlineTime: p.severance_deadline_time,
                    severanceDeadlineTimezone: p.severance_deadline_timezone,
                    preEndDateContactAlias: p.pre_end_date_contact_alias,
                    postEndDateContactAlias: p.post_end_date_contact_alias,
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
                    projects: companyProjects,
                };
            });
            setCompanyAssignments(assignments);

            const assessmentQuestionsMap: Record<string, Question> = {};
            const profileQuestionsMap: Record<string, Question> = {};
            questionsData?.forEach(q => {
                const question = { ...(q.question_data as object), id: q.id, formType: q.form_type, sortOrder: q.sort_order } as Question;
                if(question.formType === 'profile') {
                    profileQuestionsMap[q.id] = question;
                } else {
                    assessmentQuestionsMap[q.id] = question;
                }
            });
            setMasterQuestions(assessmentQuestionsMap);
            setMasterProfileQuestions(profileQuestionsMap);
            
            setMasterQuestionConfigs(masterConfigsData as MasterQuestionConfig[] || []);

            const mappedRules = (rulesData || []).map((rule: any) => ({
                ...rule,
                questionId: rule.question_id,
            }));
            setGuidanceRules(mappedRules as GuidanceRule[] || []);

            const mappedTasks = (tasksData || []).map((t: any) => ({
                ...t,
                deadlineType: t.deadline_type,
                deadlineDays: t.deadline_days,
                linkedResourceId: t.linkedResourceId,
                isCompanySpecific: t.isCompanySpecific,
                isActive: t.isActive,
            }));
            setMasterTasks(mappedTasks);


            const mappedTips = (tipsData || []).map((t: any) => ({
                ...t,
                isCompanySpecific: t.isCompanySpecific,
                isActive: t.isActive,
            }));
            setMasterTips(mappedTips);

            
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

            let configs: Record<string, CompanyConfig> = {};
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
                    resources: companyConfigDb?.resources || [],
                    projectConfigs: companyConfigDb?.project_configs || {},
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
        setProfileData(data); // Optimistic update for all users
        if (auth?.isPreview || !auth?.userId) {
            return;
        }

        const { error: userError } = await supabase
            .from('company_users')
            .update({ profile_completed_at: new Date().toISOString() })
            .eq('id', auth.userId);

        if (userError) {
            console.error("Error updating profile completion timestamp:", userError);
        }

        const { error } = await supabase.from('user_profiles').upsert({
            user_id: auth.userId,
            data: convertDatesToStrings(data)
        }, { onConflict: 'user_id' });
        if (error) {
            console.error("Error saving profile:", error);
            // Optionally revert optimistic update
        }
    }, [auth?.userId, auth?.isPreview]);
    
    const updateCompanyUserContact = useCallback(async (userId: string, contactInfo: { personal_email?: string, phone?: string }) => {
        if (!userId || auth?.isPreview) {
            return;
        }

        const { error } = await supabase.rpc('update_my_contact_info', {
            new_personal_email: contactInfo.personal_email,
            new_phone: contactInfo.phone,
        });

        if (error) {
            console.error("Error updating contact info:", error);
        } else {
             setCompanyConfigs(prev => {
                const newConfigs = {...prev};
                for (const companyName in newConfigs) {
                    const company = newConfigs[companyName];
                    if (company.users) {
                        const userIndex = company.users.findIndex(u => u.id === userId);
                        if (userIndex !== -1) {
                            newConfigs[companyName].users![userIndex] = {
                                ...newConfigs[companyName].users![userIndex],
                                ...contactInfo
                            };
                        }
                    }
                }
                return newConfigs;
             });
        }
    }, [auth?.isPreview]);

    const saveAssessmentData = useCallback(async (data: AssessmentData) => {
        setAssessmentData(data); // Optimistic update for all users
        if (auth?.isPreview || !auth?.userId) {
            return;
        }
    
        const { data: companyUser, error: userError } = await supabase
            .from('company_users')
            .select('assessment_completed_at, initial_unsure_answers')
            .eq('id', auth.userId) 
            .single();
    
        if (userError) {
            console.warn("Could not fetch user for analytics. This may not be an error.", userError);
        } else if (companyUser) {
            const now = new Date().toISOString();
            const updates: Partial<CompanyUser> = {};
            const unsureQuestions = Object.entries(data).filter(([, value]) => value === 'Unsure').map(([key]) => key);
    
            if (!companyUser.assessment_completed_at) {
                updates.assessment_completed_at = now;
                updates.initial_unsure_answers = unsureQuestions;
            }
    
            if (companyUser.initial_unsure_answers && unsureQuestions.length === 0) {
                updates.all_answers_resolved_at = now;
            }
    
            if (Object.keys(updates).length > 0) {
                await supabase.from('company_users').update(updates).eq('id', auth.userId);
            }
        }
    
        const { error: saveError } = await supabase.from('user_assessments').upsert({
            user_id: auth.userId,
            data: convertDatesToStrings(data)
        }, { onConflict: 'user_id' });
    
        if (saveError) {
            console.error("Error saving assessment:", saveError);
        }
    }, [auth?.userId, auth?.isPreview]);
    
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

    const updateCompanyAssignment = useCallback(async (companyName: string, payload: UpdateCompanyAssignmentPayload) => {
        const assignment = companyAssignments.find(a => a.companyName === companyName);
        if (!assignment) return;
        
        if (payload.delete) {
            const { error } = await supabase.from('companies').delete().eq('id', assignment.companyId);
            if (error) {
                 console.error("Error deleting company", error);
            } else {
                 setCompanyAssignments(prev => prev.filter(a => a.companyName !== companyName));
            }
            return;
        }

        if (payload.hrManagerToAdd) {
             const { error } = await supabase.from('company_hr_assignments').insert({
                company_id: assignment.companyId,
                hr_email: payload.hrManagerToAdd.email,
                is_primary: payload.hrManagerToAdd.isPrimary,
                permissions: payload.hrManagerToAdd.permissions,
            });
            if (error) console.error("Error adding HR Manager", error);
        }

        if (payload.hrManagerToRemove) {
             const { error } = await supabase.from('company_hr_assignments').delete()
                .eq('company_id', assignment.companyId)
                .eq('hr_email', payload.hrManagerToRemove);
             if (error) console.error("Error removing HR Manager", error);
        }

        if (payload.hrManagerToUpdate) {
             const { error } = await supabase.from('company_hr_assignments').update({
                permissions: payload.hrManagerToUpdate.permissions,
                project_access: payload.hrManagerToUpdate.projectAccess
            })
            .eq('company_id', assignment.companyId)
            .eq('hr_email', payload.hrManagerToUpdate.email);
            if (error) console.error("Error updating permissions", error);
        }

        if (payload.newPrimaryManagerEmail) {
            const currentPrimary = assignment.hrManagers.find(hr => hr.isPrimary);
            if (currentPrimary) {
                await supabase.from('company_hr_assignments').update({ is_primary: false })
                    .eq('company_id', assignment.companyId)
                    .eq('hr_email', currentPrimary.email);
            }
             await supabase.from('company_hr_assignments').update({ is_primary: true })
                .eq('company_id', assignment.companyId)
                .eq('hr_email', payload.newPrimaryManagerEmail);
        }
        
        const companyUpdatePayload = {
            version: payload.version,
            max_users: payload.maxUsers,
            severance_deadline_time: payload.severanceDeadlineTime,
            severance_deadline_timezone: payload.severanceDeadlineTimezone,
            pre_end_date_contact_alias: payload.preEndDateContactAlias,
            post_end_date_contact_alias: payload.postEndDateContactAlias,
        };
        const definedUpdates = Object.fromEntries(Object.entries(companyUpdatePayload).filter(([, v]) => v !== undefined));

        if (Object.keys(definedUpdates).length > 0) {
             const { error } = await supabase.from('companies').update(definedUpdates).eq('id', assignment.companyId);
             if(error) console.error("Error updating company settings", error);
        }

         const { data, error } = await supabase
            .from('companies')
            .select('*, company_hr_assignments!inner(*)')
            .eq('name', companyName)
            .single();

         if (data) {
            const updatedAssignment: CompanyAssignment = {
                companyId: data.id,
                companyName: data.name,
                version: data.version,
                maxUsers: data.max_users,
                severanceDeadlineTime: data.severance_deadline_time,
                severanceDeadlineTimezone: data.severance_deadline_timezone,
                preEndDateContactAlias: data.pre_end_date_contact_alias,
                postEndDateContactAlias: data.post_end_date_contact_alias,
                hrManagers: data.company_hr_assignments.map((a: any) => ({
                    email: a.hr_email,
                    isPrimary: a.is_primary,
                    permissions: a.permissions
                }))
            };
            setCompanyAssignments(prev => prev.map(a => a.companyName === companyName ? updatedAssignment : a));
         }

    }, [companyAssignments]);

    const saveMasterQuestions = useCallback(async (questionsToSave: Record<string, Question>, formType: 'profile' | 'assessment') => {
        const setFn = formType === 'profile' ? setMasterProfileQuestions : setMasterQuestions;

        const questionList = Object.values(questionsToSave);

        questionList.forEach((q, index) => {
            if (q.sortOrder === undefined || q.sortOrder === null) {
                q.sortOrder = index;
            }
        });

        const upserts = questionList.map(q => ({
            id: q.id,
            form_type: q.formType,
            sort_order: q.sortOrder,
            question_data: {
                ...q,
                id: undefined, 
                formType: undefined,
                sortOrder: undefined,
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

        const payload = {
            company_id: company.companyId,
            question_overrides: config.questions || {},
            custom_questions: config.customQuestions || {},
            question_order_by_section: config.questionOrderBySection || {},
            answer_guidance_overrides: config.answerGuidanceOverrides || {},
            company_tasks: config.companyTasks || [],
            company_tips: config.companyTips || [],
            project_configs: config.projectConfigs || {},
        };

        const { error } = await supabase.from('company_question_configs').upsert(payload, { onConflict: 'company_id' });
        
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
        const tasksToSave = tasks.map(t => {
            return {
                ...t,
                deadline_type: t.deadlineType,
                deadline_days: t.deadlineDays,
                "linkedResourceId": t.linkedResourceId,
                "isCompanySpecific": t.isCompanySpecific,
                "isActive": t.isActive,
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
        const tipsToSave = tips.map(t => {
            return {
                ...t,
                "isCompanySpecific": t.isCompanySpecific,
                "isActive": t.isActive,
            };
        });
        const { error } = await supabase.from('master_tips').upsert(tipsToSave);
        if (error) {
            console.error("Error saving master tips:", error);
        } else {
            setMasterTips(tips);
        }
    }, []);
    
    const saveGuidanceRules = useCallback(async (rules: GuidanceRule[]) => {
        const existingIds = new Set(guidanceRules.map(r => r.id));
        const newIds = new Set(rules.map(r => r.id));
        const idsToDelete = [...existingIds].filter(id => !newIds.has(id));

        if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from('guidance_rules').delete().in('id', idsToDelete);
            if (deleteError) {
                console.error("Error deleting guidance rules:", deleteError);
                return;
            }
        }

        if (rules.length > 0) {
            const rulesToSave = rules.map(r => {
                const { questionId, ...rest } = r;
                return { ...rest, question_id: questionId };
            });

            const { error } = await supabase.from('guidance_rules').upsert(rulesToSave);
            if (error) {
                console.error("Error saving guidance rules:", error);
                return;
            }
        }
        
        setGuidanceRules(rules);

    }, [guidanceRules]);
    
    const addPlatformUser = useCallback(async (user: Omit<PlatformUser, 'id'>) => {
        const { data, error } = await supabase.from('platform_users').insert(user).select().single();
        if (error) {
            console.error("Error adding platform user:", error);
        } else if (data) {
            setPlatformUsers(prev => [...prev, data as PlatformUser]);
        }
    }, []);

    const deletePlatformUser = useCallback(async (email: string) => {
        const { error } = await supabase.from('platform_users').delete().eq('email', email);
        if (error) {
            console.error("Error deleting platform user:", error);
        } else {
            setPlatformUsers(prev => prev.filter(u => u.email !== email));
        }
    }, []);

    const saveCompanyAssignments = useCallback(async (assignmentsToSave: CompanyAssignment[]) => {
        const toUpsert: any[] = [];
        const toDelete: { company_id: string; hr_email: string }[] = [];
    
        const allCurrentManagers = new Set(companyAssignments.flatMap(c => c.hrManagers.map(h => `${c.companyId}-${h.email}`)));
        const allNewManagers = new Set(assignmentsToSave.flatMap(c => c.hrManagers.map(h => `${c.companyId}-${h.email}`)));
    
        allCurrentManagers.forEach(managerKey => {
            if (!allNewManagers.has(managerKey)) {
                const [companyId, email] = managerKey.split('-');
                toDelete.push({ company_id: companyId, hr_email: email });
            }
        });
    
        for (const updatedAssignment of assignmentsToSave) {
            for (const updatedManager of updatedAssignment.hrManagers) {
                toUpsert.push({
                    company_id: updatedAssignment.companyId,
                    hr_email: updatedManager.email,
                    is_primary: updatedManager.isPrimary,
                    permissions: updatedManager.permissions,
                    project_access: updatedManager.projectAccess,
                });
            }
        }
    
        if (toDelete.length > 0) {
            const deletePromises = toDelete.map(d =>
                supabase.from('company_hr_assignments').delete().match(d)
            );
            await Promise.all(deletePromises);
        }
    
        if (toUpsert.length > 0) {
            const { error: upsertError } = await supabase.from('company_hr_assignments').upsert(toUpsert, { onConflict: 'company_id, hr_email' });
            if (upsertError) console.error("Error upserting assignments", upsertError);
        }
    
        setCompanyAssignments(assignmentsToSave);
    }, [companyAssignments]);

    const getCompanyConfig = useCallback((companyName: string | undefined, forEndUser = true, formType: 'assessment' | 'profile' = 'assessment'): Question[] => {
        if (!companyName) return [];
        const companyConfig = companyConfigs[companyName];
        const masterSource = formType === 'profile' ? masterProfileQuestions : masterQuestions;
        
        let finalQuestions: Question[] = [];
    
        for (const id in masterSource) {
            const masterQ = { ...masterSource[id] };
            if (!masterQ.isActive) continue; // Skip inactive master questions
            if (masterQ.formType !== formType) continue;
            
            const override = companyConfig?.questions?.[id];
            let isCompanyActive = override?.isActive === undefined ? true : override.isActive;

            // In preview mode, check project-specific hidden questions
            if (auth?.isPreview && auth.previewProjectId) {
                const projectConfig = companyConfig?.projectConfigs?.[auth.previewProjectId];
                if (projectConfig?.hiddenQuestions?.includes(id)) {
                    isCompanyActive = false;
                }
            }
    
            if (!forEndUser || isCompanyActive) {
                let finalQuestion: Question = { ...masterQ };
                
                if (override) {
                    finalQuestion.isModified = !!(override.label || override.description || override.optionOverrides);
                    if (override.label) finalQuestion.label = override.label;
                    if (override.description) finalQuestion.description = override.description;
                    
                    if (override.optionOverrides) {
                        const baseOptions = masterQ.options || [];
                        const toRemove = new Set(override.optionOverrides.remove || []);
                        const toAdd = override.optionOverrides.add || [];
                        
                        let newOptions = baseOptions.filter(opt => !toRemove.has(opt));
                        newOptions = [...newOptions, ...toAdd.filter(opt => !newOptions.includes(opt))];
                        finalQuestion.options = newOptions;
                    }
    
                    if (override.lastUpdated) finalQuestion.lastUpdated = override.lastUpdated;
                }
                
                finalQuestion.isActive = forEndUser ? (masterQ.isActive && isCompanyActive) : isCompanyActive;
                finalQuestions.push(finalQuestion);
            }
        }
        
        const companyCustomQuestions = companyConfig?.customQuestions || {};
        for(const id in companyCustomQuestions) {
            const customQ = companyCustomQuestions[id];
            if(customQ.formType === formType && customQ.isActive) {
                // In preview mode, filter custom questions by project ID
                if (auth?.isPreview && auth.previewProjectId) {
                    if (customQ.projectIds && customQ.projectIds.length > 0 && !customQ.projectIds.includes(auth.previewProjectId)) {
                        continue; // Skip if it's assigned to other projects
                    }
                }
                finalQuestions.push({ ...customQ, isCustom: true });
            }
        }
    
        const questionTree = buildQuestionTreeFromMap(finalQuestions.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, Question>));
        
        return questionTree;
    }, [companyConfigs, masterQuestions, masterProfileQuestions, auth?.isPreview, auth?.previewProjectId]);
    
    
    const getCompanyUser = useMemo(() => (email: string | undefined) => {
        if (!email || !companyConfigs) return null;
        for (const companyName in companyConfigs) {
            const user = companyConfigs[companyName]?.users?.find(
                (u) => u.email.toLowerCase() === email.toLowerCase()
            );
            if (user) {
                return { companyName, user };
            }
        }
        return null;
    }, [companyConfigs]);
    
     const getProfileCompletion = useCallback(() => {
        const rootQuestions = getCompanyConfig(auth?.companyName, true, 'profile');
        const companyUser = getCompanyUser(auth?.email)?.user;
        const allAnswers = {
            ...profileData,
            personalEmail: companyUser?.personal_email,
            phone: companyUser?.phone,
        };

        const applicableQuestions = getApplicableQuestions(rootQuestions, allAnswers, profileData);
        
        const isAnswered = (q: Question) => {
            const value = allAnswers[q.id as keyof typeof allAnswers];
            return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
        }

        const completedQuestions = applicableQuestions.filter(isAnswered);
        const incompleteQuestions = applicableQuestions.filter(q => !isAnswered(q));
        
        const percentage = applicableQuestions.length > 0 ? (completedQuestions.length / applicableQuestions.length) * 100 : 100;
        
        return {
            percentage,
            isComplete: completedQuestions.length === applicableQuestions.length,
            totalApplicable: applicableQuestions.length,
            completed: completedQuestions.length,
            incompleteQuestions,
        };
    }, [profileData, getCompanyConfig, getCompanyUser, auth?.email, auth?.companyName]);

    const getAssessmentCompletion = useCallback(() => {
        if (!auth?.companyName) return { percentage: 0, sections: [], isComplete: false, totalApplicable: 0, completed: 0, incompleteQuestions: [] };
        
        const allCompanyQuestions = getCompanyConfig(auth.companyName, true, 'assessment');
        if (allCompanyQuestions.length === 0) return { percentage: 100, sections: [], isComplete: true, totalApplicable: 0, completed: 0, incompleteQuestions: [] };

        const rootQuestions = allCompanyQuestions.filter(q => !q.parentId);

        const applicableQuestions = getApplicableQuestions(rootQuestions, { ...profileData, ...assessmentData }, profileData);
        
        const sectionsMap: Record<string, { total: number, completed: number }> = {};

         const isAnswered = (q: Question) => {
            const value = (assessmentData as any)?.[q.id];
            return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
        }
        
        const incompleteQuestions = applicableQuestions.filter(q => !isAnswered(q));

        for (const q of applicableQuestions) {
            if (!q.section) continue;
            if (!sectionsMap[q.section]) {
                sectionsMap[q.section] = { total: 0, completed: 0 };
            }
            sectionsMap[q.section].total++;
            if (isAnswered(q)) {
                sectionsMap[q.section].completed++;
            }
        }
        
        let totalQuestions = applicableQuestions.length;
        let totalCompleted = totalQuestions - incompleteQuestions.length;
        
        const sectionsArray = Object.entries(sectionsMap).map(([name, counts]) => ({
            name,
            ...counts,
            percentage: counts.total > 0 ? (counts.completed / counts.total) * 100 : 100,
        }));

        const overallPercentage = totalQuestions > 0 ? (totalCompleted / totalQuestions) * 100 : 0;

        return {
            percentage: overallPercentage,
            sections: sectionsArray,
            isComplete: overallPercentage === 100,
            totalApplicable: totalQuestions,
            completed: totalCompleted,
            incompleteQuestions,
        };

    }, [auth?.companyName, getCompanyConfig, assessmentData, profileData]);

    const addReviewQueueItem = useCallback(async (item: Omit<ReviewQueueItem, 'id'|'created_at'|'company_id'> & { companyName?: string }) => {
        const companyId = companyAssignments.find(c => c.companyName === item.companyName)?.companyId;
        if (!companyId) {
            console.error("Error adding to review queue: Could not find company ID for review item");
            return;
        }

        const { companyName, ...restOfItem } = item;
        const payload = { ...restOfItem, company_id: companyId };
        
        const { data, error } = await supabase.from('review_queue').insert(payload).select().single();
        if (error) {
            console.error("Error adding to review queue", error);
        } else if(data) {
            setReviewQueue(prev => [...prev, data as ReviewQueueItem]);
        }
    }, [companyAssignments]);

    const processReviewQueueItem = useCallback(async (item: ReviewQueueItem, status: 'approved' | 'rejected' | 'reviewed', rejectionReason?: string): Promise<boolean> => {
        const reviewerId = auth?.userId;
        if (!reviewerId) {
            console.error("No reviewer ID found, cannot process queue item.");
            return false;
        }
    
        if (status === 'approved' && item.type === 'question_edit_suggestion') {
            const companyName = companyAssignments.find(c => c.companyId === item.company_id)?.companyName;
            if (!companyName) return false;
            
            const currentConfig = companyConfigs[companyName] || {};
            const newConfig = JSON.parse(JSON.stringify(currentConfig));
            const { questionId, optionsToAdd = [], optionsToRemove = [] } = item.change_details || {};
            if (!questionId) return false;
    
            if (!newConfig.questions) newConfig.questions = {};
            const override = newConfig.questions[questionId] || {};
            
            if (!override.optionOverrides) {
                override.optionOverrides = { add: [], remove: [] };
            }
            delete (override as any).options; 

            const additions = new Set(override.optionOverrides.add || []);
            const newAdditions = optionsToAdd.map((o: {option: string}) => o.option);
            newAdditions.forEach(item => additions.add(item));

            const removals = new Set(override.optionOverrides.remove || []);
            (optionsToRemove || []).forEach((item: string) => removals.add(item));
            
            // Ensure no item is in both add and remove
            additions.forEach(a => { if(removals.has(a)) removals.delete(a); });
            removals.forEach(r => { if(additions.has(r)) additions.delete(r); });

            override.optionOverrides.add = Array.from(additions);
            override.optionOverrides.remove = Array.from(removals);
            
            newConfig.questions[questionId] = { ...override, lastUpdated: new Date().toISOString() };
    
            if (optionsToAdd.length > 0) {
                optionsToAdd.forEach((suggestion: { option: string; guidance?: AnswerGuidance }) => {
                    if (suggestion.guidance) {
                        if (!newConfig.answerGuidanceOverrides) newConfig.answerGuidanceOverrides = {};
                        if (!newConfig.answerGuidanceOverrides[questionId]) newConfig.answerGuidanceOverrides[questionId] = {};
                        newConfig.answerGuidanceOverrides[questionId][suggestion.option] = suggestion.guidance;
                    }
                });
            }
    
            await saveCompanyConfig(companyName, newConfig);
        }
        
        if (status === 'rejected' && item.type === 'custom_question_guidance') {
            const companyName = companyAssignments.find(c => c.companyId === item.company_id)?.companyName;
            if (!companyName) return false;
            const currentConfig = companyConfigs[companyName];
            const newConfig = JSON.parse(JSON.stringify(currentConfig));
            const { question } = item.change_details || {};
            if (!question?.id || !newConfig.customQuestions?.[question.id]) return false;
    
            newConfig.customQuestions[question.id].isActive = false;
            await saveCompanyConfig(companyName, newConfig);
        }
    
        const { data: updatedItem, error } = await supabase
            .from('review_queue')
            .update({ status, reviewed_at: new Date().toISOString(), reviewer_id: reviewerId, rejection_reason: rejectionReason })
            .eq('id', item.id)
            .select()
            .single();
    
        if (error) {
            console.error('Error updating review item status:', error);
            return false;
        }
        
        setReviewQueue(prev => prev.map(i => i.id === item.id ? (updatedItem as ReviewQueueItem) : i));
        return true;
    }, [auth?.userId, companyAssignments, companyConfigs, saveCompanyConfig]);
    
    const saveExternalResources = useCallback(async (resources: ExternalResource[]) => {
        const { error } = await supabase.from('external_resources').upsert(resources);
        if (error) {
            console.error("Error saving external resources:", error);
        } else {
            setExternalResources(resources);
        }
    }, []);

    const getMappedRecommendations = useCallback(() => {
        if (!profileData || !assessmentData || !auth?.companyName) return { tasks: [], tips: [] };

        const companyUser = getCompanyUser(auth?.email)?.user;
        const allUserAnswers = { ...profileData, ...assessmentData };
        const companyConfig = companyConfigs[auth.companyName];
        const allCompanyTasks = [...masterTasks, ...(companyConfig?.companyTasks || [])];
        const allCompanyTips = [...masterTips, ...(companyConfig?.companyTips || [])];
        
        const tasks: RecommendationItem[] = [];
        const tips: TipItem[] = [];
        const addedTaskIds = new Set<string>();
        const addedTipIds = new Set<string>();

        // 1. Evaluate Guidance Rules (master rules)
        guidanceRules.forEach(rule => {
            let isMatch = false;
            if (rule.type === 'direct') {
                isMatch = rule.conditions.every(cond => {
                    if (cond.type !== 'question' || !cond.questionId || !cond.answer) return false;
                    const userAnswer = allUserAnswers[cond.questionId as keyof typeof allUserAnswers];
                    return Array.isArray(userAnswer) ? userAnswer.includes(cond.answer) : userAnswer === cond.answer;
                });
            } else if (rule.type === 'calculated') {
                 let calculatedValue: number | null = null;
                if (rule.calculation?.type === 'age' && profileData.birthYear) {
                    calculatedValue = new Date().getFullYear() - profileData.birthYear;
                } else if (rule.calculation?.type === 'tenure' && assessmentData.startDate && assessmentData.finalDate) {
                     try {
                        const start = assessmentData.startDate instanceof Date ? assessmentData.startDate : parseISO(assessmentData.startDate as string);
                        const end = assessmentData.finalDate instanceof Date ? assessmentData.finalDate : parseISO(assessmentData.finalDate as string);
                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                            calculatedValue = differenceInYears(end, start);
                        }
                    } catch {}
                }
                 if (calculatedValue !== null) {
                    const matchingRange = rule.ranges?.find(range => calculatedValue! >= range.from && calculatedValue! < range.to);
                    if (matchingRange && !matchingRange.assignments.noGuidanceRequired) {
                        (matchingRange.assignments.taskIds || []).forEach(taskId => addedTaskIds.add(taskId));
                        (matchingRange.assignments.tipIds || []).forEach(tipId => addedTipIds.add(tipId));
                    }
                }
            }
            if (isMatch && !rule.assignments.noGuidanceRequired) {
                (rule.assignments.taskIds || []).forEach(taskId => addedTaskIds.add(taskId));
                (rule.assignments.tipIds || []).forEach(tipId => addedTipIds.add(tipId));
            }
        });
        
        // 2. Evaluate Company-specific Answer Guidance Overrides
        Object.entries(allUserAnswers).forEach(([questionId, answer]) => {
            if (!answer) return;
            
            const handleAnswer = (ans: string) => {
                // Check for project-specific guidance first
                const projectConfig = companyConfig?.projectConfigs?.[companyUser?.project_id || ''];
                const projectGuidance = projectConfig?.answerGuidanceOverrides?.[questionId]?.[ans];

                if (projectGuidance && !projectGuidance.noGuidanceRequired) {
                    (projectGuidance.tasks || []).forEach(taskId => addedTaskIds.add(taskId));
                    (projectGuidance.tips || []).forEach(tipId => addedTipIds.add(tipId));
                    return; // Stop if project-specific guidance is found
                }

                // Fallback to company-wide guidance
                const companyGuidance = companyConfig?.answerGuidanceOverrides?.[questionId]?.[ans];
                if (companyGuidance && !companyGuidance.noGuidanceRequired) {
                    (companyGuidance.tasks || []).forEach(taskId => addedTaskIds.add(taskId));
                    (companyGuidance.tips || []).forEach(tipId => addedTipIds.add(tipId));
                }
            };

            if (Array.isArray(answer)) {
                answer.forEach(handleAnswer);
            } else {
                handleAnswer(String(answer));
            }
        });

        // 3. Compile the final lists from the collected IDs
        addedTaskIds.forEach(taskId => {
            const task = allCompanyTasks.find(t => t.id === taskId);
            if (task) {
                tasks.push({
                    taskId: task.id,
                    task: task.name,
                    category: task.category,
                    timeline: '', // AI will fill this
                    details: task.detail,
                    isCompanySpecific: task.isCompanySpecific,
                });
            }
        });

        addedTipIds.forEach(tipId => {
            const tip = allCompanyTips.find(t => t.id === tipId);
            if (tip) {
                tips.push({
                    tipId: tip.id,
                    text: tip.text,
                    category: tip.category,
                    priority: tip.priority,
                    isCompanySpecific: tip.isCompanySpecific,
                });
            }
        });

        return { tasks, tips };
    }, [profileData, assessmentData, guidanceRules, companyConfigs, masterTasks, masterTips, auth?.companyName, getCompanyUser, auth?.email]);

    const saveCompanyProjects = useCallback(async (companyName: string, newProjects: Project[]) => {
        if (!companyName) return;
        const companyId = companyAssignments.find(c => c.companyName === companyName)?.companyId;
        if (!companyId) return;

        // Separate new from existing to handle upsert logic
        const toUpsert = newProjects.map(p => ({
            id: p.id,
            company_id: companyId,
            name: p.name,
            is_archived: p.isArchived,
            severance_deadline_time: p.severanceDeadlineTime,
            severance_deadline_timezone: p.severanceDeadlineTimezone,
            pre_end_date_contact_alias: p.preEndDateContactAlias,
            post_end_date_contact_alias: p.postEndDateContactAlias,
        }));
        
        // Find projects to delete
        const currentProjects = companyAssignments.find(c => c.companyName === companyName)?.projects || [];
        const newProjectIds = new Set(newProjects.map(p => p.id));
        const toDelete = currentProjects.filter(p => !newProjectIds.has(p.id));

        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase.from('projects').delete().in('id', toDelete.map(p => p.id));
            if (deleteError) console.error("Error deleting projects:", deleteError);
        }

        if (toUpsert.length > 0) {
             const { error } = await supabase.from('projects').upsert(toUpsert, { onConflict: 'id' });
            if (error) {
                console.error("Error saving projects:", error);
            }
        }
       
        setCompanyAssignments(prev => prev.map(c => 
            c.companyName === companyName ? { ...c, projects: newProjects } : c
        ));

    }, [companyAssignments]);

    return {
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
        externalResources,
        platformUsers,
        reviewQueue,
        setReviewQueue,
        saveProfileData,
        saveAssessmentData,
        addCompanyAssignment,
        updateCompanyAssignment,
        saveMasterQuestions,
        saveMasterQuestionConfig,
        saveCompanyConfig,
        saveMasterTasks,
        saveMasterTips,
        setCompanyConfigs,
        getMasterQuestionConfig,
        getCompanyConfig,
        getAllCompanyConfigs: useCallback(() => companyConfigs, [companyConfigs]),
        saveGuidanceRules,
        addPlatformUser,
        deletePlatformUser,
        getCompanyUser,
        updateCompanyUserContact,
        saveCompanyAssignments,
        isAssessmentComplete: !!assessmentData?.workStatus,
        clearRecommendations: () => setRecommendations(null),
        saveRecommendations: (recs: PersonalizedRecommendationsOutput) => setRecommendations(recs),
        toggleTaskCompletion: () => {},
        updateTaskDate: () => {},
        addCustomDeadline: () => {},
        clearData: () => {},
        getProfileCompletion,
        getAssessmentCompletion,
        getUnsureAnswers: () => ({ count: 0, firstSection: null }),
        getMappedRecommendations,
        getTargetTimezone: () => 'UTC',
        saveCompanyUsers: async () => {},
        saveCompanyResources: async () => {},
        addReviewQueueItem,
        processReviewQueueItem,
        saveExternalResources,
        saveTaskMappings: async () => {},
        saveTipMappings: async () => {},
        deleteCompanyAssignment: async () => {},
        getCompaniesForHr: () => [],
        getPlatformUserRole: () => null,
        companyAssignmentForHr: companyAssignments.find(c => c.companyName === auth?.companyName),
        profileCompletions: {},
        assessmentCompletions: {},
        taskMappings: [],
        tipMappings: [],
        saveCompanyProjects,
    };
}
