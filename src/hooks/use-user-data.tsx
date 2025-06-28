


'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import { type AssessmentData } from '@/lib/schemas';
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

const demoAssignments: CompanyAssignment[] = [
    { companyName: 'Globex Corp', hrManagerEmail: 'hr@globex.com', version: 'pro', maxUsers: 50 },
    { companyName: 'Initech', hrManagerEmail: 'hr@initech.com', version: 'basic', maxUsers: 10 }
];

const demoConfigs: Record<string, CompanyConfig> = {
    'Globex Corp': {
        questions: {},
        users: [
            { email: 'employee1@globex.com', companyId: 'G123' },
            { email: 'employee2@globex.com', companyId: 'G456' }
        ],
        customQuestions: {},
        questionOrderBySection: {}
    },
    'Initech': {
        questions: {},
        users: [
            { email: 'employee@initech.com', companyId: 'I-99' }
        ],
        customQuestions: {},
        questionOrderBySection: {}
    }
};

const demoPlatformUsers: PlatformUser[] = [
    { email: 'admin@example.com', role: 'admin' },
    { email: 'consultant@example.com', role: 'consultant' }
];


export const buildQuestionTreeFromMap = (flatQuestionMap: Record<string, Question>): Question[] => {
    if (!flatQuestionMap || Object.keys(flatQuestionMap).length === 0) return [];
    
    // Use a more robust copy method instead of JSON.stringify
    const questionMapWithSubs: Record<string, Question> = {};
    Object.keys(flatQuestionMap).forEach(key => {
        questionMapWithSubs[key] = { ...flatQuestionMap[key], subQuestions: [] };
    });

    const rootQuestions: Question[] = [];

    // Link sub-questions to parents
    Object.values(questionMapWithSubs).forEach(q => {
        if (q.parentId && questionMapWithSubs[q.parentId]) {
            // This is a sub-question, push it to its parent
            questionMapWithSubs[q.parentId].subQuestions!.push(q);
        } else {
            // This is a root-level question
            rootQuestions.push(q);
        }
    });

    return rootQuestions;
};


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
      
      const assignmentsJson = localStorage.getItem(COMPANY_ASSIGNMENTS_KEY);
      if (assignmentsJson) {
        setCompanyAssignments(JSON.parse(assignmentsJson));
      } else {
        setCompanyAssignments(demoAssignments);
        localStorage.setItem(COMPANY_ASSIGNMENTS_KEY, JSON.stringify(demoAssignments));
      }
      
      const configsJson = localStorage.getItem(COMPANY_CONFIGS_KEY);
      if (configsJson) {
        setCompanyConfigs(JSON.parse(configsJson));
      } else {
        setCompanyConfigs(demoConfigs);
        localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(demoConfigs));
      }
      
      const masterQuestionsJson = localStorage.getItem(MASTER_QUESTIONS_KEY);
      if (masterQuestionsJson) {
        setMasterQuestions(JSON.parse(masterQuestionsJson));
      } else {
        const defaultQuestions = getDefaultQuestions();
        const flatMap: Record<string, Question> = {};
        const processQuestion = (q: Question) => {
            const { subQuestions, ...rest } = q;
            flatMap[q.id] = { ...rest, lastUpdated: new Date().toISOString() };
            if (subQuestions) {
                subQuestions.forEach(processQuestion);
            }
        };
        defaultQuestions.forEach(processQuestion);
        setMasterQuestions(flatMap);
        localStorage.setItem(MASTER_QUESTIONS_KEY, JSON.stringify(flatMap));
      }
      
      const completionsJson = localStorage.getItem(ASSESSMENT_COMPLETIONS_KEY);
      if (completionsJson) setAssessmentCompletions(JSON.parse(completionsJson));

      const platformUsersJson = localStorage.getItem(PLATFORM_USERS_KEY);
      if (platformUsersJson) {
        setPlatformUsers(JSON.parse(platformUsersJson));
      } else {
        setPlatformUsers(demoPlatformUsers);
        localStorage.setItem(PLATFORM_USERS_KEY, JSON.stringify(demoPlatformUsers));
      }

    } catch (error) {
      console.error('Failed to load user data from local storage', error);
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
        Object.values(questionsWithTimestamps).forEach(q => {
            q.lastUpdated = new Date().toISOString();
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

  const getCompanyConfig = useCallback((companyName: string | undefined, activeOnly = true): Question[] => {
    if (isLoading || Object.keys(masterQuestions).length === 0) return [];

    const companyConfig = companyName ? companyConfigs[companyName] : undefined;
    
    // Create a deep copy to avoid mutating the master questions state
    const combinedFlatMap = JSON.parse(JSON.stringify({
        ...masterQuestions,
        ...(companyConfig?.customQuestions || {})
    }));
    
    if (companyConfig?.questions) {
        for (const id in companyConfig.questions) {
            if (combinedFlatMap[id]) {
                Object.assign(combinedFlatMap[id], companyConfig.questions[id]);
            }
        }
    }
    
    let questionTree = buildQuestionTreeFromMap(combinedFlatMap);

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
