

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
} from './use-user-data';
import { buildQuestionTreeFromMap } from './use-end-user-data';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const adminDataKeys = [
    'admin-companyAssignments', 'admin-companyConfigs', 'admin-masterQuestions',
    'admin-masterProfileQuestions', 'admin-masterQuestionConfigs', 'admin-guidanceRules',
    'admin-masterTasks', 'admin-masterTips', 'admin-platformUsers', 'admin-reviewQueue',
    'admin-externalResources', 'admin-lastFetch'
];

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { auth, setPermissions: setAuthPermissions } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

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

    const clearAdminCache = () => {
        adminDataKeys.forEach(key => localStorage.removeItem(key));
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);

            // Check for cached data first
            const lastFetchStr = localStorage.getItem('admin-lastFetch');
            const lastFetch = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
            if (Date.now() - lastFetch < CACHE_DURATION_MS) {
                try {
                    const cachedAssignments = localStorage.getItem('admin-companyAssignments');
                    const cachedConfigs = localStorage.getItem('admin-companyConfigs');
                    const cachedMasterQuestions = localStorage.getItem('admin-masterQuestions');
                    const cachedMasterProfileQuestions = localStorage.getItem('admin-masterProfileQuestions');
                    const cachedMasterQuestionConfigs = localStorage.getItem('admin-masterQuestionConfigs');
                    const cachedGuidanceRules = localStorage.getItem('admin-guidanceRules');
                    const cachedMasterTasks = localStorage.getItem('admin-masterTasks');
                    const cachedMasterTips = localStorage.getItem('admin-masterTips');
                    const cachedPlatformUsers = localStorage.getItem('admin-platformUsers');
                    const cachedReviewQueue = localStorage.getItem('admin-reviewQueue');
                    const cachedExternalResources = localStorage.getItem('admin-externalResources');
                    
                    if (cachedAssignments && cachedConfigs && cachedMasterQuestions && cachedMasterProfileQuestions) {
                        setCompanyAssignments(JSON.parse(cachedAssignments));
                        setCompanyConfigs(JSON.parse(cachedConfigs));
                        setMasterQuestions(JSON.parse(cachedMasterQuestions));
                        setMasterProfileQuestions(JSON.parse(cachedMasterProfileQuestions));
                        setMasterQuestionConfigs(JSON.parse(cachedMasterQuestionConfigs || '[]'));
                        setGuidanceRules(JSON.parse(cachedGuidanceRules || '[]'));
                        setMasterTasks(JSON.parse(cachedMasterTasks || '[]'));
                        setMasterTips(JSON.parse(cachedMasterTips || '[]'));
                        setPlatformUsers(JSON.parse(cachedPlatformUsers || '[]'));
                        setReviewQueue(JSON.parse(cachedReviewQueue || '[]'));
                        setExternalResources(JSON.parse(cachedExternalResources || '[]'));
                        setIsLoading(false);
                        return; // Exit if cache is successfully loaded
                    }
                } catch(e) {
                    console.error("Failed to load admin data from cache, re-fetching.", e);
                    clearAdminCache();
                }
            }


            const [
                { data: companiesData }, { data: hrAssignmentsData }, { data: questionsData },
                { data: rulesData }, { data: companyUsersData }, { data: companyConfigsData },
                { data: masterConfigsData }, { data: tasksData }, { data: tipsData },
                { data: platformUsersData }, { data: reviewQueueData }, { data: resourcesData },
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

            const fetchedPlatformUsers = (platformUsersData as PlatformUser[]) || [];
            const fetchedReviewQueue = (reviewQueueData as ReviewQueueItem[]) || [];
            const fetchedExternalResources = (resourcesData as ExternalResource[]) || [];

            setPlatformUsers(fetchedPlatformUsers);
            setReviewQueue(fetchedReviewQueue);
            setExternalResources(fetchedExternalResources);

            const assignments: CompanyAssignment[] = (companiesData || []).map(c => {
                const managers = (hrAssignmentsData || []).filter(a => a.company_id === c.id).map(a => ({
                    email: a.hr_email, isPrimary: a.is_primary, permissions: a.permissions as HrPermissions, projectAccess: a.project_access || ['all'],
                }));
                const companyProjects = (projectsData || []).filter(p => p.company_id === c.id).map(p => ({
                    id: p.id, name: p.name, isArchived: p.is_archived, severanceDeadlineTime: p.severance_deadline_time,
                    severanceDeadlineTimezone: p.severance_deadline_timezone, preEndDateContactAlias: p.pre_end_date_contact_alias,
                    postEndDateContactAlias: p.post_end_date_contact_alias,
                }));
                return {
                    companyId: c.id, companyName: c.name, version: c.version, maxUsers: c.max_users, hrManagers: managers,
                    severanceDeadlineTime: c.severance_deadline_time, severanceDeadlineTimezone: c.severance_deadline_timezone,
                    preEndDateContactAlias: c.pre_end_date_contact_alias, postEndDateContactAlias: c.post_end_date_contact_alias,
                    projects: companyProjects,
                };
            });
            setCompanyAssignments(assignments);

            const assessmentQuestionsMap: Record<string, Question> = {};
            const profileQuestionsMap: Record<string, Question> = {};
            (questionsData || []).forEach(q => {
                const question = { ...(q.question_data as object), id: q.id, formType: q.form_type, sortOrder: q.sort_order } as Question;
                if (question.formType === 'profile') profileQuestionsMap[q.id] = question;
                else assessmentQuestionsMap[q.id] = question;
            });
            setMasterQuestions(assessmentQuestionsMap);
            setMasterProfileQuestions(profileQuestionsMap);

            const fetchedMasterQuestionConfigs = (masterConfigsData as MasterQuestionConfig[]) || [];
            setMasterQuestionConfigs(fetchedMasterQuestionConfigs);

            const fetchedGuidanceRules = (rulesData || []).map((rule: any) => ({ ...rule, questionId: rule.question_id })) as GuidanceRule[];
            const fetchedMasterTasks = (tasksData || []).map((t: any) => ({...t, deadlineType: t.deadline_type, deadlineDays: t.deadline_days, linkedResourceId: t.linkedResourceId, isCompanySpecific: t.isCompanySpecific, isActive: t.isActive}));
            const fetchedMasterTips = (tipsData || []).map((t: any) => ({...t, isCompanySpecific: t.isCompanySpecific, isActive: t.isActive}));
            setGuidanceRules(fetchedGuidanceRules);
            setMasterTasks(fetchedMasterTasks);
            setMasterTips(fetchedMasterTips);
            
            const usersByCompany = (companyUsersData || []).reduce((acc, user) => {
                const company = companiesData?.find(c => c.id === user.company_id);
                if (company) {
                    if (!acc[company.name]) acc[company.name] = [];
                    acc[company.name].push(user as CompanyUser);
                }
                return acc;
            }, {} as Record<string, CompanyUser[]>);

            const configs: Record<string, CompanyConfig> = {};
            (companiesData || []).forEach(company => {
                const companyConfigDb = companyConfigsData?.find(c => c.company_id === company.id);
                configs[company.name] = {
                    users: usersByCompany[company.name] || [], questions: companyConfigDb?.question_overrides || {},
                    customQuestions: companyConfigDb?.custom_questions || {}, questionOrderBySection: companyConfigDb?.question_order_by_section || {},
                    answerGuidanceOverrides: companyConfigDb?.answer_guidance_overrides || {}, companyTasks: companyConfigDb?.company_tasks || [],
                    companyTips: companyConfigDb?.company_tips || [], resources: [],
                    projectConfigs: companyConfigDb?.project_configs || {},
                };
            });
            setCompanyConfigs(configs);

            // Save fetched data to cache
            localStorage.setItem('admin-lastFetch', Date.now().toString());
            localStorage.setItem('admin-companyAssignments', JSON.stringify(assignments));
            localStorage.setItem('admin-companyConfigs', JSON.stringify(configs));
            localStorage.setItem('admin-masterQuestions', JSON.stringify(assessmentQuestionsMap));
            localStorage.setItem('admin-masterProfileQuestions', JSON.stringify(profileQuestionsMap));
            localStorage.setItem('admin-masterQuestionConfigs', JSON.stringify(fetchedMasterQuestionConfigs));
            localStorage.setItem('admin-guidanceRules', JSON.stringify(fetchedGuidanceRules));
            localStorage.setItem('admin-masterTasks', JSON.stringify(fetchedMasterTasks));
            localStorage.setItem('admin-masterTips', JSON.stringify(fetchedMasterTips));
            localStorage.setItem('admin-platformUsers', JSON.stringify(fetchedPlatformUsers));
            localStorage.setItem('admin-reviewQueue', JSON.stringify(fetchedReviewQueue));
            localStorage.setItem('admin-externalResources', JSON.stringify(fetchedExternalResources));

            setIsLoading(false);
        };
        fetchAllData();
    }, []);

    const addCompanyAssignment = useCallback(async (newAssignment: Omit<CompanyAssignment, 'companyId' | 'hrManagers'> & { hrManagers: { email: string, isPrimary: boolean, permissions: HrPermissions, projectAccess: string[] }[] }) => {
        clearAdminCache();
        const { data: companyData, error: companyError } = await supabase.from('companies').insert({
            name: newAssignment.companyName, version: newAssignment.version, max_users: newAssignment.maxUsers,
            severance_deadline_time: newAssignment.severanceDeadlineTime, severance_deadline_timezone: newAssignment.severanceDeadlineTimezone,
            pre_end_date_contact_alias: newAssignment.preEndDateContactAlias, post_end_date_contact_alias: newAssignment.postEndDateContactAlias,
        }).select().single();
        if (companyError || !companyData) { console.error("Error creating company", companyError); return; }

        const hrAssignments = newAssignment.hrManagers.map(hr => ({
            company_id: companyData.id,
            hr_email: hr.email,
            is_primary: hr.isPrimary,
            permissions: hr.permissions,
            project_access: hr.projectAccess,
        }));
        const { error: hrError } = await supabase.from('company_hr_assignments').insert(hrAssignments);
        if (hrError) { console.error("Error assigning HR manager", hrError); return; }
        
        const finalAssignment: CompanyAssignment = { ...newAssignment, companyId: companyData.id, projects: [] };
        setCompanyAssignments(prev => [...prev, finalAssignment]);
        setCompanyConfigs(prev => ({...prev, [finalAssignment.companyName]: { users: [] }}));
    }, []);

    const updateCompanyAssignment = useCallback(async (companyName: string, payload: UpdateCompanyAssignmentPayload) => {
        clearAdminCache();
        const companyToUpdate = companyAssignments.find(a => a.companyName === companyName);
        if (!companyToUpdate) {
            toast({ title: "Company not found", variant: "destructive" });
            return;
        }
    
        // Handle deletion
        if (payload.delete) {
            const { error } = await supabase.from('companies').delete().eq('id', companyToUpdate.companyId);
            if (error) {
                toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
            } else {
                setCompanyAssignments(prev => prev.filter(a => a.companyName !== companyName));
                const newConfigs = { ...companyConfigs };
                delete newConfigs[companyName];
                setCompanyConfigs(newConfigs);
                toast({ title: 'Company Deleted', description: `${companyName} has been removed.` });
            }
            return;
        }
    
        // Handle HR manager addition
        if (payload.hrManagerToAdd) {
            const { hrManagerToAdd } = payload;
            
            // If the new manager is primary, demote the old primary first
            if (hrManagerToAdd.isPrimary) {
                const oldPrimary = companyToUpdate.hrManagers.find(hr => hr.isPrimary);
                if (oldPrimary) {
                    await supabase.from('company_hr_assignments')
                        .update({ is_primary: false })
                        .eq('company_id', companyToUpdate.companyId)
                        .eq('hr_email', oldPrimary.email);
                }
            }

            const { error } = await supabase.from('company_hr_assignments').insert({
                company_id: companyToUpdate.companyId,
                hr_email: hrManagerToAdd.email,
                is_primary: hrManagerToAdd.isPrimary,
                permissions: hrManagerToAdd.permissions,
                project_access: hrManagerToAdd.projectAccess,
            });
    
            if (error) {
                toast({ title: 'Failed to add manager', description: error.message, variant: 'destructive' });
            } else {
                setCompanyAssignments(prev => prev.map(a => {
                    if (a.companyName === companyName) {
                        const updatedManagers = hrManagerToAdd.isPrimary
                            ? a.hrManagers.map(hr => ({ ...hr, isPrimary: false }))
                            : a.hrManagers;
                        return { ...a, hrManagers: [...updatedManagers, hrManagerToAdd] };
                    }
                    return a;
                }));
                toast({ title: 'Manager Added', description: `${hrManagerToAdd.email} was added to ${companyName}.` });
            }
            return;
        }
    
    }, [toast, companyAssignments, companyConfigs]);
    
    const saveCompanyAssignments = useCallback(async (assignmentsToSave: CompanyAssignment[]) => {
        clearAdminCache();
        const allPromises: Promise<any>[] = [];

        for (const updatedAssignment of assignmentsToSave) {
            const originalAssignment = companyAssignments.find(a => a.companyId === updatedAssignment.companyId);
            if (!originalAssignment) continue;

            const originalEmails = new Set(originalAssignment.hrManagers.map(hr => hr.email));
            const updatedEmails = new Set(updatedAssignment.hrManagers.map(hr => hr.email));

            const emailsToDelete = [...originalEmails].filter(email => !updatedEmails.has(email));
            
            const managersToUpsert = updatedAssignment.hrManagers.map(hr => ({
                company_id: updatedAssignment.companyId,
                hr_email: hr.email,
                is_primary: hr.isPrimary,
                permissions: hr.permissions,
                project_access: hr.projectAccess,
            }));

            if (emailsToDelete.length > 0) {
                allPromises.push(
                    supabase
                        .from('company_hr_assignments')
                        .delete()
                        .eq('company_id', updatedAssignment.companyId)
                        .in('hr_email', emailsToDelete)
                );
            }

            if (managersToUpsert.length > 0) {
                allPromises.push(
                    supabase
                        .from('company_hr_assignments')
                        .upsert(managersToUpsert, { onConflict: 'company_id,hr_email' })
                );
            }
        }

        const results = await Promise.all(allPromises);
        const errors = results.filter(res => res && res.error);

        if (errors.length > 0) {
            console.error("Errors saving assignments:", errors);
            toast({ title: 'Save Failed', description: `Some assignments could not be saved: ${errors[0].error.message}`, variant: 'destructive' });
        } else {
            setCompanyAssignments(prev =>
                prev.map(existingAssignment => {
                    const updated = assignmentsToSave.find(a => a.companyId === existingAssignment.companyId);
                    return updated || existingAssignment;
                })
            );
        }
    }, [companyAssignments, toast]);

    const saveCompanyProjects = useCallback(async (companyName: string, newProjects: Project[]) => {
        clearAdminCache();
        const assignment = companyAssignments.find(a => a.companyName === companyName);
        if (!assignment) return;

        const { error } = await supabase
            .from('projects')
            .upsert(newProjects.map(p => ({
                id: p.id,
                name: p.name,
                company_id: assignment.companyId,
                is_archived: p.isArchived,
                severance_deadline_time: p.severanceDeadlineTime,
                severance_deadline_timezone: p.severanceDeadlineTimezone,
                pre_end_date_contact_alias: p.preEndDateContactAlias,
                post_end_date_contact_alias: p.postEndDateContactAlias,
            })), { onConflict: 'id' });
        
        if (error) {
            console.error("Error saving projects:", error);
            toast({ title: 'Error saving projects', description: error.message, variant: 'destructive' });
        } else {
            setCompanyAssignments(prev => prev.map(a => a.companyName === companyName ? { ...a, projects: newProjects } : a));
        }
    }, [companyAssignments, toast, clearAdminCache]);
    
    // Wrap other save functions with clearAdminCache
    const wrapWithCacheClear = (fn: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
        clearAdminCache();
        return await fn(...args);
    };

    const profileCompletions = useMemo(() => {
        const completions: Record<string, boolean> = {};
        Object.values(companyConfigs).forEach(config => {
            config.users?.forEach(user => {
                completions[user.email] = !!user.profile_completed_at;
            });
        });
        return completions;
    }, [companyConfigs]);

    const assessmentCompletions = useMemo(() => {
        const completions: Record<string, boolean> = {};
         Object.values(companyConfigs).forEach(config => {
            config.users?.forEach(user => {
                completions[user.email] = !!user.assessment_completed_at;
            });
        });
        return completions;
    }, [companyConfigs]);

    const contextValue = {
        profileData: null, assessmentData: null, completedTasks: new Set(), taskDateOverrides: {}, customDeadlines: {},
        recommendations: null, isAssessmentComplete: false,
        isLoading, companyAssignments, companyConfigs, masterQuestions, masterProfileQuestions, masterQuestionConfigs, guidanceRules,
        masterTasks, masterTips, platformUsers, reviewQueue, externalResources, profileCompletions, assessmentCompletions,
        saveProfileData: () => {}, saveAssessmentData: () => {}, clearRecommendations: () => {}, saveRecommendations: () => {},
        toggleTaskCompletion: () => {}, updateTaskDate: () => {}, addCustomDeadline: () => {},
        addCompanyAssignment,
        updateCompanyAssignment,
        saveMasterQuestions: wrapWithCacheClear(async () => {}), 
        saveMasterQuestionConfig: wrapWithCacheClear(async () => {}), 
        saveCompanyConfig: wrapWithCacheClear(async () => {}),
        saveGuidanceRules: wrapWithCacheClear(async () => {}), 
        saveMasterTasks: wrapWithCacheClear(async () => {}), 
        saveMasterTips: wrapWithCacheClear(async () => {}),
        addPlatformUser: wrapWithCacheClear(async () => {}), 
        deletePlatformUser: wrapWithCacheClear(async () => {}), 
        saveCompanyAssignments,
        addReviewQueueItem: wrapWithCacheClear(async () => {}), 
        processReviewQueueItem: wrapWithCacheClear(async () => false), 
        saveExternalResources: wrapWithCacheClear(async () => {}),
        getCompanyConfig: () => [], 
        getMasterQuestionConfig: () => undefined,
        getCompanyUser: () => null, 
        getProfileCompletion: () => ({ percentage: 0, isComplete: false, totalApplicable: 0, completed: 0, incompleteQuestions: [] }),
        getAssessmentCompletion: () => ({ percentage: 0, isComplete: false, sections: [], totalApplicable: 0, completed: 0, incompleteQuestions: [] }),
        getUnsureAnswers: () => ({ count: 0, firstSection: null }), 
        getTargetTimezone: () => 'UTC',
        updateCompanyUserContact: () => {},
        clearData: () => {},
        taskMappings: [],
        tipMappings: [],
        saveCompanyProjects,
        getAllCompanyConfigs: () => companyConfigs,
        setCompanyConfigs: () => {},
        setReviewQueue: () => {},
        deleteCompanyAssignment: wrapWithCacheClear(async () => {}),
        getCompaniesForHr: () => [],
        getPlatformUserRole: () => null,
        saveTaskMappings: wrapWithCacheClear(async () => {}),
        saveTipMappings: wrapWithCacheClear(async () => {}),
    };
    
    return <UserDataContext.Provider value={contextValue as any}>{children}</UserDataContext.Provider>;
}

