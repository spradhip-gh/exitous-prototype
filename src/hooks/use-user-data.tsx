
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfileData, profileSchema, AssessmentData, buildAssessmentSchema } from '@/lib/schemas';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import {
  getCompanyAssignments as getCompanyAssignmentsFromDb, saveCompanyAssignments as saveCompanyAssignmentsToDb,
  getCompanyConfigs as getCompanyConfigsFromDb, saveCompanyConfigs as saveCompanyConfigsToDb,
  getPlatformUsers as getPlatformUsersFromDb, savePlatformUsers as savePlatformUsersToDb,
  getMasterQuestions as getMasterQuestionsFromDb, saveMasterQuestions as saveMasterQuestionsToDb,
  getAssessmentCompletions as getAssessmentCompletionsFromDb, saveAssessmentCompletions as saveAssessmentCompletionsToDb,
  getProfileCompletions as getProfileCompletionsFromDb, saveProfileCompletions as saveProfileCompletionsToDb,
  getSeededDataForUser,
} from '@/lib/demo-data';

const PROFILE_KEY = 'exitbetter-profile';
const ASSESSMENT_KEY = 'exitbetter-assessment';
const COMPLETED_TASKS_KEY = 'exitbetter-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitbetter-task-date-overrides';
const CUSTOM_DEADLINES_KEY = 'exitbetter-custom-deadlines';
const PREVIEW_SUFFIX = '-hr-preview';

export interface CompanyUser {
  email: string;
  companyId: string;
  personalEmail?: string;
  notificationDate?: string; // Stored as 'YYYY-MM-DD'
  notified?: boolean;
  prefilledAssessmentData?: Partial<Record<keyof AssessmentData, string | string[]>>; // HR-uploaded data
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  category: 'Benefits' | 'Policies' | 'Career' | 'Other';
  content?: string; // Can be text content or a data URI
}

export interface CompanyAssignment {
    companyName: string;
    hrManagerEmail: string;
    version: 'basic' | 'pro';
    maxUsers: number;
    severanceDeadlineTime?: string; // e.g. "23:59"
    severanceDeadlineTimezone?: string; // e.g. "America/Los_Angeles"
}

export interface PlatformUser {
    email: string;
    role: 'admin' | 'consultant';
}

// --- HELPER FUNCTIONS ---

