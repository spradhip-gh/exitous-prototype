
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import type { AssessmentData } from '@/lib/schemas';
import { getDefaultQuestions, Question } from '@/lib/questions';
import { useAuth } from './use-auth';

const PROFILE_KEY = 'exitbetter-profile';
const ASSESSMENT_KEY = 'exitbetter-assessment';
const COMPLETED_TASKS_KEY = 'exitbetter-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitbetter-task-date-overrides';
const COMPANY_CONFIGS_KEY = 'exitbetter-company-configs';
const MASTER_QUESTIONS_KEY = 'exitbetter-master-questions';
const COMPANY_ASSIGNMENTS_KEY = 'exitbetter-company-assignments';
const ASSESSMENT_COMPLETIONS_KEY = 'exitbetter-assessment-completions';
const PLATFORM_USERS_KEY = 'exitbetter-platform-users';

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

export { Question };


export function useUserData() {
  const { auth } = useAuth();
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
    try {
      const profileJson = localStorage.getItem(PROFILE_KEY);
      if (profileJson) setProfileData(JSON.parse(profileJson));

      const assessmentJson = localStorage.getItem(ASSESSMENT_KEY);
      if (assessmentJson) {
        const parsedData = JSON.parse(assessmentJson);
        const dateKeys: (keyof AssessmentData)[] = ['startDate', 'notificationDate', 'finalDate', 'relocationDate', 'internalMessagingAccessEndDate', 'emailAccessEndDate', 'networkDriveAccessEndDate', 'layoffPortalAccessEndDate', 'hrPayrollSystemAccessEndDate', 'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate', 'eapCoverageEndDate'];
        for (const key of dateKeys) {
            if (parsedData[key]) {
                const date = new Date(parsedData[key]);
                parsedData[key] = !isNaN(date.getTime()) ? date : undefined;
            }
        }
        setAssessmentData(parsedData);
      }

      const completedTasksJson = localStorage.getItem(COMPLETED_TASKS_KEY);
      if (completedTasksJson) setCompletedTasks(new Set(JSON.parse(completedTasksJson)));

      const dateOverridesJson = localStorage.getItem(TASK_DATE_OVERRIDES_KEY);
      if (dateOverridesJson) setTaskDateOverrides(JSON.parse(dateOverridesJson));

      const configsJson = localStorage.getItem(COMPANY_CONFIGS_KEY);
      if (configsJson) setCompanyConfigs(JSON.parse(configsJson));
      
      const masterQuestionsJson = localStorage.getItem(MASTER_QUESTIONS_KEY);
      if (masterQuestionsJson) {
        setMasterQuestions(JSON.parse(masterQuestionsJson));
      } else {
        const initialQuestions: Record<string, Question> = {};
        getDefaultQuestions().forEach(q => {
            initialQuestions[q.id] = { ...q, lastUpdated: new Date().toISOString() };
        });
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
      [PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY, COMPANY_CONFIGS_KEY, MASTER_QUESTIONS_KEY, COMPANY_ASSIGNMENTS_KEY, ASSESSMENT_COMPLETIONS_KEY, PLATFORM_USERS_KEY].forEach(k => localStorage.removeItem(k));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
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
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
      setProfileData(data);
    } catch (error) { console.error('Failed to save profile data', error); }
  }, []);

  const saveAssessmentData = useCallback((data: AssessmentData) => {
    try {
      localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(data));
      setAssessmentData(data);

      if (auth?.role === 'end-user' && auth.email) {
        setAssessmentCompletions(prev => {
            const newCompletions = { ...prev, [auth.email!]: true };
            localStorage.setItem(ASSESSMENT_COMPLETIONS_KEY, JSON.stringify(newCompletions));
            return newCompletions;
        });
      }

    } catch (error) { console.error('Failed to save assessment data', error); }
  }, [auth]);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId);
      try {
        localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(Array.from(newSet)));
      } catch (error) { console.error('Failed to save completed tasks', error); }
      return newSet;
    });
  }, []);

  const updateTaskDate = useCallback((taskId: string, newDate: Date) => {
    setTaskDateOverrides(prev => {
      const newOverrides = { ...prev, [taskId]: newDate.toISOString().split('T')[0] };
       try {
        localStorage.setItem(TASK_DATE_OVERRIDES_KEY, JSON.stringify(newOverrides));
      } catch (error) { console.error('Failed to save date overrides', error); }
      return newOverrides;
    });
  }, []);
  
  const saveMasterQuestions = useCallback((questions: Record<string, Question>) => {
    try {
        const questionsWithTimestamps = { ...questions };
        Object.keys(questionsWithTimestamps).forEach(id => {
            questionsWithTimestamps[id] = { ...questionsWithTimestamps[id], lastUpdated: new Date().toISOString() };
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

  const getCompanyConfig = useCallback((companyName: string | undefined) => {
    const finalConfig: Record<string, Question> = {};
    if (isLoading) return finalConfig;

    const baseQuestions = masterQuestions;
    const companyConfig = companyName ? companyConfigs[companyName] : undefined;
    const companyOverrides = companyConfig?.questions || {};
    const customQuestions = companyConfig?.customQuestions || {};

    // Combine all questions
    const allQuestions: Record<string, Question> = {};
    // Start with master questions
    Object.keys(baseQuestions).forEach(id => {
        allQuestions[id] = {...baseQuestions[id]};
    });
    // Apply company overrides
    Object.keys(companyOverrides).forEach(id => {
        if (allQuestions[id]) {
            allQuestions[id] = {...allQuestions[id], ...companyOverrides[id]};
        }
    });
    // Add custom questions
    Object.assign(allQuestions, customQuestions);

    // Filter by active questions
    Object.keys(allQuestions).forEach(id => {
        if (allQuestions[id].isActive) {
            finalConfig[id] = allQuestions[id];
        }
    });
    
    return finalConfig;

  }, [companyConfigs, masterQuestions, isLoading]);

  const getAllCompanyConfigs = useCallback(() => companyConfigs, [companyConfigs]);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ASSESSMENT_KEY);
      localStorage.removeItem(COMPLETED_TASKS_KEY);
      localStorage.removeItem(TASK_DATE_OVERRIDES_KEY);
      setProfileData(null);
      setAssessmentData(null);
      setCompletedTasks(new Set());
      setTaskDateOverrides({});
      
      if (auth?.role === 'end-user' && auth.email) {
        setAssessmentCompletions(prev => {
            const newCompletions = { ...prev };
            delete newCompletions[auth.email!];
            localStorage.setItem(ASSESSMENT_COMPLETIONS_KEY, JSON.stringify(newCompletions));
            return newCompletions;
        });
      }

    } catch (error) { console.error('Failed to clear user data', error); }
  }, [auth]);

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
