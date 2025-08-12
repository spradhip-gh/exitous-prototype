

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import type { ProfileData, AssessmentData } from '@/lib/schemas';
import type { ExternalResource } from '../lib/external-resources';
import { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import {
    UserDataContext,
    CompanyAssignment,
    CompanyConfig,
    CompanyUser,
    GuidanceRule,
    HrManager,
    HrPermissions,
    MasterTask,
    MasterTip,
    PlatformUser,
    Project,
    Resource,
    ReviewQueueItem,
    UpdateCompanyAssignmentPayload,
    MasterQuestionConfig,
    QuestionOverride,
} from './use-user-data';
import { buildQuestionTreeFromMap } from './use-end-user-data';

const fullPermissions: HrPermissions = {
    userManagement: 'write-upload',
    formEditor: 'write',
    resources: 'write',
    companySettings: 'write',
};

export function HrProvider({ children, email }: { children: React.ReactNode, email: string }) {
    const { auth, setPermissions: setAuthPermissions } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [companyAssignments, setCompanyAssignments] = useState<CompanyAssignment[]>([]);
    const [companyAssignmentForHr, setCompanyAssignmentForHr] = useState<CompanyAssignment | undefined>(undefined);
    const [companyConfigs, setCompanyConfigs] = useState<Record<string, CompanyConfig>>({});
    const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
    const [masterProfileQuestions, setMasterProfileQuestions] = useState<Record<string, Question>>({});
    const [masterQuestionConfigs, setMasterQuestionConfigs] = useState<MasterQuestionConfig[]>([]);
    const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);

    useEffect(() => {
        const fetchHrData = async () => {
            setIsLoading(true);
            
            const { data: hrAssignmentsData, error: assignmentsError } = await supabase
                .from('company_hr_assignments')
                .select(`*, companies(*, projects(*))`)
                .eq('hr_email', email);

            if (assignmentsError || !hrAssignmentsData) {
                console.error("Error fetching HR assignments", assignmentsError);
                setIsLoading(false);
                return;
            }

            const companyIds = hrAssignmentsData.map(a => a.company_id);
            const assignments: CompanyAssignment[] = hrAssignmentsData.map(a => {
                const company = a.companies;
                return {
                    companyId: company.id,
                    companyName: company.name,
                    version: company.version as 'basic' | 'pro',
                    maxUsers: company.max_users,
                    hrManagers: [], // Will be populated later
                    severanceDeadlineTime: company.severance_deadline_time,
                    severanceDeadlineTimezone: company.severance_deadline_timezone,
                    preEndDateContactAlias: company.pre_end_date_contact_alias,
                    postEndDateContactAlias: company.post_end_date_contact_alias,
                    projects: company.projects.map((p: any) => ({
                        id: p.id, name: p.name, isArchived: p.is_archived, severanceDeadlineTime: p.severance_deadline_time,
                        severanceDeadlineTimezone: p.severance_deadline_timezone, preEndDateContactAlias: p.pre_end_date_contact_alias,
                        postEndDateContactAlias: p.post_end_date_contact_alias
                    })),
                };
            });
            
            // Fetch all HR managers for all assigned companies
            const { data: allHrsData, error: allHrsError } = await supabase.from('company_hr_assignments').select('*').in('company_id', companyIds);
            if (!allHrsError) {
                assignments.forEach(a => {
                    a.hrManagers = allHrsData.filter(hr => hr.company_id === a.companyId).map(hr => ({
                        email: hr.hr_email,
                        isPrimary: hr.is_primary,
                        permissions: hr.permissions,
                        projectAccess: hr.project_access || ['all'],
                    }));
                });
            }
            setCompanyAssignments(assignments);

            const activeAssignment = assignments.find(a => a.companyId === auth?.companyId);
            setCompanyAssignmentForHr(activeAssignment);
            
            // Fetch configs for all assigned companies
            const { data: allConfigsData, error: allConfigsError } = await supabase.from('company_question_configs').select('*').in('company_id', companyIds);
            const { data: allUsersData, error: allUsersError } = await supabase.from('company_users').select('*').in('company_id', companyIds);
            const { data: allResourcesData, error: allResourcesError } = await supabase.from('company_resources').select('*').in('company_id', companyIds);

            const configs: Record<string, CompanyConfig> = {};
            assignments.forEach(a => {
                const configDb = allConfigsData?.find(c => c.company_id === a.companyId);
                const users = allUsersData?.filter(u => u.company_id === a.companyId);
                const resources = allResourcesData?.filter(r => r.company_id === a.companyId);
                configs[a.companyName] = {
                    ...(configDb || {}),
                    users: users || [],
                    resources: (resources || []).map(r => ({ ...r, fileName: r.file_name, projectIds: r.project_ids || [] })),
                    questions: configDb?.question_overrides || {},
                    customQuestions: configDb?.custom_questions || {},
                    companyTasks: configDb?.company_tasks || [],
                    companyTips: configDb?.company_tips || [],
                    projectConfigs: configDb?.project_configs || {},
                };
            });
            setCompanyConfigs(configs);

            const [
                { data: questionsData }, { data: masterConfigsData }, { data: reviewQueueData }
            ] = await Promise.all([
                supabase.from('master_questions').select('*'),
                supabase.from('master_question_configs').select('*'),
                supabase.from('review_queue').select('*').in('company_id', companyIds)
            ]);

            const assessmentQuestionsMap: Record<string, Question> = {};
            const profileQuestionsMap: Record<string, Question> = {};
            (questionsData || []).forEach(q => {
                const question = { ...(q.question_data as object), id: q.id, formType: q.form_type, sortOrder: q.sort_order, isActive: q.question_data?.isActive === undefined ? true : q.question_data.isActive } as Question;
                if (question.formType === 'profile') profileQuestionsMap[q.id] = question;
                else assessmentQuestionsMap[q.id] = question;
            });
            setMasterProfileQuestions(profileQuestionsMap);
            setMasterQuestions(assessmentQuestionsMap);
            setMasterQuestionConfigs(masterConfigsData as MasterQuestionConfig[] || []);
            setReviewQueue(reviewQueueData as ReviewQueueItem[] || []);

            setIsLoading(false);
        };
        fetchHrData();
    }, [email, auth?.companyId]);
    
    const saveCompanyConfig = useCallback(async (companyName: string, config: CompanyConfig) => {
        if (!companyName) {
            toast({ title: 'Error', description: 'Company name is missing.', variant: 'destructive' });
            return;
        }
        
        const companyId = companyAssignments.find(a => a.companyName === companyName)?.companyId;
        if (!companyId) {
            toast({ title: 'Error', description: 'Could not find company ID.', variant: 'destructive' });
            return;
        }

        const { question_overrides, custom_questions, question_order_by_section, answer_guidance_overrides, company_tasks, company_tips, project_configs } = {
            question_overrides: config.questions,
            custom_questions: config.customQuestions,
            question_order_by_section: config.questionOrderBySection,
            answer_guidance_overrides: config.answerGuidanceOverrides,
            company_tasks: config.companyTasks,
            company_tips: config.companyTips,
            project_configs: config.projectConfigs,
        };
        
        const { error } = await supabase.from('company_question_configs').upsert({
            company_id: companyId,
            question_overrides,
            custom_questions,
            question_order_by_section,
            answer_guidance_overrides,
            company_tasks,
            company_tips,
            project_configs,
        }, { onConflict: 'company_id' });
        
        if (error) {
            toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
        } else {
            setCompanyConfigs(prev => ({ ...prev, [companyName]: { ...prev[companyName], ...config }}));
        }
    }, [companyAssignments, toast]);
    
    const getCompanyConfig = useCallback((companyName: string | undefined, forEndUser: boolean, formType: 'profile' | 'assessment' = 'assessment'): Question[] => {
        if (!companyName || !companyConfigs[companyName]) return [];
        const config = companyConfigs[companyName];
        const masterSource = formType === 'profile' ? masterProfileQuestions : masterQuestions;
        let finalQuestions: Question[] = [];
        
        const targetProjectId = auth?.isPreview ? auth.previewProjectId : undefined; // This needs companyUser from the caller. For now, assume HR preview.

        for (const id in masterSource) {
            const masterQ = { ...masterSource[id] };

            if (!masterQ.isActive || masterQ.formType !== formType) continue; 

            const override = config?.questions?.[id];
            let isVisible = override?.isActive === undefined ? masterQ.isActive : override.isActive;
            
            // For HR view, just show if it's active at the company level, unless it's an end-user preview
            if (!forEndUser && !isVisible) {
                continue;
            }

            if (forEndUser) {
                const projectConfig = targetProjectId ? config?.projectConfigs?.[targetProjectId] : config?.projectConfigs?.['__none__'];
                if (projectConfig?.hiddenQuestions?.includes(id)) {
                    isVisible = false;
                }
                if (!isVisible) continue;
            }
            
            let finalQuestion: Question = { ...masterQ, isActive: isVisible };
            if (override) {
                finalQuestion.isModified = !!(override.label || override.description || override.optionOverrides);
                if (override.label) finalQuestion.label = override.label;
                if (override.description) finalQuestion.description = override.description;
                if (override.lastUpdated) finalQuestion.lastUpdated = override.lastUpdated;
                if (override.optionOverrides) {
                    const baseOptions = masterQ.options || [];
                    const toRemove = new Set(override.optionOverrides.remove || []);
                    const toAdd = override.optionOverrides.add || [];
                    let newOptions = baseOptions.filter(opt => !toRemove.has(opt));
                    newOptions = [...newOptions, ...toAdd.filter(opt => !newOptions.includes(opt))];
                    finalQuestion.options = newOptions;
                }
            }
            finalQuestions.push(finalQuestion);
        }
        
        const companyCustomQuestions = config?.customQuestions || {};
        for(const id in companyCustomQuestions) {
            const customQ = companyCustomQuestions[id];
            if(customQ.formType === formType) {
                if (forEndUser) {
                     if (!customQ.isActive) continue;
                     const projectIds = customQ.projectIds || [];
                     if (projectIds.length > 0) {
                         const hasAccess = targetProjectId ? projectIds.includes(targetProjectId) : projectIds.includes('__none__');
                         if(!hasAccess) continue;
                     }
                } else {
                     if (!customQ.isActive) continue;
                }
                finalQuestions.push({ ...customQ, isCustom: true });
            }
        }
    
        return buildQuestionTreeFromMap(finalQuestions.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, Question>));
    }, [companyConfigs, masterQuestions, masterProfileQuestions, auth]);
    
    const getUnsureAnswers = useCallback(() => {
        const companyConfig = auth?.companyName ? companyConfigs[auth.companyName] : null;
        if (!companyConfig || !companyConfig.users) return { count: 0, firstSection: null };

        let totalUnsure = 0;
        let firstUnsureSection: string | null = null;
        const allQuestions = { ...masterQuestions, ...masterProfileQuestions };

        companyConfig.users.forEach(user => {
            if (user.initial_unsure_answers) {
                totalUnsure += user.initial_unsure_answers.length;
                if (!firstUnsureSection && user.initial_unsure_answers.length > 0) {
                    const questionId = user.initial_unsure_answers[0];
                    firstUnsureSection = allQuestions[questionId]?.section || null;
                }
            }
        });

        return { count: totalUnsure, firstSection: firstUnsureSection };
    }, [companyConfigs, auth?.companyName, masterQuestions, masterProfileQuestions]);


    const contextValue = {
        isLoading,
        companyAssignmentForHr,
        companyAssignments,
        companyConfigs,
        masterQuestions,
        masterProfileQuestions,
        masterQuestionConfigs,
        reviewQueue,
        // Getters and other utils
        getCompanyConfig,
        saveCompanyConfig,
        getUnsureAnswers,
        // Dummy/empty values for data not needed by HR
        profileData: null, assessmentData: null, completedTasks: new Set(), taskDateOverrides: {}, customDeadlines: {},
        recommendations: null, isAssessmentComplete: false, guidanceRules: [],
        masterTasks: [], masterTips: [], platformUsers: [], externalResources: [],
        profileCompletions: {},
        assessmentCompletions: {},
        // Dummy actions for non-HR roles
        addCompanyAssignment: () => {}, saveProfileData: () => {}, saveAssessmentData: () => {},
    };
    
    return <UserDataContext.Provider value={contextValue as any}>{children}</UserDataContext.Provider>;
}

    