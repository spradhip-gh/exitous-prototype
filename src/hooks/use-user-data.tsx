'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import { type AssessmentData } from '@/lib/schemas';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';
import {
  getCompanyAssignments, saveCompanyAssignments,
  getCompanyConfigs, saveCompanyConfigs,
  getPlatformUsers, savePlatformUsers,
  getMasterQuestions, saveMasterQuestions as saveMasterQuestionsToDb,
  getAssessmentCompletions, saveAssessmentCompletions,
  getProfileCompletions, saveProfileCompletions,
} from '@/lib/demo-data';


const PROFILE_KEY = 'exitbetter-profile';
const ASSESSMENT_KEY = 'exitbetter-assessment';
const COMPLETED_TASKS_KEY = 'exitbetter-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitbetter-task-date-overrides';
const PREVIEW_SUFFIX = '-hr-preview';

export interface CompanyUser {
  email: string;
  companyId: string;
  personalEmail?: string;
  notificationDate?: string; // Stored as 'YYYY-MM-DD'
  notified?: boolean;
  prefilledAssessmentData?: Partial<Record<keyof AssessmentData, string | string[]>>; // HR-uploaded data
}

export interface CompanyConfig {
  questions: Record<string, Partial<Question>>; // Overrides for master questions
  users: CompanyUser[];
  customQuestions?: Record<string, Question>;
  questionOrderBySection?: Record<string, string[]>;
}

export interface CompanyAssignment {
    companyName: string;
    hrManagerEmail: string;
    version: 'basic' | 'pro';
    maxUsers: number;
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

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
  
  // Shared data state now acts as a reactive layer over the in-memory store.
  const [companyConfigs, setCompanyConfigsState] = useState<Record<string, CompanyConfig>>({});
  const [masterQuestions, setMasterQuestionsState] = useState<Record<string, Question>>({});
  const [companyAssignments, setCompanyAssignmentsState] = useState<CompanyAssignment[]>([]);
  const [profileCompletions, setProfileCompletionsState] = useState<Record<string, boolean>>({});
  const [assessmentCompletions, setAssessmentCompletionsState] = useState<Record<string, boolean>>({});
  const [platformUsers, setPlatformUsersState] = useState<PlatformUser[]>([]);
  
  const [companyAssignmentForHr, setCompanyAssignmentForHr] = useState<CompanyAssignment | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const getCompanyUser = useCallback((email: string): { user: CompanyUser, companyName: string } | null => {
      if (!email) return null;
      const allConfigs = getCompanyConfigs();
      for (const companyName in allConfigs) {
          const user = allConfigs[companyName]?.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
              return { user, companyName };
          }
      }
      return null;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    try {
      // Load user-specific data from localStorage
      const profileJson = localStorage.getItem(profileKey);
      setProfileData(profileJson ? JSON.parse(profileJson) : null);

      const assessmentJson = localStorage.getItem(assessmentKey);
      if (assessmentJson) {
        const parsedData = JSON.parse(assessmentJson);
        const convertDates = (obj: any) => {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'string' && key.toLowerCase().includes('date')) {
                            const date = new Date(obj[key]);
                            if (!isNaN(date.getTime())) {
                                obj[key] = date;
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
      
      // Load shared data from our in-memory store into the reactive state
      setCompanyAssignmentsState(getCompanyAssignments());
      setCompanyConfigsState(getCompanyConfigs());
      setPlatformUsersState(getPlatformUsers());
      setProfileCompletionsState(getProfileCompletions());
      setAssessmentCompletionsState(getAssessmentCompletions());
      setMasterQuestionsState(getMasterQuestions());
      
    } catch (error) {
      console.error('Failed to load user data', error);
      [PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY,
       `${PROFILE_KEY}${PREVIEW_SUFFIX}`, `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}`, `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}`, `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}`
      ].forEach(k => localStorage.removeItem(k));
    } finally {
      setIsLoading(false);
    }
  }, [auth, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey]);
  
  useEffect(() => {
    if (auth?.role === 'hr' && auth.companyName && !isLoading) {
        const assignment = getCompanyAssignments().find(a => a.companyName === auth.companyName);
        setCompanyAssignmentForHr(assignment || null);
    } else if (!auth || auth.role !== 'hr') {
        setCompanyAssignmentForHr(null);
    }
  }, [auth, isLoading]);

  const saveProfileData = useCallback((data: ProfileData) => {
    try {
      localStorage.setItem(profileKey, JSON.stringify(data));
      setProfileData(data);
       if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newCompletions = { ...getProfileCompletions(), [auth.email!]: true };
        saveProfileCompletions(newCompletions);
        setProfileCompletionsState(newCompletions);
      }
    } catch (error) { console.error('Failed to save profile data', error); }
  }, [profileKey, auth]);

  const saveAssessmentData = useCallback((data: AssessmentData) => {
    try {
      localStorage.setItem(assessmentKey, JSON.stringify(data));
      setAssessmentData(data);

      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const newCompletions = { ...getAssessmentCompletions(), [auth.email!]: true };
        saveAssessmentCompletions(newCompletions);
        setAssessmentCompletionsState(newCompletions);
      }
    } catch (error) { console.error('Failed to save assessment data', error); }
  }, [auth, assessmentKey]);

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
  
  const saveMasterQuestions = useCallback((questions: Record<string, Question>) => {
    const questionsWithTimestamps = { ...questions };
    Object.values(questionsWithTimestamps).forEach(q => {
        q.lastUpdated = new Date().toISOString();
    });
    saveMasterQuestionsToDb(questionsWithTimestamps);
    setMasterQuestionsState(questionsWithTimestamps);
  }, []);
  
