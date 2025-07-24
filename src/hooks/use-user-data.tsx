

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileData, profileSchema, AssessmentData, buildAssessmentSchema, buildProfileSchema } from '@/lib/schemas';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import type { ExternalResource } from '../lib/external-resources';
import {
  getCompanyAssignments as getCompanyAssignmentsFromDb, saveCompanyAssignments as saveCompanyAssignmentsToDb,
  getCompanyConfigs as getCompanyConfigsFromDb, saveCompanyConfigs as saveCompanyConfigsToDb,
  getPlatformUsers as getPlatformUsersFromDb, savePlatformUsers as savePlatformUsersToDb,
  getMasterQuestions as getMasterQuestionsFromDb, saveMasterQuestions as saveMasterQuestionsToDb,
  getMasterProfileQuestions as getMasterProfileQuestionsFromDb, saveMasterProfileQuestions as saveMasterProfileQuestionsToDb,
  getAssessmentCompletions as getAssessmentCompletionsFromDb, saveAssessmentCompletions as saveAssessmentCompletionsToDb,
  getProfileCompletions as getProfileCompletionsFromDb, saveProfileCompletions as saveProfileCompletionsToDb,
  getSeededDataForUser,
  getExternalResources as getExternalResourcesFromDb, saveExternalResources as saveExternalResourcesToDb,
  getReviewQueue as getReviewQueueFromDb, saveReviewQueue as saveReviewQueueToDb,
  addReviewQueueItem as addReviewQueueItemToDb,
} from '@/lib/demo-data';
import { PersonalizedRecommendationsInput, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';


const PROFILE_KEY = 'exitbetter-profile';
const ASSESSMENT_KEY = 'exitbetter-assessment';
const COMPLETED_TASKS_KEY = 'exitbetter-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitbetter-task-date-overrides';
const CUSTOM_DEADLINES_KEY = 'exitbetter-custom-deadlines';
const RECOMMENDATIONS_KEY = 'exitbetter-recommendations';
const USER_TIMEZONE_KEY = 'exitbetter-user-timezone';
const PREVIEW_SUFFIX = '-hr-preview';

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
  email: string;
  companyId: string;
  personalEmail?: string;
  notificationDate?: string; // Stored as 'YYYY-MM-DD'
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
  content?: string; // Can be text content or a data URI
}

export type Condition = {
  type: 'question';
  questionId: string;
  answer: string;
} | {
  type: 'tenure';
  operator: 'lt' | 'gte_lt' | 'gte'; // lt: < val1; gte_lt: >= val1 and < val2; gte: >= 5
  value: [number, number?]; // e.g., [1] for < 1 year; [1, 5] for 1-5 years; [5] for >= 5 years
  label: string; // User-facing label like "< 1 Year"
} | {
  type: 'date_offset';
  dateQuestionId: string;
  operator: 'gt' | 'lt'; // gt: > value; lt: < value
  value: number; // The number of days
  unit: 'days';
  comparison: 'from_today';
  label: string;
};


export interface GuidanceRule {
    id: string;
    name: string;
    conditions: Condition[];
    guidanceText: string;
    category: string;
    linkedResourceId?: string;
}

export interface ReviewQueueItem {
    id: string;
    userEmail: string;
    inputData: Omit<PersonalizedRecommendationsInput, 'userEmail'>;
    output: PersonalizedRecommendationsOutput;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string; // ISO string
}

export interface CompanyConfig {
    questions?: Record<string, Partial<Question>>;
    customQuestions?: Record<string, Question>;
    questionOrderBySection?: Record<string, string[]>;
    users?: CompanyUser[];
    resources?: Resource[];
    guidance?: GuidanceRule[];
}


export interface CompanyAssignment {
    companyName: string;
    hrManagers: HrManager[];
    version: 'basic' | 'pro';
    maxUsers: number;
    severanceDeadlineTime?: string; // e.g. "23:59"
    severanceDeadlineTimezone?: string; // e.g. "America/Los_Angeles"
    preEndDateContactAlias?: string;
    postEndDateContactAlias?: string;
}

