import { z } from 'zod';
import type { Question } from './questions';

const profileBaseShape = {
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
};
const profileBaseSchema = z.object(profileBaseShape);

export const profileSchema = profileBaseSchema.refine(data => data.gender !== 'Prefer to self-describe' || (data.genderSelfDescribe && data.genderSelfDescribe.length > 0), {
    message: 'Please specify your gender identity.',
    path: ['genderSelfDescribe'],
});

export const profileQuestionsShape = profileBaseSchema.shape;

export type ProfileData = z.infer<typeof profileSchema>;


export function buildProfileSchema(questions: Question[]) {
    const shape: Record<string, z.ZodType<any, any>> = {};

    const buildShape = (qList: Question[]) => {
        qList.forEach(q => {
            const key = q.id as keyof ProfileData;
            switch(q.type) {
                case 'text':
                    if (q.id === 'birthYear') {
                        shape[key] = profileBaseShape.birthYear;
                    } else {
                        shape[key] = z.string().optional();
                    }
                    break;
                case 'select':
                case 'radio':
                    shape[key] = z.string().min(1, `${q.label} is required.`);
                    break;
                case 'checkbox':
                    shape[key] = z.array(z.string()).min(1, `Please select at least one option for ${q.label}.`);
                    break;
                default:
                    shape[key] = z.any();
            }

            if(q.subQuestions) {
                buildShape(q.subQuestions);
            }
        });
    };
    buildShape(questions);

    let schema: any = z.object(shape);

    const genderQuestion = questions.find(q => q.id === 'gender');
    if (genderQuestion) {
         schema = schema.refine((data: any) => data.gender !== 'Prefer to self-describe' || (data.genderSelfDescribe && data.genderSelfDescribe.length > 0), {
            message: 'Please specify your gender identity.',
            path: ['genderSelfDescribe'],
        });
    }
    
    return schema;
}



const baseAssessmentFields = {
  companyName: z.string().optional(),
  workStatus: z.enum([
        'Contract employee',
        'Full-time employee',
        'Independent contractor',
        'Intern or apprentice',
        'Part-time employee',
        'Other'
    ], { required_error: 'Work status is required.'}),
  startDate: z.date({ required_error: 'Start date is required.' }),
  notificationDate: z.date({ required_error: 'Notification date is required.' }),
  finalDate: z.date({ required_error: 'Final employment date is required.' }),
  workState: z.string({ required_error: 'Work state is required.' }).min(1, 'Work state is required.'),
  relocationPaid: z.string({ required_error: 'This field is required.' }).min(1),
  unionMember: z.string({ required_error: 'This field is required.' }).min(1),
  workArrangement: z.string({ required_error: 'This field is required.' }).min(1),
  workVisaStatus: z.string({ required_error: 'This field is required.' }).min(1),
  onLeave: z.array(z.string()).min(1, "Please select at least one option."),
  accessSystems: z.array(z.string()).optional(),
  hadMedicalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadDentalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadVisionInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadEAP: z.string({ required_error: 'This field is required.' }).min(1),
  
  // Conditionally rendered fields are optional at base
  severanceAgreementDeadline: z.date().optional(),
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

export function buildAssessmentSchema(activeQuestions: Question[]) {
  const getAllQuestionIds = (questions: Question[]): string[] => {
    let ids: string[] = [];
    questions.forEach(q => {
      ids.push(q.id);
      if (q.subQuestions) {
        ids = [...ids, ...getAllQuestionIds(q.subQuestions)];
      }
    });
    return ids;
  };

  const activeIds = new Set(getAllQuestionIds(activeQuestions));
  const shape: any = {};

  for (const key in baseAssessmentFields) {
    const fieldKey = key as keyof AssessmentData;
    if (activeIds.has(fieldKey)) {
      shape[fieldKey] = baseAssessmentFields[fieldKey];
    } else {
      if (baseAssessmentFields[fieldKey] && !baseAssessmentFields[fieldKey].isOptional()) {
        shape[fieldKey] = baseAssessmentFields[fieldKey].optional();
      } else {
         shape[fieldKey] = baseAssessmentFields[fieldKey];
      }
    }
  }

  let schema: any = z.object(shape).passthrough();

  const addRefinements = (questions: Question[]) => {
    questions.forEach(q => {
      if (q.subQuestions) {
        q.subQuestions.forEach(subQ => {
          if (!activeIds.has(subQ.id)) return;
          
          schema = schema.refine((data: any) => {
            const parentValue = data[q.id];
            
            // Determine if sub-question is triggered
            let isTriggered = false;
            if (q.type === 'checkbox') {
              if (subQ.triggerValue === 'NOT_NONE') {
                isTriggered = Array.isArray(parentValue) && parentValue.length > 0 && !parentValue.includes('None of the above');
              } else {
                isTriggered = Array.isArray(parentValue) && parentValue.includes(subQ.triggerValue);
              }
            } else {
              isTriggered = parentValue === subQ.triggerValue;
            }

            // If not triggered, validation passes
            if (!isTriggered) return true;
            
            // If triggered, value must be present
            const subValue = data[subQ.id];
            return subValue !== undefined && subValue !== null && subValue !== '' && (!Array.isArray(subValue) || subValue.length > 0);
          }, {
            message: `${subQ.label} is required.`,
            path: [subQ.id],
          });
        });
        
        // Recurse for deeper nesting
        addRefinements(q.subQuestions);
      }
    });
  };

  addRefinements(activeQuestions);

  return schema;
}
