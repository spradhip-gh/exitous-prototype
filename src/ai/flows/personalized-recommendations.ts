'use server';

/**
 * @fileOverview A personalized recommendations AI agent.
 *
 * - getPersonalizedRecommendations - A function that generates personalized recommendations based on user profile and assessment data.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 * - RecommendationItem - The type for a single recommendation item.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfileDataSchema = z.object({
  birthYear: z.number().describe('The user\'s birth year.'),
  state: z.string().describe('The state the user lives in.'),
  gender: z.string().describe('The gender the user identifies with.'),
  maritalStatus: z.string().describe('The user\'s marital status.'),
  hasChildrenUnder13: z.boolean().describe('Whether the user has children under 13.'),
  hasExpectedChildren: z.boolean().describe('Whether the user has expected children.'),
  impactedPeopleCount: z
    .string()
    .describe(
      'The number of other adults or children moderately or greatly impacted by income loss.'
    ),
  livingStatus: z.string().describe('The user\'s living status.'),
  citizenshipStatus: z.string().describe('The user\'s citizenship or residence status.'),
  pastLifeEvents: z.array(z.string()).describe('Life events experienced in the past 9 months.'),
  hasChildrenAges18To26: z.boolean().describe('Whether the user has children ages 18-26.'),
});

const LayoffDetailsSchema = z.object({
  workStatus: z.string().describe('The user\'s work status.'),
  startDate: z.string().describe('The user\'s start date (ISO string).'),
  notificationDate: z.string().describe('The date the user was notified of layoff (ISO string).'),
  finalDate: z.string().describe('The user\'s final date of employment (ISO string).'),
  workState: z.string().describe('The state where the user\'s work was based.'),
  relocationPaid: z.string().describe('If the company paid for relocation.'),
  relocationDate: z.string().optional().describe('Date of relocation (ISO string).'),
  unionMember: z.string().describe('If the user was a union member.'),
  workArrangement: z.string().describe('The user\'s work arrangement (remote, hybrid, etc.).'),
  workArrangementOther: z.string().optional().describe('Details if work arrangement was "Other".'),
  workVisa: z.string().describe('The user\'s work visa status.'),
  onLeave: z.array(z.string()).describe('Types of leave the user was on.'),
  usedLeaveManagement: z.string().optional().describe('If the user was using a leave management system.'),
  accessSystems: z.array(z.string()).optional().describe('Internal systems the user still has access to.'),
  internalMessagingAccessEndDate: z.string().optional().describe('End date for messaging access (ISO string).'),
  emailAccessEndDate: z.string().optional().describe('End date for email access (ISO string).'),
  networkDriveAccessEndDate: z.string().optional().describe('End date for network drive access (ISO string).'),
  layoffPortalAccessEndDate: z.string().optional().describe('End date for layoff portal access (ISO string).'),
  hrPayrollSystemAccessEndDate: z.string().optional().describe('End date for HR/payroll system access (ISO string).'),
  hadMedicalInsurance: z.string().describe('If the user had medical insurance.'),
  medicalCoverage: z.string().optional().describe('Who was covered by medical insurance.'),
  medicalCoverageEndDate: z.string().optional().describe('End date for medical coverage (ISO string).'),
  hadDentalInsurance: z.string().describe('If the user had dental insurance.'),
  dentalCoverage: z.string().optional().describe('Who was covered by dental insurance.'),
  dentalCoverageEndDate: z.string().optional().describe('End date for dental coverage (ISO string).'),
  hadVisionInsurance: z.string().describe('If the user had vision insurance.'),
  visionCoverage: z.string().optional().describe('Who was covered by vision insurance.'),
  visionCoverageEndDate: z.string().optional().describe('End date for vision coverage (ISO string).'),
  hadEAP: z.string().describe('If the user had EAP access.'),
  eapCoverageEndDate: z.string().optional().describe('End date for EAP access (ISO string).'),
});


const PersonalizedRecommendationsInputSchema = z.object({
  profileData: ProfileDataSchema.describe('The user profile data.'),
  layoffDetails: LayoffDetailsSchema.describe('Details about the user\'s layoff.'),
});

export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const RecommendationItemSchema = z.object({
  task: z.string().describe('The specific, actionable task for the user to complete.'),
  category: z.string().describe('The category of the recommendation (e.g., "Healthcare", "Finances", "Job Search", "Legal", "Well-being").'),
  timeline: z.string().describe('A suggested timeframe or deadline for this task (e.g., "Immediately", "Within 1 week", "By [specific date based on user input]").'),
  details: z.string().describe('Additional details or context for the recommendation.'),
});

export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(RecommendationItemSchema)
    .describe('A structured list of personalized recommendations. Each recommendation should have a task, category, timeline, and details.'),
});


export type PersonalizedRecommendationsOutput = z.infer<
  typeof PersonalizedRecommendationsOutputSchema
>;

export async function getPersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are an expert career counselor and legal advisor specializing in layoffs. Based on the user's profile and detailed layoff circumstances, provide a structured list of actionable and personalized recommendations. These should be formatted as a timeline of next steps. Focus on critical deadlines, financial advice, healthcare options, and job search strategies tailored to their specific situation.

Here is the user's profile data:
- Birth Year: {{{profileData.birthYear}}}
- State of Residence: {{{profileData.state}}}
- Gender: {{{profileData.gender}}}
- Marital Status: {{{profileData.maritalStatus}}}
- Has Children Under 13: {{{profileData.hasChildrenUnder13}}}
- Has Expected Children: {{{profileData.hasExpectedChildren}}}
- People Impacted by Layoff: {{{profileData.impactedPeopleCount}}}
- Living Status: {{{profileData.livingStatus}}}
- Citizenship Status: {{{profileData.citizenshipStatus}}}
- Recent Major Life Events: {{#each profileData.pastLifeEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Has Children Ages 18-26: {{{profileData.hasChildrenAges18To26}}}

Here are the user's layoff details:
- Work Status: {{{layoffDetails.workStatus}}}
- Employment Start Date: {{{layoffDetails.startDate}}}
- Layoff Notification Date: {{{layoffDetails.notificationDate}}}
- Final Day of Employment: {{{layoffDetails.finalDate}}}
- Work Location State: {{{layoffDetails.workState}}}
- Relocation Paid by Company: {{{layoffDetails.relocationPaid}}}
{{#if layoffDetails.relocationDate}}- Relocation Date: {{{layoffDetails.relocationDate}}}{{/if}}
- Union Member: {{{layoffDetails.unionMember}}}
- Work Arrangement: {{{layoffDetails.workArrangement}}}
{{#if layoffDetails.workArrangementOther}}- Other Arrangement Details: {{{layoffDetails.workArrangementOther}}}{{/if}}
- Work Visa: {{{layoffDetails.workVisa}}}
- On Leave During Layoff: {{#each layoffDetails.onLeave}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if layoffDetails.usedLeaveManagement}}- Used Leave Management System: {{{layoffDetails.usedLeaveManagement}}}{{/if}}
- Systems Still Accessible: {{#each layoffDetails.accessSystems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if layoffDetails.emailAccessEndDate}}- Email Access Ends: {{{layoffDetails.emailAccessEndDate}}}{{/if}}
- Had Medical Insurance: {{{layoffDetails.hadMedicalInsurance}}}
{{#if layoffDetails.medicalCoverageEndDate}}- Medical Coverage Ends: {{{layoffDetails.medicalCoverageEndDate}}}{{/if}}
- Had Dental Insurance: {{{layoffDetails.hadDentalInsurance}}}
{{#if layoffDetails.dentalCoverageEndDate}}- Dental Coverage Ends: {{{layoffDetails.dentalCoverageEndDate}}}{{/if}}
- Had Vision Insurance: {{{layoffDetails.hadVisionInsurance}}}
{{#if layoffDetails.visionCoverageEndDate}}- Vision Coverage Ends: {{{layoffDetails.visionCoverageEndDate}}}{{/if}}
- Had EAP: {{{layoffDetails.hadEAP}}}
{{#if layoffDetails.eapCoverageEndDate}}- EAP Coverage Ends: {{{layoffDetails.eapCoverageEndDate}}}{{/if}}

Based on all this information, generate a structured list of critical, time-sensitive recommendations. For each recommendation, provide a specific task, a category (e.g., "Healthcare", "Finances", "Job Search", "Legal", "Well-being"), a suggested timeline for action (e.g., "Immediately", "Within 1 week", "By [specific date]"), and any important details or context.
`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
