
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

export function HrProvider({ children }: { children: React.ReactNode }) {
    const { auth, setPermissions: setAuthPermissions } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [companyAssignmentForHr, setCompanyAssignmentForHr] = useState<CompanyAssignment | undefined>(undefined);
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
    const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
    const [masterProfileQuestions, setMasterProfileQuestions] = useState<Record<string, Question>>({});
    const [masterQuestionConfigs, setMasterQuestionConfigs] = useState<MasterQuestionConfig[]>([]);
    const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
    const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);

    useEffect(() => {
        const fetchHrData = async () => {
            if (!auth?.companyId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const { data: assignmentData, error: assignmentError } = await supabase
                .from('companies')
                .select('*, company_hr_assignments!inner(*), projects(*)')
                .eq('id', auth.companyId)
                .single();
            
            if (assignmentError || !assignmentData) {
                console.error("Error fetching HR assignment data", assignmentError);
                setIsLoading(false);
                return;
            }
            
            const assignment: CompanyAssignment = {
                companyId: assignmentData.id, companyName: assignmentData.name, version: assignmentData.version,
                maxUsers: assignmentData.max_users, hrManagers: (assignmentData.company_hr_assignments || []).map((a: any) => ({
                    email: a.hr_email, isPrimary: a.is_primary, permissions: a.permissions, projectAccess: a.project_access || ['all'],
                })),
                severanceDeadlineTime: assignmentData.severance_deadline_time,
                severanceDeadlineTimezone: assignmentData.severance_deadline_timezone,
                preEndDateContactAlias: assignmentData.pre_end_date_contact_alias,
                postEndDateContactAlias: assignmentData.post_end_date_contact_alias,
                projects: assignmentData.projects,
            };
            setCompanyAssignmentForHr(assignment);

            const hrPerms = assignment.hrManagers.find(hr => hr.email === auth.email)?.permissions;
            if (hrPerms) setAuthPermissions(hrPerms);

            const { data: configData, error: configError } = await supabase
                .from('company_question_configs')
                .select('*')
                .eq('company_id', auth.companyId)
                .single();
            if (configError) console.error("Error fetching company config", configError);
            setCompanyConfig(configData || {});
            
            const { data: usersData, error: usersError } = await supabase
                .from('company_users')
                .select('*')
                .eq('company_id', auth.companyId);
            if(usersError) console.error("Error fetching company users", usersError);
            setCompanyUsers(usersData || []);


            const [
                { data: questionsData }, { data: masterConfigsData }, { data: reviewQueueData }
            ] = await Promise.all([
                supabase.from('master_questions').select('*'),
                supabase.from('master_question_configs').select('*'),
                supabase.from('review_queue').select('*').eq('company_id', auth.companyId)
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
            setReviewQueue(reviewQueueData as ReviewQueueItem[] || []);

            setIsLoading(false);
        };
        fetchHrData();
    }, [auth?.companyId, auth?.email, setAuthPermissions]);

    const getCompanyConfig = useCallback((companyName: string | undefined, forEndUser = true, formType: 'assessment' | 'profile' = 'assessment'): Question[] => {
        if (!companyName || !companyConfig) return [];
        const masterSource = formType === 'profile' ? masterProfileQuestions : masterQuestions;
        let finalQuestions: Question[] = [];
        
        const companyUser = forEndUser && auth?.role === 'end-user' ? companyUsers.find(u => u.email === auth.email) : null;
        const targetProjectId = auth?.isPreview ? auth.previewProjectId : companyUser?.project_id;

        for (const id in masterSource) {
            const masterQ = { ...masterSource[id] };
            if (!masterQ.isActive || masterQ.formType !== formType) continue; 

            const override = companyConfig?.questions?.[id];
            let isVisible = override?.isActive === undefined ? masterQ.isActive : override.isActive;

            if (forEndUser) {
                const projectConfig = companyConfig?.projectConfigs?.[targetProjectId || '__none__'];
                if (projectConfig?.hiddenQuestions?.includes(id)) {
                    isVisible = false;
                }
            }
    
            if (forEndUser && !isVisible) continue;
            
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
        
        const companyCustomQuestions = companyConfig?.customQuestions || {};
        for(const id in companyCustomQuestions) {
            const customQ = companyCustomQuestions[id];
            if(customQ.formType === formType && customQ.isActive) {
                let isVisibleForProject = true;
                const projectIds = customQ.projectIds || [];
                if (forEndUser && projectIds.length > 0) {
                     if (targetProjectId) isVisibleForProject = projectIds.includes(targetProjectId);
                     else isVisibleForProject = projectIds.includes('__none__');
                }
                if(forEndUser && !isVisibleForProject) continue;
                finalQuestions.push({ ...customQ, isCustom: true });
            }
        }
    
        return buildQuestionTreeFromMap(finalQuestions.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, Question>));
    }, [companyConfig, masterQuestions, masterProfileQuestions, auth, companyUsers]);
    
    // ... HR-specific action implementations would go here
    
    const contextValue = {
        isLoading,
        companyAssignmentForHr,
        companyConfigs: companyConfig ? { [auth?.companyName || '']: companyConfig } : {},
        companyUsers,
        masterQuestions,
        masterProfileQuestions,
        masterQuestionConfigs,
        reviewQueue,
        getCompanyConfig,
        // Dummy/empty values for data not needed by HR
        profileData: null, assessmentData: null, completedTasks: new Set(), taskDateOverrides: {}, customDeadlines: {},
        recommendations: null, isAssessmentComplete: false, companyAssignments: [], guidanceRules: [],
        masterTasks: [], masterTips: [], platformUsers: [], externalResources: [],
        // Dummy actions for non-HR roles
        addCompanyAssignment: () => {}, saveProfileData: () => {}, saveAssessmentData: () => {}, /* etc. */
    };
    
    return <UserDataContext.Provider value={contextValue as any}>{children}</UserDataContext.Provider>;
}
