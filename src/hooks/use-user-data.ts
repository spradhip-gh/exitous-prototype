'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import type { AssessmentData } from '@/lib/schemas';

const PROFILE_KEY = 'exitous-profile';
const ASSESSMENT_KEY = 'exitous-assessment';
const COMPLETED_TASKS_KEY = 'exitous-completed-tasks';
const TASK_DATE_OVERRIDES_KEY = 'exitous-task-date-overrides';


export function useUserData() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskDateOverrides, setTaskDateOverrides] = useState<Record<string, string>>({});
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
        
        // Manually convert date strings back to Date objects
        const dateKeys: (keyof AssessmentData)[] = [
          'startDate', 'notificationDate', 'finalDate', 'relocationDate',
          'internalMessagingAccessEndDate', 'emailAccessEndDate', 'networkDriveAccessEndDate',
          'layoffPortalAccessEndDate', 'hrPayrollSystemAccessEndDate',
          'medicalCoverageEndDate', 'dentalCoverageEndDate', 'visionCoverageEndDate',
          'eapCoverageEndDate'
        ];
        
        for (const key of dateKeys) {
            // Check if the key exists and has a value before converting
            if (parsedData[key]) {
                const date = new Date(parsedData[key]);
                // Ensure the parsed date is valid before assigning
                if (!isNaN(date.getTime())) {
                    parsedData[key] = date;
                } else {
                    // If the stored string is not a valid date, treat it as not set.
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

    } catch (error) {
      console.error('Failed to load user data from local storage', error);
      // Clear potentially corrupted data
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ASSESSMENT_KEY);
      localStorage.removeItem(COMPLETED_TASKS_KEY);
      localStorage.removeItem(TASK_DATE_OVERRIDES_KEY);
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
    } catch (error) {
      console.error('Failed to clear user data from local storage', error);
    }
  }, []);

  return {
    profileData,
    assessmentData,
    completedTasks,
    taskDateOverrides,
    saveProfileData,
    saveAssessmentData,
    toggleTaskCompletion,
    updateTaskDate,
    clearData,
    isLoading,
  };
}
