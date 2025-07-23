

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
import { addReviewQueueItem } from '@/lib/demo-data';

const ProfileDataSchema = z.object({
  birthYear: z.number().describe("The user's birth year."),
  state: z.string().describe('The state the user lives in.'),
  gender: z.string().describe('The gender the user identifies with.'),
  maritalStatus: z.string().describe("The user's marital status."),
  hasChildrenUnder13: z.boolean().describe('Whether the user has children under 13.'),
  hasExpectedChildren: z.boolean().describe('Whether the user has expected children.'),
  impactedPeopleCount: z
    .string()
    .describe(
      'The number of other adults or children moderately or greatly impacted by income loss.'
    ),
  livingStatus: z.string().describe("The user's living status."),
  citizenshipStatus: z.string().describe("The user's citizenship or residence status."),
  pastLifeEvents: z.array(z.string()).describe('Life events experienced in the past 9 months.'),
  hasChildrenAges18To26: z.boolean().describe('Whether the user has children ages 18-26.'),
});

const LayoffDetailsSchema = z.object({
  workStatus: z.string().optional().describe("The user's work status."),
  startDate: z.string().optional().describe("The user's start date (ISO string)."),
  notificationDate: z.string().optional().describe('The date the user was notified of layoff (ISO string).'),
  finalDate: z.string().optional().describe("The user's final date of employment (ISO string)."),
  severanceAgreementDeadline: z.string().optional().describe('The deadline to sign the severance agreement (ISO string).'),
  workState: z.string().optional().describe('The state where the user\'s work was based.'),
  relocationPaid: z.string().optional().describe('If the company paid for relocation.'),
  relocationDate: z.string().optional().describe('Date of relocation (ISO string).'),
  unionMember: z.string().optional().describe('If the user was a union member.'),
  workArrangement: z.string().optional().describe('The user\'s work arrangement (remote, hybrid, etc.).'),
  workArrangementOther: z.string().optional().describe('Details if work arrangement was "Other".'),
  workVisa: z.string().optional().describe("The user's work visa status."),
  onLeave: z.array(z.string()).optional().describe('Types of leave the user was on.'),
  usedLeaveManagement: z.string().optional().describe('If the user was using a leave management system.'),
  accessSystems: z.array(z.string()).optional().describe('Internal systems the user still has access to.'),
  internalMessagingAccessEndDate: z.string().optional().describe('End date for messaging access (ISO string).'),
  emailAccessEndDate: z.string().optional().describe('End date for email access (ISO string).'),
  networkDriveAccessEndDate: z.string().optional().describe('End date for network drive access (ISO string).'),
  layoffPortalAccessEndDate: z.string().optional().describe('End date for layoff portal access (ISO string).'),
  hrPayrollSystemAccessEndDate: z.string().optional().describe('End date for HR/payroll system access (ISO string).'),
  hadMedicalInsurance: z.string().optional().describe('If the user had medical insurance.'),
  medicalCoverage: z.string().optional().describe('Who was covered by medical insurance.'),
  medicalCoverageEndDate: z.string().optional().describe('End date for medical coverage (ISO string).'),
  hadDentalInsurance: z.string().optional().describe('If the user had dental insurance.'),
  dentalCoverage: z.string().optional().describe('Who was covered by dental insurance.'),
  dentalCoverageEndDate: z.string().optional().describe('End date for dental coverage (ISO string).'),
  hadVisionInsurance: z.string().optional().describe('If the user had vision insurance.'),
  visionCoverage: z.string().optional().describe('Who was covered by vision insurance.'),
  visionCoverageEndDate: z.string().optional().describe('End date for vision coverage (ISO string).'),
  hadEAP: z.string().optional().describe('If the user had EAP access.'),
  eapCoverageEndDate: z.string().optional().describe('End date for EAP access (ISO string).'),
});

const AdminGuidanceSchema = z.object({
  text: z.string().describe('The pre-written guidance text from an admin or consultant.'),
  category: z.string().describe('The category of the guidance.'),
  linkedResourceId: z.string().optional().describe("An ID of an external resource that is linked to this guidance."),
});