export interface PlatformUser {
    email: string;
    role: 'admin' | 'consultant';
}

// --- HELPER FUNCTIONS ---

export const buildQuestionTreeFromMap = (flatQuestionMap: Record<string, Question>): Question[] => {
    if (!flatQuestionMap || Object.keys(flatQuestionMap).length === 0) {
        return [];
    }
    
    // Create a copy of the questions to avoid mutating the original source.
    // This also ensures subQuestions arrays are properly handled if they are missing.
    const questionMapWithSubs: Record<string, Question> = {};
    for (const id in flatQuestionMap) {
        questionMapWithSubs[id] = { ...flatQuestionMap[id], subQuestions: [] };
    }

    const rootQuestions: Question[] = [];

    // Iterate over the copied map to build the tree.
    for (const id in questionMapWithSubs) {
        const q = questionMapWithSubs[id];
        if (q.parentId && questionMapWithSubs[q.parentId]) {
            // This is a sub-question. Find its parent and add it.
            const parent = questionMapWithSubs[q.parentId];
            if (parent.subQuestions) {
                parent.subQuestions.push(q);
            } else {
                parent.subQuestions = [q];
            }
        } else {
            // This is a root-level question.
            rootQuestions.push(q);
        }
    }

    return rootQuestions;
};

// This regex helps identify YYYY-MM-DD format
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3}Z?)?$/;

