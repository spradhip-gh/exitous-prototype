'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '@/lib/schemas';
import type { AssessmentData } from '@/lib/schemas';

const PROFILE_KEY = 'exitous-profile';
const ASSESSMENT_KEY = 'exitous-assessment';

export function useUserData() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
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
    } catch (error) {
      console.error('Failed to load user data from local storage', error);
      // Clear potentially corrupted data
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ASSESSMENT_KEY);
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

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ASSESSMENT_KEY);
      setProfileData(null);
      setAssessmentData(null);
    } catch (error) {
      console.error('Failed to clear user data from local storage', error);
    }
  }, []);

  return {
    profileData,
    assessmentData,
    saveProfileData,
    saveAssessmentData,
    clearData,
    isLoading,
  };
}
