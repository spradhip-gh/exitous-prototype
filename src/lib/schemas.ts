
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
    // Fields moved from Account Settings to be part of the core profile
    personalEmail: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
    phone: z.string().optional(),
    // Notification settings remain separate conceptually but are part of the same data object
    notificationEmail: z.string().email().optional(),
    notificationSettings: z.object({
        email: z.object({
            all: z.boolean().optional(),
            taskReminders: z.boolean().optional(),
            unsureReminders: z.boolean().optional(),
            criticalDateReminders: z.boolean().optional(),
        }).optional(),
        sms: z.object({
            all: z.boolean().optional(),
            taskReminders: z.boolean().optional(),
            unsureReminders: z.boolean().optional(),
            criticalDateReminders: z.boolean().optional(),
        }).optional(),
    }).optional(),
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

    // First, create the full object with all fields, including the static account ones.
    const fullShape = {
        ...shape,
        personalEmail: profileBaseShape.personalEmail,
        phone: profileBaseShape.phone,
        notificationEmail: profileBaseShape.notificationEmail,
        notificationSettings: profileBaseShape.notificationSettings,
    };
    
    let baseSchema = z.object(fullShape);

    // Now, apply refinements to the complete object schema.
    const genderQuestion = questions.find(q => q.id === 'gender');
    if (genderQuestion) {
         baseSchema = baseSchema.refine((data: any) => data.gender !== 'Prefer to self-describe' || (data.genderSelfDescribe && data.genderSelfDescribe.length > 0), {
            message: 'Please specify your gender identity.',
            path: ['genderSelfDescribe'],
        }) as any;
    }
    
    return baseSchema;
}

const optionalDateOrString = z.union([z.date(), z.string().refine(val => val === "Unsure", { message: "Invalid input" })]).optional();

const baseAssessmentFields = {
  companyName: z.string().optional(),
  workStatus: z.string({ required_error: 'Work status is required.'}).min(1),
  startDate: z.date({ required_error: 'Start date is required.' }),
  notificationDate: z.date({ required_error: 'Notification date is required.' }),
  finalDate: z.date({ required_error: 'Final employment date is required.' }),
  workState: z.string({ required_error: 'Work state is required.' }).min(1, 'Work state is required.'),
  relocationPaid: z.string({ required_error: 'This field is required.' }).min(1),
  unionMember: z.string({ required_error: 'This field is required.' }).min(1),
  workArrangement: z.string({ required_error: 'This field is required.' }).min(1),
  workVisaStatus: z.string().optional(), // Now optional by default, will be refined later
  onLeave: z.array(z.string()).min(1, "Please select at least one option."),
  accessSystems: z.array(z.string()).optional(),
  hadMedicalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadDentalInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadVisionInsurance: z.string({ required_error: 'This field is required.' }).min(1),
  hadEAP: z.string({ required_error: 'This field is required.' }).min(1),
  
  // Conditionally rendered fields are optional at base
  severanceAgreementDeadline: optionalDateOrString,
  relocationDate: optionalDateOrString,
  workArrangementOther: z.string().optional(),
  usedLeaveManagement: z.string().optional(),
  internalMessagingAccessEndDate: optionalDateOrString,
  emailAccessEndDate: optionalDateOrString,
  networkDriveAccessEndDate: optionalDateOrString,
  layoffPortalAccessEndDate: optionalDateOrString,
  hrPayrollSystemAccessEndDate: optionalDateOrString,
  medicalCoverage: z.string().optional(),
  medicalCoverageEndDate: optionalDateOrString,
  dentalCoverage: z.string().optional(),
  dentalCoverageEndDate: optionalDateOrString,
  visionCoverage: z.string().optional(),
  visionCoverageEndDate: optionalDateOrString,
  eapCoverageEndDate: optionalDateOrString,
};

export type AssessmentData = z.infer<z.ZodObject<typeof baseAssessmentFields>> & { citizenshipStatus?: string };

export function buildAssessmentSchema(activeQuestions: Question[], profileData: ProfileData | null) {
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

  // Find all questions with cross-form dependencies
  const dependencyMap = new Map<string, Question>();
  activeQuestions.forEach(q => {
    if (q.dependsOn) {
      dependencyMap.set(q.id, q);
    }
  });


  for (const key in baseAssessmentFields) {
    const fieldKey = key as keyof typeof baseAssessmentFields;
    
    if (activeIds.has(fieldKey)) {
        shape[fieldKey] = baseAssessmentFields[fieldKey];
    } else {
      // If a field is not active, make it optional so it doesn't cause validation errors.
       shape[fieldKey] = baseAssessmentFields[fieldKey]?.optional();
    }
  }

  let schema: any = z.object(shape).passthrough();

  const addRefinements = (questions: Question[]) => {
    questions.forEach(q => {
      
      // Handle cross-form dependencies (e.g., assessment question depends on profile question)
      if (q.dependsOn && q.dependencySource === 'profile' && profileData) {
        schema = schema.refine((data: any) => {
            const dependencyValue = profileData[q.dependsOn as keyof ProfileData];
            let isTriggered = false;
            if (Array.isArray(q.dependsOnValue)) {
                isTriggered = q.dependsOnValue.includes(dependencyValue as string);
            } else {
                isTriggered = dependencyValue === q.dependsOnValue;
            }

            if (!isTriggered) return true; // Not required if dependency not met

            const value = data[q.id];
            return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
        }, {
            message: `${q.label} is required.`,
            path: [q.id]
        });
      }


      // Handle intra-form sub-question dependencies
      if (q.subQuestions) {
        q.subQuestions.forEach(subQ => {
          if (!activeIds.has(subQ.id)) return;
          
          schema = schema.refine((data: any) => {
            const parentValue = data[q.id];
            
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

            if (!isTriggered) return true;
            
            const subValue = data[subQ.id];
            return subValue !== undefined && subValue !== null && subValue !== '' && (!Array.isArray(subValue) || subValue.length > 0);
          }, {
            message: `${subQ.label} is required.`,
            path: [subQ.id],
          });
        });
        
        addRefinements(q.subQuestions);
      }
    });
  };

  addRefinements(activeQuestions);

  return schema;
}
