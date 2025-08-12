

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import { buildAssessmentSchema, buildProfileSchema, ProfileData, AssessmentData } from '@/lib/schemas';
import { PersonalizedRecommendationsOutput, RecommendationItem, TipItem } from '@/ai/flows/personalized-recommendations';
import { useToast } from '@/hooks/use-toast';
import { parseISO, differenceInYears } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import {
    UserDataContext,
    CompanyAssignment,
    CompanyConfig,
    CompanyUser,
    GuidanceRule,
    MasterTask,
    MasterTip,
    ExternalResource,
    MasterQuestionConfig,
    ReviewQueueItem,
    PlatformUser,
    applyQuestionOverrides,
} from './use-user-data';
import { tenureOptions } from '@/lib/guidance-helpers';

const PREVIEW_SUFFIX = '-hr-preview';

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
                if (!isTriggered) continue; // Use continue to check other questions in the same level
            }
            
            applicable.push(q);

            if (q.subQuestions) {
                const parentValue = allAnswers[q.id];
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
    };
    
    traverse(allQuestions);
    return applicable;
};

export function EndUserProvider({ children }: { children: React.ReactNode }) {
    const { auth } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // State for end-user specific data
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
    const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
    const [customDeadlines, setCustomDeadlines] = useState<Record<string, { label: string; date: string }>>({});
    const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
    
    // State for data needed by end-user, but fetched from global tables
    const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
    const [companyAssignment, setCompanyAssignment] = useState<CompanyAssignment | null>(null);
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
    const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
    const [masterProfileQuestions, setMasterProfileQuestions] = useState<Record<string, Question>>({});
    const [masterQuestionConfigs, setMasterQuestionConfigs] = useState<MasterQuestionConfig[]>([]);
    const [guidanceRules, setGuidanceRules] = useState<GuidanceRule[]>([]);
    const [masterTasks, setMasterTasks] = useState<MasterTask[]>([]);
    const [masterTips, setMasterTips] = useState<MasterTip[]>([]);
    const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);

    const keySuffix = auth?.isPreview ? PREVIEW_SUFFIX : '';
    const PROFILE_KEY = `exitbetter-profile${keySuffix}`;
    const ASSESSMENT_KEY = `exitbetter-assessment${keySuffix}`;
    const COMPLETED_TASKS_KEY = `exitbetter-completed-tasks${keySuffix}`;
    const TASK_DATE_OVERRIDES_KEY = `exitbetter-task-date-overrides${keySuffix}`;
    const CUSTOM_DEADLINES_KEY = `exitbetter-custom-deadlines${keySuffix}`;
    const RECOMMENDATIONS_KEY = `exitbetter-recommendations${keySuffix}`;
    const USER_TIMEZONE_KEY = `exitbetter-user-timezone${keySuffix}`;

    useEffect(() => {
        const loadFromLocalStorage = () => {
            try {
                const storedProfile = localStorage.getItem(PROFILE_KEY);
                if (storedProfile) setProfileData(convertStringsToDates(JSON.parse(storedProfile)));

                const storedAssessment = localStorage.getItem(ASSESSMENT_KEY);
                if (storedAssessment) setAssessmentData(convertStringsToDates(JSON.parse(storedAssessment)));
                else if (companyUser?.prefilled_assessment_data) {
                    setAssessmentData(convertStringsToDates(companyUser.prefilled_assessment_data));
                }

                const storedCompleted = localStorage.getItem(COMPLETED_TASKS_KEY);
                if (storedCompleted) setCompletedTasks(new Set(JSON.parse(storedCompleted)));

                const storedOverrides = localStorage.getItem(TASK_DATE_OVERRIDES_KEY);
                if (storedOverrides) setTaskDateOverrides(JSON.parse(storedOverrides));

                const storedCustom = localStorage.getItem(CUSTOM_DEADLINES_KEY);
                if (storedCustom) setCustomDeadlines(JSON.parse(storedCustom));
                
                const storedRecs = localStorage.getItem(RECOMMENDATIONS_KEY);
                if(storedRecs) setRecommendations(JSON.parse(storedRecs));
                
            } catch (error) {
                console.error("Failed to load data from local storage", error);
            }
        };

        const fetchEndUserData = async () => {
            if (!auth?.email) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);

            // Fetch CompanyUser and Company info
            const { data: userData, error: userError } = await supabase
                .from('company_users')
                .select(`*, companies(*, company_hr_assignments(*), projects(*))`)
                .eq('email', auth.email)
                .single();

            if (userError || !userData) {
                console.error("End-user data fetch error:", userError);
                setIsLoading(false);
                return;
            }
            
            const company = userData.companies;
            if (!company) {
                console.error("No company associated with end user.");
                setIsLoading(false);
                return;
            }
            setCompanyUser(userData as CompanyUser);
            
            const fetchedAssignment: CompanyAssignment = {
                companyId: company.id,
                companyName: company.name,
                version: company.version as 'basic' | 'pro',
                maxUsers: company.max_users,
                hrManagers: (company.company_hr_assignments || []).map((a: any) => ({
                    email: a.hr_email,
                    isPrimary: a.is_primary,
                    permissions: a.permissions,
                    projectAccess: a.project_access || ['all'],
                })),
                severanceDeadlineTime: company.severance_deadline_time,
                severanceDeadlineTimezone: company.severance_deadline_timezone,
                preEndDateContactAlias: company.pre_end_date_contact_alias,
                postEndDateContactAlias: company.post_end_date_contact_alias,
                projects: company.projects,
            };
            setCompanyAssignment(fetchedAssignment);

            // Fetch config for THIS company only
            const { data: companyConfigData, error: configError } = await supabase
                .from('company_question_configs')
                .select('*')
                .eq('company_id', company.id)
                .single();
            if (configError) console.error("Could not fetch company config:", configError);
            
            const finalCompanyConfig: CompanyConfig = {
                questions: companyConfigData?.question_overrides || {},
                customQuestions: companyConfigData?.custom_questions || {},
                questionOrderBySection: companyConfigData?.question_order_by_section || {},
                answerGuidanceOverrides: companyConfigData?.answer_guidance_overrides || {},
                companyTasks: companyConfigData?.company_tasks || [],
                companyTips: companyConfigData?.company_tips || [],
                projectConfigs: companyConfigData?.project_configs || {},
            };
            setCompanyConfig(finalCompanyConfig);

            // Fetch all master data (could be optimized further with caching)
            const [
                { data: questionsData },
                { data: masterConfigsData },
                { data: rulesData },
                { data: tasksData },
                { data: tipsData },
                { data: resourcesData },
            ] = await Promise.all([
                supabase.from('master_questions').select('*'),
                supabase.from('master_question_configs').select('*'),
                supabase.from('guidance_rules').select('*'),
                supabase.from('master_tasks').select('id, type, name, category, detail, deadline_type, deadline_days, "linkedResourceId", "isCompanySpecific", "isActive"'),
                supabase.from('master_tips').select('id, type, priority, category, text, "isCompanySpecific", "isActive"'),
                supabase.from('external_resources').select('*'),
            ]);

            const assessmentQuestionsMap: Record<string, Question> = {};
            const profileQuestionsMap: Record<string, Question> = {};
            (questionsData || []).forEach(q => {
                const question = { ...(q.question_data as object), id: q.id, formType: q.form_type, sortOrder: q.sort_order } as Question;
                if (question.formType === 'profile') profileQuestionsMap[q.id] = question;
                else assessmentQuestionsMap[q.id] = question;
            });
            setMasterProfileQuestions(profileQuestionsMap);
            setMasterQuestions(assessmentQuestionsMap);
            setMasterQuestionConfigs(masterConfigsData as MasterQuestionConfig[] || []);
            setGuidanceRules((rulesData || []).map((rule: any) => ({ ...rule, questionId: rule.question_id })) as GuidanceRule[]);
            setMasterTasks((tasksData || []).map((t: any) => ({...t, deadlineType: t.deadline_type, deadlineDays: t.deadline_days, linkedResourceId: t.linkedResourceId, isCompanySpecific: t.isCompanySpecific, isActive: t.isActive})));
            setMasterTips((tipsData || []).map((t: any) => ({...t, isCompanySpecific: t.isCompanySpecific, isActive: t.isActive})));
            setExternalResources(resourcesData as ExternalResource[] || []);
            
            // User-specific data from Supabase has precedence over localStorage
            if (!auth.isPreview) {
                const { data: profile } = await supabase.from('user_profiles').select('data').eq('user_id', auth.userId).single();
                if (profile) setProfileData(convertStringsToDates(profile.data));
    
                const { data: assessment } = await supabase.from('user_assessments').select('data').eq('user_id', auth.userId).single();
                if (assessment) setAssessmentData(convertStringsToDates(assessment.data));
                else if (userData.prefilled_assessment_data) {
                    setAssessmentData(convertStringsToDates(userData.prefilled_assessment_data));
                }
            } else {
                loadFromLocalStorage();
            }

            setIsLoading(false);
        };

        fetchEndUserData();

    }, [auth, PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY, CUSTOM_DEADLINES_KEY, RECOMMENDATIONS_KEY]);

    const saveDataToLocalStorage = useCallback((key: string, data: any) => {
        try {
            if (data === null) {
                localStorage.removeItem(key);
            } else if (data instanceof Set) {
                localStorage.setItem(key, JSON.stringify(Array.from(data)));
            } else {
                localStorage.setItem(key, JSON.stringify(data instanceof Date ? data.toISOString() : convertDatesToStrings(data)));
            }
        } catch (error) {
            console.error(`Failed to save data to local storage for key ${key}`, error);
        }
    }, []);

    const saveProfileData = useCallback(async (data: ProfileData) => {
        saveDataToLocalStorage(PROFILE_KEY, data);
        setProfileData(data);
        
        if (auth?.isPreview || !auth?.userId) return;

        const { error: userError } = await supabase
            .from('company_users')
            .update({ profile_completed_at: new Date().toISOString() })
            .eq('id', auth.userId);
        if (userError) console.error("Error updating profile completion timestamp:", userError);

        const { error } = await supabase.from('user_profiles').upsert({
            user_id: auth.userId,
            data: convertDatesToStrings(data)
        }, { onConflict: 'user_id' });
        if (error) console.error("Error saving profile:", error);
    }, [auth?.userId, auth?.isPreview, saveDataToLocalStorage, PROFILE_KEY]);
    
    const saveAssessmentData = useCallback(async (data: AssessmentData) => {
        saveDataToLocalStorage(ASSESSMENT_KEY, data);
        setAssessmentData(data);

        if (auth?.isPreview || !auth?.userId) return;
    
        const { data: dbUser, error: userError } = await supabase
            .from('company_users')
            .select('assessment_completed_at, initial_unsure_answers')
            .eq('id', auth.userId) 
            .single();
    
        if (userError) {
            console.warn("Could not fetch user for analytics. This may not be an error.", userError);
        } else if (dbUser) {
            const now = new Date().toISOString();
            const updates: Partial<CompanyUser> = {};
            const unsureQuestions = Object.entries(data).filter(([, value]) => value === 'Unsure').map(([key]) => key);
    
            if (!dbUser.assessment_completed_at) {
                updates.assessment_completed_at = now;
                updates.initial_unsure_answers = unsureQuestions;
            }
    
            if (dbUser.initial_unsure_answers && unsureQuestions.length === 0) {
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
    
        if (saveError) console.error("Error saving assessment:", saveError);
    }, [auth?.userId, auth?.isPreview, saveDataToLocalStorage, ASSESSMENT_KEY]);
    
    const getCompanyConfig = useCallback((companyName: string | undefined, forEndUser = true, formType: 'profile' | 'assessment' = 'assessment'): Question[] => {
        if (!companyName || !companyConfig) return [];
        const masterSource = formType === 'profile' ? masterProfileQuestions : masterQuestions;
        let finalQuestions: Question[] = [];
    
        const targetProjectId = auth?.isPreview ? auth.previewProjectId : companyUser?.project_id;
        const projectConfig = targetProjectId ? companyConfig.projectConfigs?.[targetProjectId] : null;
    
        // Process Master Questions
        for (const id in masterSource) {
            const masterQ = { ...masterSource[id] };
            if (!masterQ.isActive || masterQ.formType !== formType) continue;
    
            const companyOverride = companyConfig?.questions?.[id];
            let finalQuestion: Question = applyQuestionOverrides(masterQ, companyOverride, companyConfig.answerGuidanceOverrides?.[id]);
    
            // Determine visibility based on company and then project overrides
            let isVisible = companyOverride?.isActive === undefined ? masterQ.isActive : companyOverride.isActive;
            if (isVisible && projectConfig?.hiddenQuestions?.includes(id)) {
                isVisible = false;
            }
            if (!isVisible) continue;
    
            // Apply project-specific answer-level overrides
            if (projectConfig) {
                if (projectConfig.hiddenAnswers?.[id]) {
                    const hiddenAnswers = new Set(projectConfig.hiddenAnswers[id]);
                    finalQuestion.options = (finalQuestion.options || []).filter(opt => !hiddenAnswers.has(opt));
                }
                const projectAnswerGuidance = projectConfig.answerGuidanceOverrides?.[id];
                if (projectAnswerGuidance) {
                    const newAnswerGuidance = { ...(finalQuestion.answerGuidance || {}) };
                    for (const answer in projectAnswerGuidance) {
                        newAnswerGuidance[answer] = {
                            ...(newAnswerGuidance[answer] || {}),
                            ...projectAnswerGuidance[answer]
                        }
                    }
                    finalQuestion.answerGuidance = newAnswerGuidance;
                }
            }
    
            finalQuestions.push(finalQuestion);
        }
    
        // Process Custom Questions
        const companyCustomQuestions = companyConfig?.customQuestions || {};
        for (const id in companyCustomQuestions) {
            const customQ = companyCustomQuestions[id];
            if (customQ.formType === formType) {
                 if (forEndUser) {
                    if (!customQ.isActive) continue;
                    const projectIds = customQ.projectIds || [];
                    let isVisible = false;

                    if (projectIds.length === 0) { // Visible to all projects
                        isVisible = true;
                    } else if (targetProjectId) { // User has a project
                        isVisible = projectIds.includes(targetProjectId);
                    } else { // User has no project, check for __none__
                        isVisible = projectIds.includes('__none__');
                    }
    
                    if (isVisible) {
                        finalQuestions.push({ ...customQ, isCustom: true });
                    }
                } else {
                    finalQuestions.push({ ...customQ, isCustom: true });
                }
            }
        }
    
        return buildQuestionTreeFromMap(finalQuestions.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, Question>));
    }, [companyConfig, masterQuestions, masterProfileQuestions, auth, companyUser]);
    
    const getMappedRecommendations = useCallback(() => {
        if (!assessmentData || !profileData || !companyConfig) {
            return { tasks: [], tips: [] };
        }
    
        const tasks = new Set<string>();
        const tips = new Set<string>();
        const allAnswers = { ...profileData, ...assessmentData };
        const allQuestions = { ...masterProfileQuestions, ...masterQuestions };
        
        const projectId = auth?.isPreview ? auth.previewProjectId : companyUser?.project_id;
    
        guidanceRules.forEach(rule => {
            let isTriggered = false;
            
            if (rule.type === 'direct' && rule.conditions.length > 0) {
                isTriggered = rule.conditions.every(cond => {
                    const answer = allAnswers[cond.questionId as keyof typeof allAnswers];
                    if (Array.isArray(answer)) {
                        return answer.includes(cond.answer!);
                    }
                    return answer === cond.answer;
                });
            } else if (rule.type === 'calculated' && rule.calculation && rule.ranges) {
                let calculatedValue: number | null = null;
                const { type, unit, startDateQuestionId, endDateQuestionId } = rule.calculation;
                if (type === 'age' && profileData.birthYear) {
                    calculatedValue = differenceInYears(new Date(), new Date(profileData.birthYear, 0, 1));
                } else if (type === 'tenure' && startDateQuestionId && endDateQuestionId) {
                    const start = allAnswers[startDateQuestionId];
                    const end = allAnswers[endDateQuestionId];
                    if (start instanceof Date && end instanceof Date) {
                        calculatedValue = differenceInYears(end, start);
                    }
                }
                
                if (calculatedValue !== null) {
                    const range = rule.ranges.find(r => calculatedValue! >= r.from && calculatedValue! < r.to);
                    if (range) {
                        range.assignments.taskIds.forEach(id => tasks.add(id));
                        range.assignments.tipIds.forEach(id => tips.add(id));
                    }
                }
                // Stop further processing for calculated rule
                return;
            }
    
            if (isTriggered) {
                rule.assignments.taskIds.forEach(id => tasks.add(id));
                rule.assignments.tipIds.forEach(id => tips.add(id));
            }
        });
        
        // Handle company-specific overrides
        const allGuidanceOverrides = { ...companyConfig.answerGuidanceOverrides };
        const projectGuidanceOverrides = projectId ? companyConfig.projectConfigs?.[projectId]?.answerGuidanceOverrides : null;
        if(projectGuidanceOverrides) {
             Object.assign(allGuidanceOverrides, projectGuidanceOverrides);
        }

        Object.entries(allGuidanceOverrides).forEach(([questionId, answerMap]) => {
            const answer = allAnswers[questionId as keyof typeof allAnswers];
            if (answer && answerMap[answer as string]) {
                const guidance = answerMap[answer as string];
                guidance.tasks?.forEach(id => tasks.add(id));
                guidance.tips?.forEach(id => tips.add(id));
            }
        });
        
        const allMasterAndCompanyTasks = [...masterTasks, ...(companyConfig.companyTasks || [])];
        const allMasterAndCompanyTips = [...masterTips, ...(companyConfig.companyTips || [])];

        return {
            tasks: Array.from(tasks).map(id => allMasterAndCompanyTasks.find(t => t.id === id)).filter((t): t is MasterTask => !!t).map(task => ({
                taskId: task.id,
                task: task.name,
                category: task.category,
                timeline: `Within ${task.deadlineDays || 7} days`,
                details: task.detail,
                endDate: '',
                isGoal: true,
                isCompanySpecific: task.isCompanySpecific,
            })),
            tips: Array.from(tips).map(id => allMasterAndCompanyTips.find(t => t.id === id)).filter((t): t is MasterTip => !!t).map(tip => ({
                tipId: tip.id,
                text: tip.text,
                category: tip.category,
                priority: tip.priority,
                isCompanySpecific: tip.isCompanySpecific,
            })),
        };
    
    }, [assessmentData, profileData, guidanceRules, masterTasks, masterTips, companyConfig, masterProfileQuestions, masterQuestions, auth, companyUser]);
    
    const getProfileCompletion = useCallback(() => {
        const allQuestions = getCompanyConfig(auth?.companyName, true, 'profile');
        const applicableQuestions = getApplicableQuestions(allQuestions, profileData, profileData);
        if (applicableQuestions.length === 0) return { percentage: 100, isComplete: true, totalApplicable: 0, completed: 0, incompleteQuestions: [] };

        const answeredQuestions = applicableQuestions.filter(q => {
            let value: any;
            if (q.id === 'personalEmail') value = companyUser?.personal_email;
            else if (q.id === 'phone') value = companyUser?.phone;
            else value = profileData?.[q.id as keyof ProfileData];
            
            return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
        });
        
        const incompleteQuestions = applicableQuestions.filter(q => {
             let value: any;
             if (q.id === 'personalEmail') value = companyUser?.personal_email;
             else if (q.id === 'phone') value = companyUser?.phone;
             else value = profileData?.[q.id as keyof ProfileData];
             
             return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length > 0);
        });

        const percentage = (answeredQuestions.length / applicableQuestions.length) * 100;
        return {
            percentage: isNaN(percentage) ? 0 : percentage,
            isComplete: percentage === 100,
            totalApplicable: applicableQuestions.length,
            completed: answeredQuestions.length,
            incompleteQuestions
        };
    }, [profileData, companyUser, getCompanyConfig, auth?.companyName]);

    const getAssessmentCompletion = useCallback(() => {
        if (!assessmentData) return { percentage: 0, isComplete: false, sections: [], totalApplicable: 0, completed: 0, incompleteQuestions: [] };

        const allQuestions = getCompanyConfig(auth?.companyName, true, 'assessment');
        const applicableQuestions = getApplicableQuestions(allQuestions, assessmentData, profileData);
        if (applicableQuestions.length === 0) return { percentage: 100, isComplete: true, sections: [], totalApplicable: 0, completed: 0, incompleteQuestions: [] };

        const answeredQuestions = applicableQuestions.filter(q => {
            const value = assessmentData[q.id as keyof AssessmentData];
            return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0) && value !== 'Unsure';
        });

        const incompleteQuestions = applicableQuestions.filter(q => {
            const value = assessmentData[q.id as keyof AssessmentData];
             return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length > 0) || value === 'Unsure';
        });
        
        const sectionMap: Record<string, { total: number, completed: number }> = {};
        applicableQuestions.forEach(q => {
            if (!sectionMap[q.section]) {
                sectionMap[q.section] = { total: 0, completed: 0 };
            }
            sectionMap[q.section].total++;
            const value = assessmentData[q.id as keyof AssessmentData];
            if (value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0) && value !== 'Unsure') {
                sectionMap[q.section].completed++;
            }
        });
        
        const sections = Object.entries(sectionMap).map(([name, counts]) => ({
            name,
            total: counts.total,
            completed: counts.completed,
            percentage: counts.total > 0 ? (counts.completed / counts.total) * 100 : 100,
        }));
        
        const totalPercentage = (answeredQuestions.length / applicableQuestions.length) * 100;

        return {
            percentage: isNaN(totalPercentage) ? 0 : totalPercentage,
            isComplete: totalPercentage === 100,
            sections,
            totalApplicable: applicableQuestions.length,
            completed: answeredQuestions.length,
            incompleteQuestions
        };
    }, [assessmentData, profileData, getCompanyConfig, auth?.companyName]);


    const contextValue = {
        // Provide all necessary state and functions
        // Most admin/HR functions will be dummy functions for end-users
        // This pattern avoids having to check the user's role in every component
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
        companyAssignments: companyAssignment ? [companyAssignment] : [],
        companyConfigs: companyConfig ? { [companyAssignment?.companyName || '']: companyConfig } : {},
        externalResources,
        platformUsers: [],
        reviewQueue: [],
        companyAssignmentForHr: companyAssignment || undefined,
        profileCompletions: {},
        assessmentCompletions: {},
        masterQuestionConfigs,
        isAssessmentComplete: !!assessmentData?.workStatus,
        saveProfileData,
        saveAssessmentData,
        clearRecommendations: () => {
            saveDataToLocalStorage(RECOMMENDATIONS_KEY, null);
            setRecommendations(null);
        },
        saveRecommendations: (recs: PersonalizedRecommendationsOutput) => {
            saveDataToLocalStorage(RECOMMENDATIONS_KEY, recs);
            setRecommendations(recs)
        },
        toggleTaskCompletion: (taskId: string) => {
            setCompletedTasks(prev => {
                const newSet = new Set(prev);
                if (newSet.has(taskId)) newSet.delete(taskId);
                else newSet.add(taskId);
                saveDataToLocalStorage(COMPLETED_TASKS_KEY, newSet);
                return newSet;
            });
        },
        updateTaskDate: (taskId: string, newDate: Date) => {
            setTaskDateOverrides(prev => {
                const newOverrides = { ...prev, [taskId]: newDate.toISOString().split('T')[0] };
                saveDataToLocalStorage(TASK_DATE_OVERRIDES_KEY, newOverrides);
                return newOverrides;
            });
        },
        addCustomDeadline: (id: string, deadline: { label: string; date: string }) => {
            setCustomDeadlines(prev => {
                const newDeadlines = { ...prev, [id]: deadline };
                saveDataToLocalStorage(CUSTOM_DEADLINES_KEY, newDeadlines);
                return newDeadlines;
            });
        },
        clearData: () => {
            if (!auth?.isPreview) return;
            setProfileData(null);
            setAssessmentData(null);
            setRecommendations(null);
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(ASSESSMENT_KEY);
            localStorage.removeItem(RECOMMENDATIONS_KEY);
        },
        // Getters and utils
        getCompanyConfig,
        getCompanyUser: () => companyUser ? { companyName: companyAssignment?.companyName || '', user: companyUser } : null,
        getMasterQuestionConfig: (formType: 'profile' | 'assessment') => masterQuestionConfigs.find(c => c.form_type === formType),
        getProfileCompletion,
        getAssessmentCompletion,
        getUnsureAnswers: () => ({ count: 0, firstSection: null }),
        getMappedRecommendations,
        getTargetTimezone: () => {
            try {
                const tz = localStorage.getItem(USER_TIMEZONE_KEY) || companyAssignment?.severanceDeadlineTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                localStorage.setItem(USER_TIMEZONE_KEY, tz);
                return tz;
            } catch {
                return 'UTC';
            }
        },
        updateCompanyUserContact: () => {},
        buildQuestionTreeFromMap: () => [],
        // Dummy admin/HR functions
        addCompanyAssignment: () => {},
        updateCompanyAssignment: () => {},
        saveMasterQuestions: async () => {},
        saveMasterQuestionConfig: async () => {},
        saveCompanyConfig: async () => {},
        saveGuidanceRules: async () => {},
        saveMasterTasks: async () => {},
        saveMasterTips: async () => {},
        addPlatformUser: async () => {},
        deletePlatformUser: async () => {},
        saveCompanyAssignments: async () => {},
        addReviewQueueItem: async () => {},
        processReviewQueueItem: async () => false,
        saveExternalResources: async () => {},
        saveCompanyUsers: async () => {},
        saveCompanyResources: async () => {},
        saveCompanyProjects: async () => {},
        saveReviewQueue: async () => {},
        getAllCompanyConfigs: () => companyConfig ? { [companyAssignment?.companyName || '']: companyConfig } : {},
        setCompanyConfigs: () => {},
        setReviewQueue: () => {},
        deleteCompanyAssignment: async () => {},
        getCompaniesForHr: () => [],
        getPlatformUserRole: () => null,
        saveTaskMappings: async () => {},
        saveTipMappings: async () => {},
        taskMappings: [],
        tipMappings: [],
    };

    return <UserDataContext.Provider value={contextValue as any}>{children}</UserDataContext.Provider>;
}