const PersonalizedRecommendationsInputSchema = z.object({
  userEmail: z.string().email(),
  profileData: ProfileDataSchema.describe('The user profile data.'),
  layoffDetails: LayoffDetailsSchema.describe("Details about the user's exit."),
  adminGuidance: z.array(AdminGuidanceSchema).optional().describe('Pre-defined guidance from an admin based on user answers. This should be prioritized.'),
});


export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const RecommendationItemSchema = z.object({
  taskId: z.string().describe("A unique, kebab-case identifier for the task (e.g., 'review-severance-agreement')."),
  task: z.string().describe('The specific, actionable task for the user to complete.'),
  category: z.string().describe('The category of the recommendation (e.g., "Healthcare", "Finances", "Career", "Legal", "Well-being").'),
  timeline: z.string().describe('A suggested timeframe or deadline for this task (e.g., "Immediately", "Within 1 week", "By [specific date based on user input]").'),
  details: z.string().describe('Additional details or context for the recommendation. This should be formatted in Markdown.'),
  endDate: z.string().optional().describe("A specific deadline or key date for this task in 'YYYY-MM-DD' format, if applicable. Extract this from user-provided dates like coverage end dates."),
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
  prompt: `You are an expert career counselor and legal advisor specializing in employment exits. Based on the user's profile and detailed exit circumstances, provide a structured list of actionable and personalized recommendations. These should be formatted as a timeline of next steps.

{{#if adminGuidance}}
**IMPORTANT: Start with the Admin-Provided Guidance.** A human expert has provided the following critical advice. This guidance takes precedence.
Your task is to:
1.  Use the provided guidance text and category to create a recommendation. Generate a clear, actionable 'task' for it (e.g., "Review your unemployment eligibility").
2.  If you have relevant state-specific information (e.g., the name of the state's unemployment office like the "EDD" for California), **merge it into the details of the existing admin guidance**.
3.  **DO NOT** create a separate, duplicate recommendation on the same topic. For example, if admin guidance about unemployment is provided, do not create a second task about unemployment. Enhance the existing one.
---
{{#each adminGuidance}}
Expert Guidance: {{{this.text}}}
Category: {{{this.category}}}
{{#if this.linkedResourceId}}
Linked Resource ID: {{{this.linkedResourceId}}}
Task ID to generate: consultant-guidance-{{{this.linkedResourceId}}}
{{/if}}
---
{{/each}}
{{/if}}

Focus on critical deadlines, financial advice, healthcare options, and job search strategies tailored to their specific situation.

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

Here are the user's exit details:
{{#if layoffDetails.workStatus}}- Work Status: {{{layoffDetails.workStatus}}}{{/if}}
{{#if layoffDetails.startDate}}- Employment Start Date: {{{layoffDetails.startDate}}}{{/if}}
{{#if layoffDetails.notificationDate}}- Exit Notification Date: {{{layoffDetails.notificationDate}}}{{/if}}
{{#if layoffDetails.finalDate}}- Final Day of Employment: {{{layoffDetails.finalDate}}}{{/if}}
{{#if layoffDetails.severanceAgreementDeadline}}- Deadline to Sign Severance: {{{layoffDetails.severanceAgreementDeadline}}}{{/if}}
{{#if layoffDetails.workState}}- Work Location State: {{{layoffDetails.workState}}}{{/if}}
{{#if layoffDetails.relocationPaid}}- Relocation Paid by Company: {{{layoffDetails.relocationPaid}}}{{/if}}
{{#if layoffDetails.relocationDate}}- Relocation Date: {{{layoffDetails.relocationDate}}}{{/if}}
{{#if layoffDetails.unionMember}}- Union Member: {{{layoffDetails.unionMember}}}{{/if}}
{{#if layoffDetails.workArrangement}}- Work Arrangement: {{{layoffDetails.workArrangement}}}{{/if}}
{{#if layoffDetails.workArrangementOther}}- Other Arrangement Details: {{{layoffDetails.workArrangementOther}}}{{/if}}
{{#if layoffDetails.workVisa}}- Work Visa: {{{layoffDetails.workVisa}}}{{/if}}
{{#if layoffDetails.onLeave}}- On Leave During Exit: {{#each layoffDetails.onLeave}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if layoffDetails.usedLeaveManagement}}- Used Leave Management System: {{{layoffDetails.usedLeaveManagement}}}{{/if}}
{{#if layoffDetails.accessSystems}}- Systems Still Accessible: {{#each layoffDetails.accessSystems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if layoffDetails.emailAccessEndDate}}- Email Access Ends: {{{layoffDetails.emailAccessEndDate}}}{{/if}}
{{#if layoffDetails.hadMedicalInsurance}}- Had Medical Insurance: {{{layoffDetails.hadMedicalInsurance}}}{{/if}}
{{#if layoffDetails.medicalCoverageEndDate}}- Medical Coverage Ends: {{{layoffDetails.medicalCoverageEndDate}}}{{/if}}
{{#if layoffDetails.hadDentalInsurance}}- Had Dental Insurance: {{{layoffDetails.hadDentalInsurance}}}{{/if}}
{{#if layoffDetails.dentalCoverageEndDate}}- Dental Coverage Ends: {{{layoffDetails.dentalCoverageEndDate}}}{{/if}}
{{#if layoffDetails.hadVisionInsurance}}- Had Vision Insurance: {{{layoffDetails.hadVisionInsurance}}}{{/if}}
{{#if layoffDetails.visionCoverageEndDate}}- Vision Coverage Ends: {{{layoffDetails.visionCoverageEndDate}}}{{/if}}
{{#if layoffDetails.hadEAP}}- Had EAP: {{{layoffDetails.hadEAP}}}{{/if}}
{{#if layoffDetails.eapCoverageEndDate}}- EAP Coverage Ends: {{{layoffDetails.eapCoverageEndDate}}}{{/if}}

Based on all this information, generate a structured list of critical, time-sensitive recommendations. The list must be sorted chronologically, with the most urgent and time-sensitive tasks appearing first. For each recommendation, provide:
1.  A unique 'taskId' in kebab-case (e.g., 'apply-for-unemployment', 'confirm-cobra-details'). For admin guidance with a linked resource, use the specific task ID format 'consultant-guidance-[resourceId]'.
2.  A specific 'task' for the user to complete.
3.  A 'category' (e.g., "Healthcare", "Finances", "Career", "Legal", "Well-being").
4.  A suggested 'timeline' for action (e.g., "Immediately", "Within 1 week").
5.  Important 'details' or context, formatted in Markdown.
6.  If the task has a specific, hard deadline based on the user's input (like an insurance coverage end date or final day of employment), extract that date and place it in the 'endDate' field in 'YYYY-MM-DD' format. Otherwise, leave 'endDate' empty.
7.  **IMPORTANT**: If the user is on a work visa (the 'workVisa' field is not "None of the above"), you MUST create a recommendation with the 'taskId' 'handle-work-visa-implications' to advise them to consult an immigration attorney.
`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input, streamingCallback) => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const {output} = await prompt(input);
        
        // Add the result to the review queue
        if (output) {
            addReviewQueueItem({
                id: `review-${input.userEmail}-${Date.now()}`,
                userEmail: input.userEmail,
                inputData: { profileData: input.profileData, layoffDetails: input.layoffDetails, adminGuidance: input.adminGuidance },
                output: output,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
        }

        return output!;
      } catch (error: any) {
        attempt++;
        const isOverloaded = error.message && (error.message.includes('503') || error.message.includes('overloaded'));
        
        if (isOverloaded && attempt < maxRetries) {
          console.warn(`Attempt ${attempt} failed with 503 error. Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.error(`Flow failed after ${attempt} attempts.`, error);
            throw error; // Re-throw the error if it's not a 503 or if max retries are reached
        }
      }
    }
    // This should not be reached, but is a failsafe.
    throw new Error('Failed to generate recommendations after multiple retries.');
  }
);


    
