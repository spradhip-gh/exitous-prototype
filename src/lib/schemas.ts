import { z } from 'zod';

export const profileSchema = z.object({
    birthYear: z.coerce
        .number({ required_error: 'Birth year is required.' })
        .min(1920, 'Please enter a valid year.')
        .max(new Date().getFullYear() - 16, 'You must be at least 16 years old.'),
    state: z.string().min(1, 'State is required.'),
    gender: z.string().min(1, 'Gender is required.'),
    genderSelfDescribe: z.string().optional(),
    maritalStatus: z.string().min(1, 'Marital status is required.'),
    hasChildrenUnder13: z.string().min(1, 'This field is required.'),
    hasExpectedChildren: z.string().min(1, 'This field is required.'),
    impactedPeopleCount: z.string().min(1, 'This field is required.'),
    livingStatus: z.string().min(1, 'Living status is required.'),
    citizenshipStatus: z.string().min(1, 'Citizenship status is required.'),
    pastLifeEvents: z.array(z.string()).min(1, 'Please select at least one option.'),
    hasChildrenAges18To26: z.string().min(1, 'This field is required.'),
}).refine(data => data.gender !== 'Prefer to self-describe' || (data.genderSelfDescribe && data.genderSelfDescribe.length > 0), {
    message: 'Please specify your gender identity.',
    path: ['genderSelfDescribe'],
});

export type ProfileData = z.infer<typeof profileSchema>;