export const buildQuestionTreeFromMap = (flatQuestionMap: Record<string, Question>): Question[] => {
    if (!flatQuestionMap || Object.keys(flatQuestionMap).length === 0) return [];
    
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


export function useUserData() {
  const { auth } = useAuth();
  
  // User-specific data remains in localStorage for a personalized demo flow.
  const profileKey = auth?.isPreview ? `${PROFILE_KEY}${PREVIEW_SUFFIX}` : PROFILE_KEY;
  const assessmentKey = auth?.isPreview ? `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}` : ASSESSMENT_KEY;
  const completedTasksKey = auth?.isPreview ? `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}` : COMPLETED_TASKS_KEY;
  const taskDateOverridesKey = auth?.isPreview ? `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}` : TASK_DATE_OVERRIDES_KEY;
  const customDeadlinesKey = auth?.isPreview ? `${CUSTOM_DEADLINES_KEY}${PREVIEW_SUFFIX}` : CUSTOM_DEADLINES_KEY;


  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
  const [customDeadlines, setCustomDeadlines] = useState<Record<string, { label: string; date: string }>>({});
  
  // Shared data state now acts as a reactive layer over the in-memory store.
  const [companyConfigs, setCompanyConfigsState] = useState<Record<string, CompanyConfig>>({});
  const [masterQuestions, setMasterQuestionsState] = useState<Record<string, Question>>({});
  const [companyAssignments, setCompanyAssignmentsState] = useState<CompanyAssignment[]>([]);
  const [platformUsers, setPlatformUsersState] = useState<PlatformUser[]>([]);
  const [profileCompletions, setProfileCompletionsState] = useState<Record<string, boolean>>({});
  const [assessmentCompletions, setAssessmentCompletionsState] = useState<Record<string, boolean>>({});
  
  const [companyAssignmentForHr, setCompanyAssignmentForHr] = useState<CompanyAssignment | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // A more reliable way to check if the assessment is truly "complete" by the user
  const isAssessmentComplete = !!assessmentData?.workStatus;

  const getTargetTimezone = useCallback(() => {
    const companyName = auth?.companyName;
    const assignment = companyAssignments.find(a => a.companyName === companyName);
    return assignment?.severanceDeadlineTimezone || 'UTC';
  }, [auth?.companyName, companyAssignments]);


  useEffect(() => {
    setIsLoading(true);
    try {
      // Load shared data first
      setCompanyAssignmentsState(getCompanyAssignmentsFromDb());
      setCompanyConfigsState(getCompanyConfigsFromDb());
      setPlatformUsersState(getPlatformUsersFromDb());
      setProfileCompletionsState(getProfileCompletionsFromDb());
      setAssessmentCompletionsState(getAssessmentCompletionsFromDb());
      setMasterQuestionsState(getMasterQuestionsFromDb());

      let profileJson = localStorage.getItem(profileKey);
      let assessmentJson = localStorage.getItem(assessmentKey);

      // Check for seeded data for this specific user if their localStorage is empty
      if (auth?.email && !profileJson && !assessmentJson) {
          const seeded = getSeededDataForUser(auth.email);
          if (seeded) {
              profileJson = JSON.stringify(seeded.profile);
              assessmentJson = JSON.stringify(seeded.assessment);
              localStorage.setItem(profileKey, profileJson);
              localStorage.setItem(assessmentKey, assessmentJson);
          }
      }
      
      setProfileData(profileJson ? JSON.parse(profileJson) : null);

      if (assessmentJson) {
        const parsedData = JSON.parse(assessmentJson);
        const convertDates = (obj: any) => {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('deadline'))) {
                            const dateStr = obj[key];
                            const [year, month, day] = dateStr.split('-').map(Number);
                            if (year && month && day) {
                                obj[key] = new Date(year, month - 1, day);
                            }
                        } else if (typeof obj[key] === 'object') {
                            convertDates(obj[key]);
                        }
                    }
                }
            }
        };
        convertDates(parsedData);
        setAssessmentData(parsedData);
      } else {
        setAssessmentData(null);
      }

      const completedTasksJson = localStorage.getItem(completedTasksKey);
      setCompletedTasks(completedTasksJson ? new Set(JSON.parse(completedTasksJson)) : new Set());

      const dateOverridesJson = localStorage.getItem(taskDateOverridesKey);
      setTaskDateOverrides(dateOverridesJson ? JSON.parse(dateOverridesJson) : {});

      const customDeadlinesJson = localStorage.getItem(customDeadlinesKey);
      setCustomDeadlines(customDeadlinesJson ? JSON.parse(customDeadlinesJson) : {});
      
    } catch (error) {
      console.error('Failed to load user data', error);
      [PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY, CUSTOM_DEADLINES_KEY,
       `${PROFILE_KEY}${PREVIEW_SUFFIX}`, `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}`, `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}`, `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}`, `${CUSTOM_DEADLINES_KEY}${PREVIEW_SUFFIX}`
      ].forEach(k => localStorage.removeItem(k));
    } finally {
      setIsLoading(false);
    }
  }, [auth, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey, customDeadlinesKey]);
  
  useEffect(() => {
    if (auth?.role === 'hr' && auth.companyName && !isLoading) {
        const assignment = companyAssignments.find(a => a.companyName === auth.companyName);
        setCompanyAssignmentForHr(assignment || null);
    } else if (!auth || auth.role !== 'hr') {
        setCompanyAssignmentForHr(null);
    }
  }, [auth, isLoading, companyAssignments]);

  const saveProfileData = useCallback((data: ProfileData) => {
    try {
      localStorage.setItem(profileKey, JSON.stringify(data));
      setProfileData(data);
       if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newCompletions = { ...profileCompletions, [auth.email!]: true };
        saveProfileCompletionsToDb(newCompletions);
        setProfileCompletionsState(newCompletions);
      }
    } catch (error) { console.error('Failed to save profile data', error); }
  }, [profileKey, auth, profileCompletions]);

  const saveAssessmentData = useCallback((data: AssessmentData) => {
    try {
      localStorage.setItem(assessmentKey, JSON.stringify(data));
      setAssessmentData(data);

      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newCompletions = { ...assessmentCompletions, [auth.email!]: true };
        saveAssessmentCompletionsToDb(newCompletions);
        setAssessmentCompletionsState(newCompletions);
      }
    } catch (error) { console.error('Failed to save assessment data', error); }
  }, [auth, assessmentKey, assessmentCompletions]);

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
      const newOverrides = { ...prev, [taskId]: newDate.toISOString().split('T')[0] };
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
  
  const saveMasterQuestions = useCallback((questions: Record<string, Question>) => {
    const questionsWithTimestamps = { ...questions };
    Object.values(questionsWithTimestamps).forEach(q => {
        q.lastUpdated = new Date().toISOString();
    });
    saveMasterQuestionsToDb(questionsWithTimestamps);
    setMasterQuestionsState(questionsWithTimestamps);
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
  
  const getCompanyForHr = useCallback((hrEmail: string): CompanyAssignment | undefined => {
    return companyAssignments.find(a => a.hrManagerEmail.toLowerCase() === hrEmail.toLowerCase());
  }, [companyAssignments]);
  
  const getCompanyUser = useCallback((email: string): { user: CompanyUser, companyName: string } | null => {
      if (!email) return null;
      for (const companyName in companyConfigs) {
          const user = companyConfigs[companyName]?.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
              return { user, companyName };
          }
      }
      return null;
  }, [companyConfigs]);

  const addCompanyAssignment = useCallback((assignment: CompanyAssignment) => {
    const newAssignments = [...companyAssignments, assignment];
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
    if (!profileData) {
      return { total: Object.keys(profileSchema.shape).length, completed: 0, remaining: Object.keys(profileSchema.shape).length, percentage: 0 };
    }
    const result = profileSchema.safeParse(profileData);
    const total = Object.keys(profileSchema.shape).length;
    let completed = total;
    if (!result.success) {
      // a bit of a hack, but we count the errors to find uncompleted fields.
      // zod doesn't directly expose which fields are valid.
      completed = total - result.error.errors.length;
    }
    const remaining = total - completed;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, remaining, percentage };
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
      const companyUser = auth?.email ? getCompanyUser(auth.email) : null;
      if (companyUser?.user.prefilledAssessmentData) {
        const prefilledData = { ...companyUser.user.prefilledAssessmentData };
        
        if(companyUser?.user.notificationDate) {
            (prefilledData as any).notificationDate = companyUser.user.notificationDate;
        }

        localStorage.setItem(assessmentKey, JSON.stringify(prefilledData));
        // Re-parse with dates for the state
        const parsedData = JSON.parse(JSON.stringify(prefilledData));
         const convertDates = (obj: any) => {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('deadline'))) {
                            const dateStr = obj[key];
                            const [year, month, day] = dateStr.split('-').map(Number);
                            if (year && month && day) {
                                obj[key] = new Date(year, month - 1, day);
                            }
                        }
                    }
                }
            }
        };
        convertDates(parsedData);
        setAssessmentData(parsedData);
      } else {
        setAssessmentData(null);
      }

      // Clear task-related data
      localStorage.removeItem(completedTasksKey);
      localStorage.removeItem(taskDateOverridesKey);
      localStorage.removeItem(customDeadlinesKey);
      setCompletedTasks(new Set());
      setTaskDateOverrides({});
      setCustomDeadlines({});
      
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
  }, [auth, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey, customDeadlinesKey, profileCompletions, assessmentCompletions, getCompanyUser]);

  return {
    profileData,
    assessmentData,
    isAssessmentComplete,
    getProfileCompletion,
    getAssessmentCompletion,
    completedTasks,
    taskDateOverrides,
    customDeadlines,
    addCustomDeadline,
    isLoading,
    isUserDataLoading: isLoading,
    masterQuestions,
    companyAssignments,
    companyAssignmentForHr,
    profileCompletions,
    assessmentCompletions,
    platformUsers,
    getTargetTimezone,
    getCompanyUser,
    addCompanyAssignment,
    deleteCompanyAssignment,
    updateCompanyAssignment,
    getCompanyForHr,
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
  };
}
