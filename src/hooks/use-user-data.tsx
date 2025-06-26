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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const profileJson = localStorage.getItem(PROFILE_KEY);
      if (profileJson) {
        setProfileData(JSON.parse(profileJson));
      }

      const assessmentJson = localStorage.getItem(ASSESSMENT_KEY);
      if (assessmentJson) {
        const parsedData = JSON.parse(assessmentJson);
        
        const dateKeys: (keyof AssessmentData)[] = [
          'startDate', 'notificationDate', 'finalDate', 'relocationDate',
          'internalMessagingAccessEndDate', 'emailAccessEndDate', 'networkDriveAccessEndDate',
          'layoffPortalAccessEndDate', 'hrPayrollSystemAccessEndDate',
          'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate',
          'eapCoverageEndDate'
        ];
        
        for (const key of dateKeys) {
            if (parsedData[key]) {
                const date = new Date(parsedData[key]);
                if (!isNaN(date.getTime())) {
                    parsedData[key] = date;
                } else {
                    parsedData[key] = undefined;
                }
            }
        }
        setAssessmentData(parsedData);
      }

      const completedTasksJson = localStorage.getItem(COMPLETED_TASKS_KEY);
      if (completedTasksJson) {
        setCompletedTasks(new Set(JSON.parse(completedTasksJson)));
      }

      const dateOverridesJson = localStorage.getItem(TASK_DATE_OVERRIDES_KEY);
      if (dateOverridesJson) {
        setTaskDateOverrides(JSON.parse(dateOverridesJson));
      }

      const configsJson = localStorage.getItem(COMPANY_CONFIGS_KEY);
      if (configsJson) {
        setCompanyConfigs(JSON.parse(configsJson));
      }

    } catch (error) {
      console.error('Failed to load user data from local storage', error);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ASSESSMENT_KEY);
      localStorage.removeItem(COMPLETED_TASKS_KEY);
      localStorage.removeItem(TASK_DATE_OVERRIDES_KEY);
      localStorage.removeItem(COMPANY_CONFIGS_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfileData = useCallback((data: ProfileData) => {
    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(PROFILE_KEY, jsonData);
      setProfileData(data);
    } catch (error) {
      console.error('Failed to save profile data to local storage', error);
    }
  }, []);

  const saveAssessmentData = useCallback((data: AssessmentData) => {
    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(ASSESSMENT_KEY, jsonData);
      setAssessmentData(data);
    } catch (error) {
      console.error('Failed to save assessment data to local storage', error);
    }
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      try {
        localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Failed to save completed tasks to local storage', error);
      }
      return newSet;
    });
  }, []);

  const updateTaskDate = useCallback((taskId: string, newDate: Date) => {
    setTaskDateOverrides(prev => {
      const newOverrides = { ...prev, [taskId]: newDate.toISOString().split('T')[0] };
       try {
        localStorage.setItem(TASK_DATE_OVERRIDES_KEY, JSON.stringify(newOverrides));
      } catch (error) {
        console.error('Failed to save date overrides to local storage', error);
      }
      return newOverrides;
    });
  }, []);

  const saveCompanyQuestions = useCallback((companyName: string, questions: Record<string, Question>) => {
    setCompanyConfigs(prev => {
        const newConfigs = { 
            ...prev, 
            [companyName]: {
                ...prev[companyName],
                questions: questions,
                users: prev[companyName]?.users || []
            }
        };
        try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
        } catch (error) {
            console.error('Failed to save company configs to local storage', error);
        }
        return newConfigs;
    });
  }, []);

  const saveCompanyUsers = useCallback((companyName: string, users: CompanyUser[]) => {
    setCompanyConfigs(prev => {
        const newConfigs = { 
            ...prev,
            [companyName]: {
                ...prev[companyName],
                questions: prev[companyName]?.questions || {},
                users: users,
            }
        };
        try {
            localStorage.setItem(COMPANY_CONFIGS_KEY, JSON.stringify(newConfigs));
        } catch (error) {
            console.error('Failed to save company users to local storage', error);
        }
        return newConfigs;
    });
  }, []);

  const getCompanyConfig = useCallback((companyName: string | undefined) => {
    const defaultConfig: Record<string, Question> = {};
    getDefaultQuestions().forEach(q => defaultConfig[q.id] = q);

    if (!companyName || !companyConfigs[companyName]?.questions) {
      return defaultConfig;
    }
    
    // Ensure all default questions are present in the returned config
    return { ...defaultConfig, ...companyConfigs[companyName].questions };
  }, [companyConfigs]);

  const getAllCompanyConfigs = useCallback(() => {
    return companyConfigs;
  }, [companyConfigs]);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ASSESSMENT_KEY);
      localStorage.removeItem(COMPLETED_TASKS_KEY);
      localStorage.removeItem(TASK_DATE_OVERRIDES_KEY);
      // We don't clear company configs as that's an admin setting
      setProfileData(null);
      setAssessmentData(null);
      setCompletedTasks(new Set());
      setTaskDateOverrides({});
    } catch (error) {
      console.error('Failed to clear user data from local storage', error);
    }
  }, []);

  return {
    profileData,
    assessmentData,
    completedTasks,
    taskDateOverrides,
    isLoading,
    saveProfileData,
    saveAssessmentData,
    toggleTaskCompletion,
    updateTaskDate,
    clearData,
    saveCompanyQuestions,
    saveCompanyUsers,
    getCompanyConfig,
    getAllCompanyConfigs,
  };
}
