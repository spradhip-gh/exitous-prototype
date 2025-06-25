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
    emotionalState: z.string().min(1, 'Please select an option that best describes your feelings.')
});

export type AssessmentData = z.infer<typeof assessmentSchema>;
