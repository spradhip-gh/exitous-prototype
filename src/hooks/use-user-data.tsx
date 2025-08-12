

'use client';

import { createContext, useContext } from 'react';
import type { Question } from '@/lib/questions';
import type { ProfileData, AssessmentData } from '@/lib/schemas';
import type { ExternalResource } from '../lib/external-resources';
import { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';

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

export function applyQuestionOverrides(masterQ: Question, override: QuestionOverride | undefined, companyGuidance: Record<string, AnswerGuidance> | undefined): Question {
    let finalQuestion: Question = { ...masterQ };

    if (override) {
        finalQuestion.isActive = override.isActive === undefined ? masterQ.isActive : override.isActive;
        finalQuestion.isModified = !!(override.label || override.description || override.optionOverrides);
        if (override.label) finalQuestion.label = override.label;
        if (override.description) finalQuestion.description = override.description;
        if (override.lastUpdated) finalQuestion.lastUpdated = override.lastUpdated;
        if (override.optionOverrides) {
            const baseOptions = new Set(masterQ.options || []);
            const toRemove = new Set(override.optionOverrides.remove || []);
            const toAdd = override.optionOverrides.add || [];
            
            toRemove.forEach(opt => baseOptions.delete(opt));
            toAdd.forEach(opt => baseOptions.add(opt));
            
            finalQuestion.options = Array.from(baseOptions);
        }
    }
    
    if(companyGuidance) {
        const newAnswerGuidance = { ...(finalQuestion.answerGuidance || {}) };
        for (const answer in companyGuidance) {
            newAnswerGuidance[answer] = {
                ...(newAnswerGuidance[answer] || {}),
                ...companyGuidance[answer]
            }
        }
        finalQuestion.answerGuidance = newAnswerGuidance;
    }

    return finalQuestion;
}

// Re-export common types
export type { Question } from '@/lib/questions';
export type { ExternalResource } from '../lib/external-resources';
export type { PersonalizedRecommendationsOutput, RecommendationItem, TipItem } from '@/ai/flows/personalized-recommendations';


export interface UserDataContextType {
    // End-User Data
    profileData: ProfileData | null;
    assessmentData: AssessmentData | null;
    completedTasks: Set<string>;
    taskDateOverrides: Record<string, string>;
    customDeadlines: Record<string, { label: string; date: string }>;
    recommendations: PersonalizedRecommendationsOutput | null;
    isAssessmentComplete: boolean;
    // Admin Data
    companyAssignments: CompanyAssignment[];
    companyConfigs: Record<string, CompanyConfig>;
    masterQuestions: Record<string, Question>;
    masterProfileQuestions: Record<string, Question>;
    masterQuestionConfigs: MasterQuestionConfig[];
    guidanceRules: GuidanceRule[];
    masterTasks: MasterTask[];
    masterTips: MasterTip[];
    platformUsers: PlatformUser[];
    reviewQueue: ReviewQueueItem[];
    externalResources: ExternalResource[];
    companyAssignmentForHr: CompanyAssignment | undefined;
    profileCompletions: Record<string, boolean>;
    assessmentCompletions: Record<string, boolean>;
    // Common
    isLoading: boolean;
    // End-User Actions
    saveProfileData: (data: ProfileData) => void;
    saveAssessmentData: (data: AssessmentData) => void;
    clearRecommendations: () => void;
    saveRecommendations: (recs: PersonalizedRecommendationsOutput) => void;
    toggleTaskCompletion: (taskId: string) => void;
    updateTaskDate: (taskId: string, newDate: Date) => void;
    addCustomDeadline: (id: string, deadline: { label: string; date: string }) => void;
    // Admin Actions
    addCompanyAssignment: (newAssignment: Omit<CompanyAssignment, 'companyId' | 'hrManagers'> & { hrManagers: { email: string, isPrimary: boolean, permissions: HrPermissions }[] }) => void;
    updateCompanyAssignment: (companyName: string, payload: UpdateCompanyAssignmentPayload) => void;
    saveMasterQuestions: (questionsToSave: Record<string, Question>, formType: 'profile' | 'assessment') => void;
    saveMasterQuestionConfig: (formType: 'profile' | 'assessment', config: any) => void;
    saveCompanyConfig: (companyName: string, config: CompanyConfig) => void;
    saveGuidanceRules: (rules: GuidanceRule[]) => void;
    saveMasterTasks: (tasks: MasterTask[]) => void;
    saveMasterTips: (tips: MasterTip[]) => void;
    addPlatformUser: (user: Omit<PlatformUser, 'id'>) => void;
    deletePlatformUser: (email: string) => void;
    saveCompanyAssignments: (assignmentsToSave: CompanyAssignment[]) => Promise<void>;
    addReviewQueueItem: (item: Omit<ReviewQueueItem, 'id' | 'created_at' | 'company_id'> & { companyName?: string }) => void;
    processReviewQueueItem: (item: ReviewQueueItem, status: 'approved' | 'rejected' | 'reviewed', rejectionReason?: string) => Promise<boolean>;
    saveExternalResources: (resources: ExternalResource[]) => void;
    // HR Actions
    saveCompanyUsers: (companyName: string, users: CompanyUser[]) => Promise<void>;
    saveCompanyResources: (companyName: string, resources: Resource[]) => Promise<void>;
    saveCompanyProjects: (companyName: string, newProjects: Project[]) => Promise<void>;
    saveReviewQueue: (queue: ReviewQueueItem[]) => Promise<void>;
    // Common Getters/Utils
    getCompanyConfig: (companyName: string | undefined, forEndUser: boolean, formType?: 'profile' | 'assessment') => Question[];
    getCompanyUser: (email: string | undefined) => { companyName: string, user: CompanyUser } | null;
    getMasterQuestionConfig: (formType: 'profile' | 'assessment') => MasterQuestionConfig | undefined;
    getProfileCompletion: () => { percentage: number; isComplete: boolean; totalApplicable: number; completed: number; incompleteQuestions: Question[] };
    getAssessmentCompletion: () => { percentage: number; isComplete: boolean; sections: { name: string; total: number; completed: number; percentage: number }[], totalApplicable: number; completed: number; incompleteQuestions: Question[] };
    getUnsureAnswers: () => { count: number; firstSection: string | null };
    getTargetTimezone: () => string;
    updateCompanyUserContact: (userId: string, contactInfo: { personal_email?: string; phone?: string; }) => void;
    // Deprecated/ToBeRemoved
    clearData: () => void;
    taskMappings: TaskMapping[];
    tipMappings: TipMapping[];
    getAllCompanyConfigs: () => Record<string, CompanyConfig>;
    setCompanyConfigs: React.Dispatch<React.SetStateAction<Record<string, CompanyConfig>>>;
    setReviewQueue: React.Dispatch<React.SetStateAction<ReviewQueueItem[]>>;
    deleteCompanyAssignment: (companyName: string) => Promise<void>;
    getCompaniesForHr: (email: string) => CompanyAssignment[];
    getPlatformUserRole: (email: string) => 'admin' | 'consultant' | null;
    saveTaskMappings: (mappings: TaskMapping[]) => Promise<void>;
    saveTipMappings: (mappings: TipMapping[]) => Promise<void>;
}

export const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function useUserData() {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error('useUserData must be used within a DataProvider');
    }
    return context;
}