export const convertStringsToDates = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
        if (isoDateRegex.test(obj) || (obj.includes('T') && isoDateTimeRegex.test(obj))) {
             const [year, month, day] = obj.split('T')[0].split('-').map(Number);
             if (year && month && day) {
                // Return a Date object. Client-side JS will interpret this in the local timezone,
                // which is what react-day-picker expects.
                return new Date(year, month - 1, day);
             }
        }
    }
    if (Array.isArray(obj)) {
        return obj.map(item => convertStringsToDates(item));
    }
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
        // Format to YYYY-MM-DD string
        const year = obj.getFullYear();
        const month = (obj.getMonth() + 1).toString().padStart(2, '0');
        const day = obj.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => convertDatesToStrings(item));
    }
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
  const { auth, updatePermissions } = useAuth();
  
  // User-specific data remains in localStorage for a personalized demo flow.
  const profileKey = auth?.isPreview ? `${PROFILE_KEY}${PREVIEW_SUFFIX}` : PROFILE_KEY;
  const assessmentKey = auth?.isPreview ? `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}` : ASSESSMENT_KEY;
  const completedTasksKey = auth?.isPreview ? `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}` : COMPLETED_TASKS_KEY;
  const taskDateOverridesKey = auth?.isPreview ? `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}` : TASK_DATE_OVERRIDES_KEY;
  const customDeadlinesKey = auth?.isPreview ? `${CUSTOM_DEADLINES_KEY}${PREVIEW_SUFFIX}` : CUSTOM_DEADLINES_KEY;
  const recommendationsKey = auth?.isPreview ? `${RECOMMENDATIONS_KEY}${PREVIEW_SUFFIX}` : RECOMMENDATIONS_KEY;
  const timezoneKey = auth?.isPreview ? `${USER_TIMEZONE_KEY}${PREVIEW_SUFFIX}` : USER_TIMEZONE_KEY;


  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
  const [customDeadlines, setCustomDeadlines] = useState<Record<string, { label: string; date: string }>>({});
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);

  // Shared data state now acts as a reactive layer over the in-memory store.
  const [companyConfigs, setCompanyConfigsState] = useState<Record<string, CompanyConfig>>({});
  const [masterQuestions, setMasterQuestionsState] = useState<Record<string, Question>>({});
  const [masterProfileQuestions, setMasterProfileQuestionsState] = useState<Record<string, Question>>({});
  const [companyAssignments, setCompanyAssignmentsState] = useState<CompanyAssignment[]>([]);
  const [platformUsers, setPlatformUsersState] = useState<PlatformUser[]>([]);
  const [profileCompletions, setProfileCompletionsState] = useState<Record<string, boolean>>({});
  const [assessmentCompletions, setAssessmentCompletionsState] = useState<Record<string, boolean>>({});
  const [externalResources, setExternalResourcesState] = useState<ExternalResource[]>([]);
  const [reviewQueue, setReviewQueueState] = useState<ReviewQueueItem[]>([]);
  
  const [companyAssignmentForHr, setCompanyAssignmentForHr] = useState<CompanyAssignment | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // A more reliable way to check if the assessment is truly "complete" by the user
  const isAssessmentComplete = !!assessmentData?.workStatus;

  const getTargetTimezone = useCallback(() => {
    if (userTimezone) return userTimezone;
    const companyName = auth?.companyName;
    const assignment = companyAssignments.find(a => a.companyName === companyName);
    return assignment?.severanceDeadlineTimezone || 'UTC';
  }, [auth?.companyName, companyAssignments, userTimezone]);

  const getCompanyUser = useCallback((email: string): { user: CompanyUser, companyName: string } | null => {
      if (!email || Object.keys(companyConfigs).length === 0) return null;
      for (const companyName in companyConfigs) {
          const user = companyConfigs[companyName]?.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
              return { user, companyName };
          }
      }
      return null;
  }, [companyConfigs]);

  useEffect(() => {
    setIsLoading(true);
    try {
      // Load shared data first from our in-memory "DB"
      const loadedCompanyAssignments = getCompanyAssignmentsFromDb();
      const loadedCompanyConfigs = getCompanyConfigsFromDb();
      const loadedPlatformUsers = getPlatformUsersFromDb();
      const loadedProfileCompletions = getProfileCompletionsFromDb();
      const loadedAssessmentCompletions = getAssessmentCompletionsFromDb();
      const loadedMasterQuestions = getMasterQuestionsFromDb();
      const loadedMasterProfileQuestions = getMasterProfileQuestionsFromDb();
      const loadedExternalResources = getExternalResourcesFromDb();
      const loadedReviewQueue = getReviewQueueFromDb();

      setCompanyAssignmentsState(loadedCompanyAssignments);
      setCompanyConfigsState(loadedCompanyConfigs);
      setPlatformUsersState(loadedPlatformUsers);
      setProfileCompletionsState(loadedProfileCompletions);
      setAssessmentCompletionsState(loadedAssessmentCompletions);
      setMasterQuestionsState(loadedMasterQuestions);
      setMasterProfileQuestionsState(loadedMasterProfileQuestions);
      setExternalResourcesState(loadedExternalResources);
      setReviewQueueState(loadedReviewQueue);

      // --- USER SPECIFIC DATA ---
      const profileJson = localStorage.getItem(profileKey);
      const assessmentJson = localStorage.getItem(assessmentKey);
      
      let finalProfileData = profileJson ? JSON.parse(profileJson) : null;
      let finalAssessmentData = assessmentJson ? JSON.parse(assessmentJson) : {};

      if (auth?.email) {
          const seeded = getSeededDataForUser(auth.email);
          const companyUser = loadedCompanyConfigs[auth.companyName as string]?.users?.find(u => u.email === auth.email);
          const hrPrefilledData = companyUser?.prefilledAssessmentData || {};
          const notificationDate = companyUser?.notificationDate ? { notificationDate: companyUser.notificationDate } : {};
          
          if (seeded && !profileJson) {
              finalProfileData = seeded.profile;
          }

          finalAssessmentData = {
              ...(assessmentJson ? JSON.parse(assessmentJson) : {}),
              ...(seeded?.assessment || {}),
              ...hrPrefilledData,
              ...notificationDate,
          };
      }
      
      if(finalProfileData) {
        setProfileData(convertStringsToDates(finalProfileData));
      } else {
        setProfileData(null);
      }
      setAssessmentData(convertStringsToDates(finalAssessmentData));
      
      const completedTasksJson = localStorage.getItem(completedTasksKey);
      setCompletedTasks(completedTasksJson ? new Set(JSON.parse(completedTasksJson)) : new Set());

      const dateOverridesJson = localStorage.getItem(taskDateOverridesKey);
      setTaskDateOverrides(dateOverridesJson ? JSON.parse(dateOverridesJson) : {});

      const customDeadlinesJson = localStorage.getItem(customDeadlinesKey);
      setCustomDeadlines(customDeadlinesJson ? JSON.parse(customDeadlinesJson) : {});

      const recommendationsJson = localStorage.getItem(recommendationsKey);
      setRecommendations(recommendationsJson ? JSON.parse(recommendationsJson) : null);
      
      const timezoneJson = localStorage.getItem(timezoneKey);
      if (timezoneJson) {
        try {
          // Check if it's JSON before parsing
          if (timezoneJson.startsWith('"') && timezoneJson.endsWith('"')) {
            setUserTimezone(JSON.parse(timezoneJson));
          } else {
            // It's a raw string
            setUserTimezone(timezoneJson);
          }
        } catch {
          // Fallback for any other malformed data
          setUserTimezone(timezoneJson);
        }
      } else {
        setUserTimezone(null);
      }
      
    } catch (error) {
      console.error('Failed to load user data', error);
      [PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY, CUSTOM_DEADLINES_KEY, RECOMMENDATIONS_KEY,
       `${PROFILE_KEY}${PREVIEW_SUFFIX}`, `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}`, `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}`, `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}`, `${CUSTOM_DEADLINES_KEY}${PREVIEW_SUFFIX}`, `${RECOMMENDATIONS_KEY}${PREVIEW_SUFFIX}`
      ].forEach(k => localStorage.removeItem(k));
    } finally {
      setIsLoading(false);
    }
  }, [auth?.email, auth?.companyName, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey, customDeadlinesKey, recommendationsKey, timezoneKey]);
  
  useEffect(() => {
    if (auth?.role === 'hr' && auth.companyName && !isLoading) {
        const assignment = companyAssignments.find(a => a.companyName === auth.companyName);
        setCompanyAssignmentForHr(assignment || null);
    } else if (!auth || auth.role !== 'hr') {
        setCompanyAssignmentForHr(null);
    }
  }, [auth?.role, auth?.companyName, isLoading, companyAssignments]);

  // This effect is responsible for keeping the HR permissions in the auth object up-to-date.
  useEffect(() => {
    if (auth?.role === 'hr' && auth.email && auth.companyName && companyAssignments.length > 0) {
        const assignment = companyAssignments.find(a => a.companyName === auth.companyName);
        if (assignment) {
            const manager = assignment.hrManagers.find(hr => hr.email.toLowerCase() === auth.email!.toLowerCase());
            if (manager) {
                const currentPermissions = manager.isPrimary 
                    ? { userManagement: 'write-upload' as const, formEditor: 'write' as const, resources: 'write' as const, companySettings: 'write' as const } 
                    : manager.permissions;
                
                // Only update if permissions have actually changed to prevent loops
                if (JSON.stringify(currentPermissions) !== JSON.stringify(auth.permissions)) {
                    updatePermissions(currentPermissions);
                }
            }
        }
    }
  }, [auth?.email, auth?.companyName, auth?.permissions, companyAssignments, updatePermissions, auth?.role]);


  const clearRecommendations = useCallback(() => {
    setRecommendations(null);
    localStorage.removeItem(recommendationsKey);
  }, [recommendationsKey]);

  const saveProfileData = useCallback((data: ProfileData) => {
    try {
      localStorage.setItem(profileKey, JSON.stringify(data));
      setProfileData(data);
      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newCompletions = { ...profileCompletions, [auth.email!]: true };
        saveProfileCompletionsToDb(newCompletions);
        setProfileCompletionsState(newCompletions);
      }
      clearRecommendations();
    } catch (error) { console.error('Failed to save profile data', error); }
  }, [profileKey, auth, profileCompletions, clearRecommendations]);

  const saveAssessmentData = useCallback((data: AssessmentData) => {
    try {
      // Ensure all Date objects are converted to 'YYYY-MM-DD' strings before saving
      const dataWithStrings = convertDatesToStrings(data);
      localStorage.setItem(assessmentKey, JSON.stringify(dataWithStrings));
      // Update state with the Date objects to keep it consistent for the app
      setAssessmentData(data); 

      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newCompletions = { ...assessmentCompletions, [auth.email!]: true };
        saveAssessmentCompletionsToDb(newCompletions);
        setAssessmentCompletionsState(newCompletions);
      }
      clearRecommendations();
    } catch (error) { console.error('Failed to save assessment data', error); }
  }, [auth, assessmentKey, assessmentCompletions, clearRecommendations]);

  const saveRecommendations = useCallback((data: PersonalizedRecommendationsOutput) => {
      try {
          localStorage.setItem(recommendationsKey, JSON.stringify(data));
          setRecommendations(data);
      } catch (e) {
          console.error('Failed to save recommendations', e);
      }
  }, [recommendationsKey]);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId);
      try {
        localStorage.setItem(completedTasksKey, JSON.stringify(Array.from(newSet)));
      } catch (error) { console.error('Failed to save completed tasks', error); }
      return newSet;
    });
  }, [completedTasksKey]);

  const updateTaskDate = useCallback((taskId: string, newDate: Date) => {
    setTaskDateOverrides(prev => {
      const newOverrides = { ...prev, [taskId]: convertDatesToStrings(newDate) };
       try {
        localStorage.setItem(taskDateOverridesKey, JSON.stringify(newOverrides));
      } catch (error) { console.error('Failed to save date overrides', error); }
      return newOverrides;
    });
  }, [taskDateOverridesKey]);

  const addCustomDeadline = useCallback((id: string, data: { label: string; date: string }) => {
    setCustomDeadlines(prev => {
      const newDeadlines = { ...prev, [id]: data };
      try {
        localStorage.setItem(customDeadlinesKey, JSON.stringify(newDeadlines));
      } catch (error) { console.error('Failed to save custom deadlines', error); }
      return newDeadlines;
    });
  }, [customDeadlinesKey]);

  const saveUserTimezone = useCallback((tz: string) => {
    setUserTimezone(tz);
    localStorage.setItem(timezoneKey, JSON.stringify(tz));
  }, [timezoneKey]);
  
  const saveMasterQuestions = useCallback((questions: Record<string, Question>) => {
    const questionsWithTimestamps = { ...questions };
    Object.values(questionsWithTimestamps).forEach(q => {
        q.lastUpdated = new Date().toISOString();
    });
    saveMasterQuestionsToDb(questionsWithTimestamps);
    setMasterQuestionsState(questionsWithTimestamps);
  }, []);

  const saveMasterProfileQuestions = useCallback((questions: Record<string, Question>) => {
    const questionsWithTimestamps = { ...questions };
    Object.values(questionsWithTimestamps).forEach(q => {
        q.lastUpdated = new Date().toISOString();
    });
    saveMasterProfileQuestionsToDb(questionsWithTimestamps);
    setMasterProfileQuestionsState(questionsWithTimestamps);
  }, []);
  
  const saveCompanyConfig = useCallback((companyName: string, config: CompanyConfig) => {
    const newConfigs = { ...companyConfigs, [companyName]: config };
    saveCompanyConfigsToDb(newConfigs);
    setCompanyConfigsState(newConfigs);
  }, [companyConfigs]);

  const saveCompanyUsers = useCallback((companyName: string, users: CompanyUser[]) => {
    const config = companyConfigs[companyName] || { questions: {}, users: [] };
    const newConfigs = { ...companyConfigs, [companyName]: { ...config, users: users }};
    saveCompanyConfigsToDb(newConfigs);
    setCompanyConfigsState(newConfigs);
  }, [companyConfigs]);

  const saveCompanyResources = useCallback((companyName: string, resources: Resource[]) => {
    const config = companyConfigs[companyName] || { questions: {}, users: [] };
    const newConfigs = { ...companyConfigs, [companyName]: { ...config, resources }};
    saveCompanyConfigsToDb(newConfigs);
    setCompanyConfigsState(newConfigs);
  }, [companyConfigs]);

  const saveExternalResources = useCallback((resources: ExternalResource[]) => {
    saveExternalResourcesToDb(resources);
    setExternalResourcesState(resources);
  }, []);

  const saveReviewQueue = useCallback((queue: ReviewQueueItem[]) => {
    saveReviewQueueToDb(queue);
    setReviewQueueState(queue);
  }, []);
  
  const addReviewQueueItem = useCallback((item: ReviewQueueItem) => {
    addReviewQueueItemToDb(item);
    setReviewQueueState(getReviewQueueFromDb());
  }, []);

  const getCompaniesForHr = useCallback((hrEmail: string): CompanyAssignment[] => {
    return companyAssignments.filter(a => a.hrManagers && a.hrManagers.some(hr => hr.email.toLowerCase() === hrEmail.toLowerCase()));
  }, [companyAssignments]);
  

  const addCompanyAssignment = useCallback((assignment: Partial<CompanyAssignment> & { companyName: string; hrManagers: HrManager[] }) => {
    const newAssignment: CompanyAssignment = {
        version: 'basic',
        maxUsers: 10,
        ...assignment
    };

    const newAssignments = [...companyAssignments, newAssignment];
    saveCompanyAssignmentsToDb(newAssignments);
    setCompanyAssignmentsState(newAssignments);

    if (!companyConfigs[assignment.companyName]) {
      const newConfigs = { ...companyConfigs, [assignment.companyName]: { questions: {}, users: [], customQuestions: {}, questionOrderBySection: {}, resources: [] } };
      saveCompanyConfigsToDb(newConfigs);
      setCompanyConfigsState(newConfigs);
    }
  }, [companyAssignments, companyConfigs]);

  const updateCompanyAssignment = useCallback((companyName: string, updates: Partial<CompanyAssignment>) => {
    const newAssignments = companyAssignments.map(a => a.companyName === companyName ? { ...a, ...updates } : a);
    saveCompanyAssignmentsToDb(newAssignments);
    setCompanyAssignmentsState(newAssignments);
  }, [companyAssignments]);

  const saveCompanyAssignments = useCallback((assignments: CompanyAssignment[]) => {
    saveCompanyAssignmentsToDb(assignments);
    setCompanyAssignmentsState(assignments);
  }, []);

  const deleteCompanyAssignment = useCallback((companyName: string) => {
    const newAssignments = companyAssignments.filter(a => a.companyName !== companyName);
    saveCompanyAssignmentsToDb(newAssignments);
    setCompanyAssignmentsState(newAssignments);
  }, [companyAssignments]);

  const addPlatformUser = useCallback((user: PlatformUser) => {
    if (platformUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      return;
    }
    const newUsers = [...platformUsers, user];
    savePlatformUsersToDb(newUsers);
    setPlatformUsersState(newUsers);
  }, [platformUsers]);

  const deletePlatformUser = useCallback((email: string) => {
    const newUsers = platformUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    savePlatformUsersToDb(newUsers);
    setPlatformUsersState(newUsers);
  }, [platformUsers]);

  const getPlatformUserRole = useCallback((email: string): 'admin' | 'consultant' | null => {
    const user = platformUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? user.role : null;
  }, [platformUsers]);

  const getCompanyConfig = useCallback((companyName: string | undefined, activeOnly = true): Question[] => {
    if (Object.keys(masterQuestions).length === 0) return [];

    const companyConfig = companyName ? companyConfigs[companyName] : undefined;
    
    // Create a deep copy to avoid mutating the master questions state
    const combinedFlatMap = structuredClone({
        ...masterQuestions,
        ...(companyConfig?.customQuestions || {})
    });
    
    if (companyConfig?.questions) {
        for (const id in companyConfig.questions) {
            if (combinedFlatMap[id]) {
                Object.assign(combinedFlatMap[id], companyConfig.questions[id]);
            }
        }
    }
    
    let questionTree = buildQuestionTreeFromMap(combinedFlatMap);

    if (companyConfig?.questionOrderBySection) {
        const orderMap = new Map<string, number>();
        let orderIndex = 0;
        
        // Flatten the order array for quick lookups
        Object.values(companyConfig.questionOrderBySection).flat().forEach(id => {
            orderMap.set(id, orderIndex++);
        });
        
        const sortWithOrder = (questions: Question[]): Question[] => {
            return questions.sort((a, b) => {
                const aOrder = orderMap.get(a.id) ?? Infinity;
                const bOrder = orderMap.get(b.id) ?? Infinity;
                return aOrder - bOrder;
            });
        };
        
        questionTree = sortWithOrder(questionTree);
        questionTree.forEach(q => {
            if (q.subQuestions) {
                q.subQuestions = sortWithOrder(q.subQuestions);
            }
        });
    }


    if (activeOnly) {
        const filterActive = (questions: Question[]): Question[] => {
            return questions
                .map(q => {
                    if (!q.isActive) return null;
                    const newQ = { ...q };
                    if (newQ.subQuestions) {
                        newQ.subQuestions = filterActive(newQ.subQuestions);
                    }
                    return newQ;
                })
                .filter((q): q is Question => q !== null);
        };
        questionTree = filterActive(questionTree);
    }
    
    return questionTree;
  }, [masterQuestions, companyConfigs]);

  const getProfileCompletion = useCallback(() => {
    if (!profileSchema?.shape) {
      return { total: 0, completed: 0, remaining: 0, percentage: 0 };
    }
    const total = Object.keys(profileSchema.shape).length;
    let completed = 0;
    
    if (profileData) {
        completed = Object.keys(profileData).filter(key => {
            const value = profileData[key as keyof ProfileData];
            if (Array.isArray(value)) return value.length > 0;
            return value !== '' && value !== undefined && value !== null;
        }).length;

        // The self-describe field only counts if the trigger is selected.
        if (profileData.gender !== 'Prefer to self-describe' && profileData.genderSelfDescribe) {
            completed -= 1;
        }
    }

    const remaining = total - completed;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, remaining: Math.max(0, remaining), percentage };
}, [profileData]);

  const getAssessmentCompletion = useCallback(() => {
    const activeQuestions = getCompanyConfig(auth?.companyName, true);
    if (!activeQuestions || activeQuestions.length === 0) {
      return { total: 0, completed: 0, remaining: 0, percentage: 0 };
    }

    let totalRequired = 0;
    let completedCount = 0;
    const data = assessmentData || {};

    const countQuestions = (questions: Question[]) => {
      questions.forEach(q => {
        totalRequired++;
        const value = (data as any)[q.id];
        const isAnswered = value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
        
        if (isAnswered) {
          completedCount++;
          
          if (q.subQuestions) {
            q.subQuestions.forEach(subQ => {
                let isTriggered = false;
                if (q.type === 'checkbox') {
                  if (subQ.triggerValue === 'NOT_NONE') {
                    isTriggered = Array.isArray(value) && value.length > 0 && !value.includes('None of the above');
                  } else {
                    isTriggered = Array.isArray(value) && value.includes(subQ.triggerValue);
                  }
                } else {
                  isTriggered = value === subQ.triggerValue;
                }

                if(isTriggered) {
                    countQuestions([subQ]);
                }
            });
          }
        }
      });
    };

    countQuestions(activeQuestions);

    const remaining = totalRequired - completedCount;
    const percentage = totalRequired > 0 ? (completedCount / totalRequired) * 100 : 0;
    return { total: totalRequired, completed: completedCount, remaining, percentage: Math.round(percentage) };
  }, [auth?.companyName, assessmentData, getCompanyConfig]);


  const getAllCompanyConfigs = useCallback(() => companyConfigs, [companyConfigs]);

  const clearData = useCallback(() => {
    try {
      // Clear profile data completely
      localStorage.removeItem(profileKey);
      setProfileData(null);

      // Reset assessment data, but preserve HR-prefilled info
      localStorage.removeItem(assessmentKey);
      const companyUser = getCompanyUser(auth?.email as string);
      let prefilledData: any = {};
      if (companyUser?.user.prefilledAssessmentData) {
        prefilledData = { ...companyUser.user.prefilledAssessmentData };
      }
      if(companyUser?.user.notificationDate) {
          prefilledData.notificationDate = companyUser.user.notificationDate;
      }
      
      const prefilledDataWithDates = convertStringsToDates(prefilledData);
      setAssessmentData(prefilledDataWithDates);
      localStorage.setItem(assessmentKey, JSON.stringify(convertDatesToStrings(prefilledDataWithDates)));
      
      // Clear task-related data
      localStorage.removeItem(completedTasksKey);
      localStorage.removeItem(taskDateOverridesKey);
      localStorage.removeItem(customDeadlinesKey);
      localStorage.removeItem(recommendationsKey);
      setCompletedTasks(new Set());
      setTaskDateOverrides({});
      setCustomDeadlines({});
      setRecommendations(null);
      
      // Reset completion status in the 'database'
      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newProfileCompletions = { ...profileCompletions };
        delete newProfileCompletions[auth.email!];
        saveProfileCompletionsToDb(newProfileCompletions);
        setProfileCompletionsState(newProfileCompletions);

        const newAssessmentCompletions = { ...assessmentCompletions };
        delete newAssessmentCompletions[auth.email!];
        saveAssessmentCompletionsToDb(newAssessmentCompletions);
        setAssessmentCompletionsState(newAssessmentCompletions);
      }

    } catch (error) { console.error('Failed to clear user data', error); }
  }, [auth, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey, customDeadlinesKey, recommendationsKey, profileCompletions, assessmentCompletions, getCompanyUser]);

  return {
    profileData,
    assessmentData,
    isAssessmentComplete,
    recommendations,
    saveRecommendations,
    userTimezone,
    saveUserTimezone,
    getProfileCompletion,
    getAssessmentCompletion,
    completedTasks,
    taskDateOverrides,
    customDeadlines,
    addCustomDeadline,
    isLoading,
    isUserDataLoading: isLoading,
    masterQuestions,
    masterProfileQuestions,
    saveMasterProfileQuestions,
    companyAssignments,
    saveCompanyAssignments,
    companyAssignmentForHr,
    profileCompletions,
    assessmentCompletions,
    platformUsers,
    externalResources,
    reviewQueue,
    saveReviewQueue,
    addReviewQueueItem,
    getTargetTimezone,
    getCompanyUser,
    addCompanyAssignment,
    deleteCompanyAssignment,
    updateCompanyAssignment,
    getCompaniesForHr,
    saveProfileData,
    saveAssessmentData,
    toggleTaskCompletion,
    updateTaskDate,
    clearData,
    saveMasterQuestions,
    saveCompanyConfig,
    saveCompanyUsers,
    saveCompanyResources,
    getCompanyConfig,
    getAllCompanyConfigs,
    addPlatformUser,
    deletePlatformUser,
    getPlatformUserRole,
    saveExternalResources,
  };
}

    
