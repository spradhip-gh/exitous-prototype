'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import type { AssessmentData } from '@/lib/schemas';
import { getDefaultQuestions, Question } from '@/lib/questions';

const PROFILE_KEY = 'exitous-profile';
const ASSESSMENT_KEY = 'exitous-assessment';
const COMPLETED_TASKS_KEY = 'exitous-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitous-task-date-overrides';
const COMPANY_CONFIGS_KEY = 'exitous-company-configs';
const MASTER_QUESTIONS_KEY = 'exitous-master-questions';


export interface CompanyUser {
  email: string;
  companyId: string;
}

export interface CompanyConfig {
  questions: Record<string, Question>;
  users: CompanyUser[];
}

export function useUserData() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
  const [companyConfigs, setCompanyConfigs] = useState<Record<string, CompanyConfig>>({});
  const [masterQuestions, setMasterQuestions] = useState<Record<string, Question>>({});
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

    } catch (error) {
      console.error('Failed to load user data from local storage', error);
      // Clear all keys on error to prevent inconsistent state
      [PROFILE_KEY, ASSESSMENT_KEY, COMPLETED_TASKS_KEY, TASK_DATE_OVERRIDES_KEY, COMPANY_CONFIGS_KEY, MASTER_QUESTIONS_KEY].forEach(k => localStorage.removeItem(k));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    } catch (error) { console.error('Failed to save assessment data', error); }
  }, []);

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

  const saveCompanyQuestions = useCallback((companyName: string, questions: Record<string, Question>) => {
    setCompanyConfigs(prev => {
        const newConfigs = { ...prev, [companyName]: { ...prev[companyName], questions: questions, users: prev[companyName]?.users || [] }};
        try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
        } catch (error) { console.error('Failed to save company configs', error); }
        return newConfigs;
    });
  }, []);

  const saveCompanyUsers = useCallback((companyName: string, users: CompanyUser[]) => {
    setCompanyConfigs(prev => {
        const newConfigs = { ...prev, [companyName]: { ...prev[companyName], questions: prev[companyName]?.questions || {}, users: users }};
        try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
        } catch (error) { console.error('Failed to save company users', error); }
        return newConfigs;
    });
  }, []);

  const getCompanyConfig = useCallback((companyName: string | undefined) => {
    const baseQuestions = masterQuestions;
    if (!companyName || !companyConfigs[companyName]?.questions) {
      return Object.fromEntries(Object.entries(baseQuestions).filter(([, q]) => q.isActive));
    }
    const companySpecificQuestions = companyConfigs[companyName].questions;
    const finalConfig: Record<string, Question> = {};
    Object.keys(baseQuestions).forEach(qId => {
        const companyQ = companySpecificQuestions[qId];
        const masterQ = baseQuestions[qId];
        if (companyQ !== undefined) {
            if (companyQ.isActive) finalConfig[qId] = companyQ;
        } else if (masterQ.isActive) {
            finalConfig[qId] = masterQ;
        }
    });
    return finalConfig;
  }, [companyConfigs, masterQuestions]);

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
    } catch (error) { console.error('Failed to clear user data', error); }
  }, []);

  return {
    profileData,
    assessmentData,
    completedTasks,
    taskDateOverrides,
    isLoading,
    masterQuestions,
    saveProfileData,
    saveAssessmentData,
    toggleTaskCompletion,
    updateTaskDate,
    clearData,
    saveMasterQuestions,
    saveCompanyQuestions,
    saveCompanyUsers,
    getCompanyConfig,
    getAllCompanyConfigs,
  };
}