const baseAssessmentFields = {
  workStatus: z.string({ required_error: 'Work status is required.'}).min(1, 'Work status is required.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  notificationDate: z.date({ required_error: 'Notification date is required.' }),
  finalDate: z.date({ required_error: 'Final employment date is required.' }),
  workState: z.string({ required_error: 'Work state is required.' }).min(1, 'Work state is required.'),
  relocationPaid: z.string({ required_error: 'This field is required.' }).min(1),
  unionMember: z.string({ required_error: 'This field is required.' }).min(1),
  workArrangement: z.string({ required_error: 'This field is required.' }).min(1),
  workVisa: z.string({ required_error: 'This field is required.' }).min(1),
  onLeave: z.array(z.string()).min(1, "Please select at least one option."),
  accessSystems: z.array(z.string()).optional(),
  hadMedicalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadDentalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadVisionInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadEAP: z.string({ required_error: 'This field is required.' }).min(1),
  
  // Conditionally rendered fields are optional at base
  relocationDate: z.date().optional(),
  workArrangementOther: z.string().optional(),
  usedLeaveManagement: z.string().optional(),
  internalMessagingAccessEndDate: z.date().optional(),
  emailAccessEndDate: z.date().optional(),
  networkDriveAccessEndDate: z.date().optional(),
  layoffPortalAccessEndDate: z.date().optional(),
  hrPayrollSystemAccessEndDate: z.date().optional(),
  medicalCoverage: z.string().optional(),
  medicalCoverageEndDate: z.date().optional(),
  dentalCoverage: z.string().optional(),
  dentalCoverageEndDate: z.date().optional(),
  visionCoverage: z.string().optional(),
  visionCoverageEndDate: z.date().optional(),
  eapCoverageEndDate: z.date().optional(),
};

export type AssessmentData = z.infer<z.ZodObject<typeof baseAssessmentFields>>;

export function buildAssessmentSchema(activeQuestionIds: (keyof AssessmentData)[]) {
  const activeIds = new Set(activeQuestionIds);
  const shape: any = {};

  for (const key in baseAssessmentFields) {
      const fieldKey = key as keyof AssessmentData;
      if (activeIds.has(fieldKey)) {
          shape[fieldKey] = baseAssessmentFields[fieldKey];
      } else {
          // If the question is not active, the field is not required.
          // The base schema already defines conditional fields as optional.
          if (baseAssessmentFields[fieldKey] && !baseAssessmentFields[fieldKey].isOptional()){
             shape[fieldKey] = baseAssessmentFields[fieldKey].optional();
          }
      }
  }

  // Ensure conditional fields are present in the shape if their trigger is active
  const conditionalFields: (keyof AssessmentData)[] = [
    'relocationDate', 'workArrangementOther', 'usedLeaveManagement', 'internalMessagingAccessEndDate', 'emailAccessEndDate',
    'networkDriveAccessEndDate', 'layoffPortalAccessEndDate', 'hrPayrollSystemAccessEndDate', 'medicalCoverage', 'medicalCoverageEndDate',
    'dentalCoverage', 'dentalCoverageEndDate', 'visionCoverage', 'visionCoverageEndDate', 'eapCoverageEndDate'
  ];
  conditionalFields.forEach(field => {
      shape[field] = baseAssessmentFields[field];
  });


  // Apply passthrough here to allow for custom questions.
  let schema: any = z.object(shape).passthrough();

  // Conditionally apply refinements only if the triggering question is active
  if (activeIds.has('relocationPaid')) {
    schema = schema.refine(data => data.relocationPaid !== 'Yes' || data.relocationDate !== undefined, {
        message: 'Relocation date is required.',
        path: ['relocationDate'],
    });
  }
  if (activeIds.has('workArrangement')) {
      schema = schema.refine(data => data.workArrangement !== 'Other' || (data.workArrangementOther && data.workArrangementOther.length > 0), {
          message: 'Please specify your work arrangement.',
          path: ['workArrangementOther'],
      });
  }
  if (activeIds.has('onLeave')) {
      schema = schema.refine(data => !(data.onLeave && data.onLeave.length > 0 && !data.onLeave.includes('None of the above')) || !!data.usedLeaveManagement, {
          message: 'This field is required.',
          path: ['usedLeaveManagement']
      });
  }
  if (activeIds.has('hadMedicalInsurance')) {
      schema = schema.refine(data => data.hadMedicalInsurance !== 'Yes' || !!data.medicalCoverage, {
          message: 'This field is required.',
          path: ['medicalCoverage'],
      }).refine(data => data.hadMedicalInsurance !== 'Yes' || !!data.medicalCoverageEndDate, {
          message: 'This field is required.',
          path: ['medicalCoverageEndDate'],
      });
  }
   if (activeIds.has('hadDentalInsurance')) {
      schema = schema.refine(data => data.hadDentalInsurance !== 'Yes' || !!data.dentalCoverage, {
          message: 'This field is required.',
          path: ['dentalCoverage'],
      }).refine(data => data.hadDentalInsurance !== 'Yes' || !!data.dentalCoverageEndDate, {
          message: 'This field is required.',
          path: ['dentalCoverageEndDate'],
      });
  }
  if (activeIds.has('hadVisionInsurance')) {
      schema = schema.refine(data => data.hadVisionInsurance !== 'Yes' || !!data.visionCoverage, {
          message: 'This field is required.',
          path: ['visionCoverage'],
      }).refine(data => data.hadVisionInsurance !== 'Yes' || !!data.visionCoverageEndDate, {
          message: 'This field is required.',
          path: ['visionCoverageEndDate'],
      });
  }
  if (activeIds.has('hadEAP')) {
      schema = schema.refine(data => data.hadEAP !== 'Yes' || !!data.eapCoverageEndDate, {
          message: 'This field is required.',
          path: ['eapCoverageEndDate'],
      });
  }
  if (activeIds.has('accessSystems')) {
      schema = schema
        .refine(data => !data.accessSystems?.includes('Internal messaging system (e.g., Slack, Google Chat, Teams)') || !!data.internalMessagingAccessEndDate, {
            message: 'End date is required.', path: ['internalMessagingAccessEndDate'],
        })
        .refine(data => !data.accessSystems?.includes('Email') || !!data.emailAccessEndDate, {
            message: 'End date is required.', path: ['emailAccessEndDate'],
        })
        .refine(data => !data.accessSystems?.includes('Network drive & files') || !!data.networkDriveAccessEndDate, {
            message: 'End date is required.', path: ['networkDriveAccessEndDate'],
        })
        .refine(data => !data.accessSystems?.includes('Special layoff portal') || !!data.layoffPortalAccessEndDate, {
            message: 'End date is required.', path: ['layoffPortalAccessEndDate'],
        })
        .refine(data => !data.accessSystems?.includes('HR/Payroll system (e.g., ADP, Workday)') || !!data.hrPayrollSystemAccessEndDate, {
            message: 'End date is required.', path: ['hrPayrollSystemAccessEndDate'],
        });
  }

  return schema;
}
