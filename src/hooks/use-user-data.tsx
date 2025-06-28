

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import { buildAssessmentSchema, type AssessmentData } from '@/lib/schemas';
import { getDefaultQuestions } from '@/lib/questions';
import { useAuth } from './use-auth';
import type { Question } from '@/lib/questions';


const PROFILE_KEY = 'exitbetter-profile';
const ASSESSMENT_KEY = 'exitbetter-assessment';
const COMPLETED_TASKS_KEY = 'exitbetter-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitbetter-task-date-overrides';
const COMPANY_CONFIGS_KEY = 'exitbetter-company-configs';
const MASTER_QUESTIONS_KEY = 'exitbetter-master-questions';
const COMPANY_ASSIGNMENTS_KEY = 'exitbetter-company-assignments';
const ASSESSMENT_COMPLETIONS_KEY = 'exitbetter-assessment-completions';
const PLATFORM_USERS_KEY = 'exitbetter-platform-users';
const PREVIEW_SUFFIX = '-hr-preview';

export interface CompanyUser {
  email: string;
  companyId: string;
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

export function useUserData() {
  const { auth } = useAuth();
  
  const profileKey = auth?.isPreview ? `${PROFILE_KEY}${PREVIEW_SUFFIX}` : PROFILE_KEY;
  const assessmentKey = auth?.isPreview ? `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}` : ASSESSMENT_KEY;
  const completedTasksKey = auth?.isPreview ? `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}` : COMPLETED_TASKS_KEY;
  const taskDateOverridesKey = auth?.isPreview ? `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}` : TASK_DATE_OVERRIDES_KEY;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
  const [companyConfigs, setCompanyConfigs] = useState<Record<string, CompanyConfig>>({});
  const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
  const [companyAssignments, setCompanyAssignments] = useState<CompanyAssignment[]>([]);
  const [assessmentCompletions, setAssessmentCompletions] = useState<Record<string, boolean>>({});
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [companyAssignmentForHr, setCompanyAssignmentForHr] = useState<CompanyAssignment | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      // User-specific data (regular or preview)
      const profileJson = localStorage.getItem(profileKey);
      setProfileData(profileJson ? JSON.parse(profileJson) : null);

      const assessmentJson = localStorage.getItem(assessmentKey);
      if (assessmentJson) {
        const parsedData = JSON.parse(assessmentJson);
        // Recursively find and convert date strings to Date objects
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
      
      // Admin/HR data (not preview-specific)
      const configsJson = localStorage.getItem(COMPANY_CONFIGS_KEY);
      if (configsJson) setCompanyConfigs(JSON.parse(configsJson));
      
      const masterQuestionsJson = localStorage.getItem(MASTER_QUESTIONS_KEY);
      if (masterQuestionsJson) {
        setMasterQuestions(JSON.parse(masterQuestionsJson));
      } else {
        const initialQuestions: Record<string, Question> = {};
        const addQuestionRecursively = (q: Question) => {
            initialQuestions[q.id] = { ...q, lastUpdated: new Date().toISOString() };
            if (q.subQuestions) {
                q.subQuestions.forEach(addQuestionRecursively);
            }
        };
        getDefaultQuestions().forEach(addQuestionRecursively);
        setMasterQuestions(initialQuestions);
        localStorage.setItem(MASTER_QUESTIONS_KEY, JSON.stringify(initialQuestions));
      }
      
      const assignmentsJson = localStorage.getItem(COMPANY_ASSIGNMENTS_KEY);
      if (assignmentsJson) setCompanyAssignments(JSON.parse(assignmentsJson));

      const completionsJson = localStorage.getItem(ASSESSMENT_COMPLETIONS_KEY);
      if (completionsJson) setAssessmentCompletions(JSON.parse(completionsJson));

      const platformUsersJson = localStorage.getItem(PLATFORM_USERS_KEY);
      if (platformUsersJson) {
        setPlatformUsers(JSON.parse(platformUsersJson));
      } else {
        // Add a default admin to prevent getting locked out.
        const defaultUsers: PlatformUser[] = [{ email: 'admin@example.com', role: 'admin' }];
        setPlatformUsers(defaultUsers);
        localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(defaultUsers));
      }

    } catch (error) {
      console.error('Failed to load user data from local storage', error);
      // Clear all keys on error to prevent corrupted state
      [PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY, COMPANY_CONFIGS_KEY, MASTER_QUESTIONS_KEY, COMPANY_ASSIGNMENTS_KEY, ASSESSMENT_COMPLETIONS_KEY, PLATFORM_USERS_KEY,
       `${PROFILE_KEY}${PREVIEW_SUFFIX}`, `${ASSESSMENT_KEY}${PREVIEW_SUFFIX}`, `${COMPLETED_TASKS_KEY}${PREVIEW_SUFFIX}`, `${TASK_DATE_OVERRIDES_KEY}${PREVIEW_SUFFIX}`
      ].forEach(k => localStorage.removeItem(k));
    } finally {
      setIsLoading(false);
    }
  }, [auth, profileKey, assessmentKey, completedTasksKey, taskDateOverridesKey]);
  
  useEffect(() => {
    if (auth?.role === 'hr' && auth.companyName && !isLoading) {
        const assignment = companyAssignments.find(a => a.companyName === auth.companyName);
        setCompanyAssignmentForHr(assignment || null);
    } else if (!auth || auth.role !== 'hr') {
        setCompanyAssignmentForHr(null);
    }
  }, [auth, companyAssignments, isLoading]);

  const saveProfileData = useCallback((data: ProfileData) => {
    try {
      localStorage.setItem(profileKey, JSON.stringify(data));
      setProfileData(data);
    } catch (error) { console.error('Failed to save profile data', error); }
  }, [profileKey]);

  const saveAssessmentData = useCallback((data: AssessmentData) => {
    try {
      localStorage.setItem(assessmentKey, JSON.stringify(data));
      setAssessmentData(data);

      if (auth?.role === 'end-user' && auth.email && !auth.isPreview) {
        setAssessmentCompletions(prev => {
            const newCompletions = { ...prev, [auth.email!]: true };
            localStorage.setItem(ASSESSMENT_COMPLETIONS_KEY, JSON.stringify(newCompletions));
            return newCompletions;
        });
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
    try {
        const questionsWithTimestamps = { ...questions };
        const setTimestamps = (q: Question) => {
            q.lastUpdated = new Date().toISOString();
            q.subQuestions?.forEach(setTimestamps);
        }
        Object.values(questionsWithTimestamps).forEach(q => {
             if (q.subQuestions) setTimestamps(q);
        });
        
        localStorage.setItem(MASTER_QUESTIONS_KEY, JSON.stringify(questionsWithTimestamps));
        setMasterQuestions(questionsWithTimestamps);
    } catch (error) {
        console.error('Failed to save master questions', error);
    }
  }, []);
  
  const saveCompanyConfig = useCallback((companyName: string, config: CompanyConfig) => {
    setCompanyConfigs(prev => {
        const newConfigs = { ...prev, [companyName]: config };
        try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
        } catch (error) { console.error('Failed to save company configs', error); }
        return newConfigs;
    });
  }, []);

  const saveCompanyUsers = useCallback((companyName: string, users: CompanyUser[]) => {
    setCompanyConfigs(prev => {
        const config = prev[companyName] || { questions: {}, users: [] };
        const newConfigs = { ...prev, [companyName]: { ...config, users: users }};
        try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
        } catch (error) { console.error('Failed to save company users', error); }
        return newConfigs;
    });
  }, []);
  
  const getCompanyForHr = useCallback((hrEmail: string): CompanyAssignment | undefined => {
    return companyAssignments.find(a => a.hrManagerEmail.toLowerCase() === hrEmail.toLowerCase());
  }, [companyAssignments]);

  const addCompanyAssignment = useCallback((assignment: CompanyAssignment) => {
    setCompanyAssignments(prev => {
      const newAssignments = [...prev, assignment];
      try {
        localStorage.setItem(COMPANY_ASSIGNMENTS_KEY, JSON.stringify(newAssignments));
      } catch (error) { console.error('Failed to save company assignments', error); }
      return newAssignments;
    });
    setCompanyConfigs(prev => {
      const newConfigs = { ...prev };
      if (!newConfigs[assignment.companyName]) {
          newConfigs[assignment.companyName] = {
              questions: {},
              users: [],
              customQuestions: {},
              questionOrderBySection: {}
          };
          try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
          } catch(e) { console.error('Failed to initialize company config', e) }
      }
      return newConfigs;
    });
  }, []);

  const updateCompanyAssignment = useCallback((companyName: string, updates: Partial<CompanyAssignment>) => {
    setCompanyAssignments(prev => {
        const newAssignments = prev.map(a => 
            a.companyName === companyName ? { ...a, ...updates } : a
        );
        localStorage.setItem(COMPANY_ASSIGNMENTS_KEY, JSON.stringify(newAssignments));
        return newAssignments;
    });
  }, []);

  const deleteCompanyAssignment = useCallback((companyName: string) => {
    setCompanyAssignments(prev => {
        const newAssignments = prev.filter(a => a.companyName !== companyName);
        localStorage.setItem(COMPANY_ASSIGNMENTS_KEY, JSON.stringify(newAssignments));
        return newAssignments;
    });
  }, []);

  const addPlatformUser = useCallback((user: PlatformUser) => {
    setPlatformUsers(prev => {
      if (prev.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        return prev;
      }
      const newUsers = [...prev, user];
      localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(newUsers));
      return newUsers;
    });
  }, []);

  const deletePlatformUser = useCallback((email: string) => {
    setPlatformUsers(prev => {
      const newUsers = prev.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(newUsers));
      return newUsers;
    });
  }, []);

  const getPlatformUserRole = useCallback((email: string): 'admin' | 'consultant' | null => {
    const user = platformUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? user.role : null;
  }, [platformUsers]);

  const getAllCompanyAssignments = useCallback(() => companyAssignments, [companyAssignments]);

  const getCompanyConfig = useCallback((companyName: string | undefined, activeOnly = true) => {
    if (isLoading || Object.keys(masterQuestions).length === 0) return {};

    const companyConfig = companyName ? companyConfigs[companyName] : undefined;
    
    // Start with a deep copy of master questions to avoid any mutation issues.
    const configuredQuestions = JSON.parse(JSON.stringify(masterQuestions));

    if (companyConfig) {
        const companyOverrides = companyConfig.questions || {};
        const customQuestions = companyConfig.customQuestions || {};

        const processQuestionTree = (question: Question) => {
            if (companyOverrides[question.id]) {
                Object.assign(question, companyOverrides[question.id]);
            }
            if (question.subQuestions) {
                question.subQuestions.forEach(processQuestionTree);
            }
            const customSubs = Object.values(customQuestions).filter(cq => cq.parentId === question.id);
            if (customSubs.length > 0) {
                question.subQuestions = [...(question.subQuestions || []), ...JSON.parse(JSON.stringify(customSubs))];
            }
        };

        Object.values(configuredQuestions).forEach(processQuestionTree);
        
        Object.values(customQuestions).forEach(cq => {
            if (!cq.parentId) {
                configuredQuestions[cq.id] = JSON.parse(JSON.stringify(cq));
            }
        });
    }

    if (!activeOnly) {
        return configuredQuestions;
    }

    const activeConfig: Record<string, Question> = {};
    const filterActive = (question: Question): Question | null => {
        if (!question.isActive) {
            return null;
        }
        const activeQuestion = { ...question };
        if (activeQuestion.subQuestions) {
            activeQuestion.subQuestions = activeQuestion.subQuestions.map(filterActive).filter(Boolean) as Question[];
        }
        return activeQuestion;
    };

    Object.values(configuredQuestions).forEach(q => {
        const activeQ = filterActive(q);
        if (activeQ) {
            activeConfig[q.id] = activeQ;
        }
    });

    return activeConfig;
}, [companyConfigs, masterQuestions, isLoading]);


  const getAllCompanyConfigs = useCallback(() => companyConfigs, [companyConfigs]);

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
        setAssessmentCompletions(prev => {
            const newCompletions = { ...prev };
            delete newCompletions[auth.email!];
            localStorage.setItem(ASSESSMENT_COMPLETIONS_KEY, JSON.stringify(newCompletions));
            return newCompletions;
        });
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
    assessmentCompletions,
    platformUsers,
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