  const saveCompanyConfig = useCallback((companyName: string, config: CompanyConfig) => {
    const newConfigs = { ...getCompanyConfigs(), [companyName]: config };
    saveCompanyConfigs(newConfigs);
    setCompanyConfigsState(newConfigs);
  }, []);

  const saveCompanyUsers = useCallback((companyName: string, users: CompanyUser[]) => {
    const currentConfigs = getCompanyConfigs();
    const config = currentConfigs[companyName] || { questions: {}, users: [] };
    const newConfigs = { ...currentConfigs, [companyName]: { ...config, users: users }};
    saveCompanyConfigs(newConfigs);
    setCompanyConfigsState(newConfigs);
  }, []);
  
  const getCompanyForHr = useCallback((hrEmail: string): CompanyAssignment | undefined => {
    return getCompanyAssignments().find(a => a.hrManagerEmail.toLowerCase() === hrEmail.toLowerCase());
  }, []);

  const addCompanyAssignment = useCallback((assignment: CompanyAssignment) => {
    const newAssignments = [...getCompanyAssignments(), assignment];
    saveCompanyAssignments(newAssignments);
    setCompanyAssignmentsState(newAssignments);

    const currentConfigs = getCompanyConfigs();
    if (!currentConfigs[assignment.companyName]) {
      const newConfigs = { ...currentConfigs, [assignment.companyName]: { questions: {}, users: [], customQuestions: {}, questionOrderBySection: {} } };
      saveCompanyConfigs(newConfigs);
      setCompanyConfigsState(newConfigs);
    }
  }, []);

  const updateCompanyAssignment = useCallback((companyName: string, updates: Partial<CompanyAssignment>) => {
    const newAssignments = getCompanyAssignments().map(a => a.companyName === companyName ? { ...a, ...updates } : a);
    saveCompanyAssignments(newAssignments);
    setCompanyAssignmentsState(newAssignments);
  }, []);

  const deleteCompanyAssignment = useCallback((companyName: string) => {
    const newAssignments = getCompanyAssignments().filter(a => a.companyName !== companyName);
    saveCompanyAssignments(newAssignments);
    setCompanyAssignmentsState(newAssignments);
  }, []);

  const addPlatformUser = useCallback((user: PlatformUser) => {
    const currentUsers = getPlatformUsers();
    if (currentUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      return;
    }
    const newUsers = [...currentUsers, user];
    savePlatformUsers(newUsers);
    setPlatformUsersState(newUsers);
  }, []);

  const deletePlatformUser = useCallback((email: string) => {
    const newUsers = getPlatformUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase());
    savePlatformUsers(newUsers);
    setPlatformUsersState(newUsers);
  }, []);

  const getPlatformUserRole = useCallback((email: string): 'admin' | 'consultant' | null => {
    const user = getPlatformUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? user.role : null;
  }, []);

  const getAllCompanyAssignments = useCallback(() => getCompanyAssignments(), []);

  const getCompanyConfig = useCallback((companyName: string | undefined, activeOnly = true): Question[] => {
    const masterQs = getMasterQuestions();
    const companyCfgs = getCompanyConfigs();

    if (Object.keys(masterQs).length === 0) return [];

    const companyConfig = companyName ? companyCfgs[companyName] : undefined;
    
    // Create a deep copy to avoid mutating the master questions state
    const combinedFlatMap = structuredClone({
        ...masterQs,
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
}, []);


  const getAllCompanyConfigs = useCallback(() => getCompanyConfigs(), []);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(profileKey);
      localStorage.removeItem(assessmentKey);
      localStorage.removeItem(completedTasksKey);
      localStorage.removeItem(taskDateOverridesKey);
      setProfileData(null);
      setAssessmentData(null);
      setCompletedTasks(new Set());
      setTaskDateOverrides({});
      
      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        const currentProfileCompletions = getProfileCompletions();
        const newProfileCompletions = { ...currentProfileCompletions };
        delete newProfileCompletions[auth.email!];
        saveProfileCompletions(newProfileCompletions);
        setProfileCompletionsState(newProfileCompletions);

        const currentAssessmentCompletions = getAssessmentCompletions();
        const newAssessmentCompletions = { ...currentAssessmentCompletions };
        delete newAssessmentCompletions[auth.email!];
        saveAssessmentCompletions(newAssessmentCompletions);
        setAssessmentCompletionsState(newAssessmentCompletions);
      }

    } catch (error) { console.error('Failed to clear user data', error); }
  }, [auth, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey]);

  return {
    profileData,
    assessmentData,
    completedTasks,
    taskDateOverrides,
    isLoading,
    masterQuestions,
    companyAssignments,
    companyAssignmentForHr,
    profileCompletions,
    assessmentCompletions,
    platformUsers,
    getCompanyUser,
    addCompanyAssignment,
    deleteCompanyAssignment,
    updateCompanyAssignment,
    getAllCompanyAssignments,
    getCompanyForHr,
    saveProfileData,
    saveAssessmentData,
    toggleTaskCompletion,
    updateTaskDate,
    clearData,
    saveMasterQuestions,
    saveCompanyConfig,
    saveCompanyUsers,
    getCompanyConfig,
    getAllCompanyConfigs,
    addPlatformUser,
    deletePlatformUser,
    getPlatformUserRole,
  };
}
