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


export const assessmentSchema = z.object({
  workStatus: z.string({ required_error: 'Work status is required.'}).min(1, 'Work status is required.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  notificationDate: z.date({ required_error: 'Notification date is required.' }),
  finalDate: z.date({ required_error: 'Final employment date is required.' }),
  workState: z.string({ required_error: 'Work state is required.' }).min(1, 'Work state is required.'),
  
  relocationPaid: z.string({ required_error: 'This field is required.' }).min(1),
  relocationDate: z.date().optional(),

  unionMember: z.string({ required_error: 'This field is required.' }).min(1),
  
  workArrangement: z.string({ required_error: 'This field is required.' }).min(1),
  workArrangementOther: z.string().optional(),
  
  workVisa: z.string({ required_error: 'This field is required.' }).min(1),

  onLeave: z.array(z.string()).min(1, "Please select at least one option."),
  usedLeaveManagement: z.string().optional(),

  accessSystems: z.array(z.string()).optional(),
  internalMessagingAccessEndDate: z.date().optional(),
  emailAccessEndDate: z.date().optional(),
  networkDriveAccessEndDate: z.date().optional(),
  layoffPortalAccessEndDate: z.date().optional(),
  hrPayrollSystemAccessEndDate: z.date().optional(),
  
  hadMedicalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  medicalCoverage: z.string().optional(),
  medicalCoverageEndDate: z.date().optional(),
  
  hadDentalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  dentalCoverage: z.string().optional(),
  dentalCoverageEndDate: z.date().optional(),
  
  hadVisionInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  visionCoverage: z.string().optional(),
  visionCoverageEndDate: z.date().optional(),
  
  hadEAP: z.string({ required_error: 'This field is required.' }).min(1),
  eapCoverageEndDate: z.date().optional(),
})
.refine(data => data.relocationPaid !== 'Yes' || data.relocationDate !== undefined, {
    message: 'Relocation date is required.',
    path: ['relocationDate'],
})
.refine(data => data.workArrangement !== 'Other' || (data.workArrangementOther && data.workArrangementOther.length > 0), {
    message: 'Please specify your work arrangement.',
    path: ['workArrangementOther'],
})
.refine(data => !(data.onLeave.length > 0 && !data.onLeave.includes('None of the above')) || !!data.usedLeaveManagement, {
    message: 'This field is required.',
    path: ['usedLeaveManagement']
})
.refine(data => data.hadMedicalInsurance !== 'Yes' || !!data.medicalCoverage, {
    message: 'This field is required.',
    path: ['medicalCoverage'],
})
.refine(data => data.hadMedicalInsurance !== 'Yes' || !!data.medicalCoverageEndDate, {
    message: 'This field is required.',
    path: ['medicalCoverageEndDate'],
})
.refine(data => data.hadDentalInsurance !== 'Yes' || !!data.dentalCoverage, {
    message: 'This field is required.',
    path: ['dentalCoverage'],
})
.refine(data => data.hadDentalInsurance !== 'Yes' || !!data.dentalCoverageEndDate, {
    message: 'This field is required.',
    path: ['dentalCoverageEndDate'],
})
.refine(data => data.hadVisionInsurance !== 'Yes' || !!data.visionCoverage, {
    message: 'This field is required.',
    path: ['visionCoverage'],
})
.refine(data => data.hadVisionInsurance !== 'Yes' || !!data.visionCoverageEndDate, {
    message: 'This field is required.',
    path: ['visionCoverageEndDate'],
})
.refine(data => data.hadEAP !== 'Yes' || !!data.eapCoverageEndDate, {
    message: 'This field is required.',
    path: ['eapCoverageEndDate'],
})
.refine(data => !data.accessSystems?.includes('messaging') || !!data.internalMessagingAccessEndDate, {
    message: 'End date is required.',
    path: ['internalMessagingAccessEndDate'],
})
.refine(data => !data.accessSystems?.includes('email') || !!data.emailAccessEndDate, {
    message: 'End date is required.',
    path: ['emailAccessEndDate'],
})
.refine(data => !data.accessSystems?.includes('network') || !!data.networkDriveAccessEndDate, {
    message: 'End date is required.',
    path: ['networkDriveAccessEndDate'],
})
.refine(data => !data.accessSystems?.includes('portal') || !!data.layoffPortalAccessEndDate, {
    message: 'End date is required.',
    path: ['layoffPortalAccessEndDate'],
})
.refine(data => !data.accessSystems?.includes('hr_payroll') || !!data.hrPayrollSystemAccessEndDate, {
    message: 'End date is required.',
    path: ['hrPayrollSystemAccessEndDate'],
});


export type AssessmentData = z.infer<typeof assessmentSchema>;
