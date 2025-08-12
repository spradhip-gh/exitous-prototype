
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
                    projects: company.projects,
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

            const configs: Record<string, CompanyConfig> = {};
            assignments.forEach(a => {
                const configDb = allConfigsData?.find(c => c.company_id === a.companyId);
                const users = allUsersData?.filter(u => u.company_id === a.companyId);
                configs[a.companyName] = {
                    ...(configDb || {}),
                    users: users || [],
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
    }, [email, auth?.companyId]);
    
    // ... all other Admin/HR specific actions (saveMasterQuestions, saveGuidanceRules, etc.) would be defined here.

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
        getCompanyConfig: () => [],
        // Dummy/empty values for data not needed by HR
        profileData: null, assessmentData: null, completedTasks: new Set(), taskDateOverrides: {}, customDeadlines: {},
        recommendations: null, isAssessmentComplete: false, guidanceRules: [],
        masterTasks: [], masterTips: [], platformUsers: [], externalResources: [],
        profileCompletions: {}, assessmentCompletions: {},
        // Dummy actions for non-HR roles
        addCompanyAssignment: () => {}, saveProfileData: () => {}, saveAssessmentData: () => {}, /* etc. */
    };
    
    return <UserDataContext.Provider value={contextValue as any}>{children}</UserDataContext.Provider>;
}
