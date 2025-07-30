
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
import { addReviewQueueItem, getExternalResources } from '@/lib/demo-data';
import { stateUnemploymentLinks } from '@/lib/state-resources';
import { differenceInYears, parseISO } from 'date-fns';
import { tenureOptions } from '@/lib/guidance-helpers';
import type { GuidanceRule } from '@/hooks/use-user-data';

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

const PersonalizedRecommendationsInputSchema = z.object({
  userEmail: z.string().email(),
  companyName: z.string().optional(),
  profileData: ProfileDataSchema.describe('The user profile data.'),
  layoffDetails: LayoffDetailsSchema.describe("Details about the user's exit."),
});


export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const RecommendationItemSchema = z.object({
  taskId: z.string().describe("A unique, kebab-case identifier for the task (e.g., 'review-severance-agreement')."),
  task: z.string().describe('The specific, actionable task for the user to complete.'),
  category: z.string().describe('The category of the recommendation (e.g., "Healthcare", "Finances", "Career", "Legal", "Well-being").'),
  timeline: z.string().describe('A suggested timeframe or deadline for this task (e.g., "Action Required", "Upcoming Deadline", "Within 2 weeks").'),
  details: z.string().describe('Additional details or context for the recommendation. This should be formatted in Markdown.'),
  endDate: z.string().optional().describe("A specific deadline or key date for this task in 'YYYY-MM-DD' format, if applicable. Extract this from user-provided dates like coverage end dates."),
  isGoal: z.boolean().optional().describe("Set to true if this is a flexible goal (like 'Within 2 weeks'), false if it is a hard deadline."),
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

const prompt = ai.definePrompt({
    name: 'personalizedRecommendationsPrompt',
    input: { schema: PersonalizedRecommendationsInputSchema },
    output: { schema: PersonalizedRecommendationsOutputSchema },
    prompt: `You are a compassionate and expert panel of advisors consisting of a seasoned HR Executive, a career coach, a lawyer, and an expert in COBRA and other healthcare. Your primary goal is to provide a structured, empathetic, and actionable list of recommendations for an individual navigating a job exit.

Your task is to generate a comprehensive list of actionable recommendations based on ALL of the user's profile and layoff details. This must include time-sensitive legal and healthcare tasks, as well as crucial financial, career, and well-being steps.

**CRITICAL INSTRUCTIONS:**
1.  **Empathy and Accuracy First:** Always frame your advice with empathy and support. Acknowledge that this is a difficult time. Kindness and accuracy are paramount. Do not guess or provide unverified guidance. Your recommendations should be based only on the data provided.
2.  **Use Pre-defined Task IDs for Resources:** You have been provided with a list of external professional resources and their corresponding \`Related Task IDs\`. When you generate a recommendation that matches the purpose of a resource, you MUST use one of the exact \`taskId\`s from that resource's list. This is critical for connecting the user to the right professional. For example, if you advise reviewing a severance agreement, you MUST use the taskId \`review-severance-agreement\`.
3.  **Severance Agreement:** If a \`severanceAgreementDeadline\` is provided, you MUST create a recommendation with the taskId 'review-severance-agreement'. The task should be to "Review and sign your severance agreement" and the details MUST emphasize the importance of legal review before signing.
4.  **Consolidate Healthcare Deadlines:** Create a single, primary recommendation with the taskId 'explore-health-insurance' to cover all lost health benefits (medical, dental, vision).
    *   The details of this task MUST list out each specific coverage end date. For example: "Your medical coverage ends on YYYY-MM-DD, and your dental ends on YYYY-MM-DD. It is critical to explore new options like COBRA or ACA Marketplace plans before these dates to avoid a gap in coverage."
    *   The \`endDate\` for this consolidated task should be the EARLIEST of all the user's health-related coverage end dates.
5.  **Accurate Unemployment Timing**: The recommendation to apply for unemployment benefits is critical. You MUST check the user's \`finalDate\`. The recommendation's timeline MUST be for *after* this date. For example, if the final day is August 18th, suggest applying "On or after August 19th". Do not give a generic timeline like "Within 3 days" for this task if the final day is in the future.
6.  **Comprehensive Categories:** Provide a thorough and comprehensive set of recommendations across all relevant categories: Legal, Healthcare, Finances, Career, and Well-being. For example, include tasks like creating a budget, updating a resume, exploring COBRA, and networking. Do not limit the number of recommendations; be exhaustive and helpful.
7.  **Create a unique \`taskId\`**: For tasks that do not have a pre-defined ID from the resource list, create a new, unique, descriptive, kebab-case taskId (e.g., \`backup-work-files\`, \`check-pto-payout\`).
8.  **Set \`timeline\` and \`isGoal\`**:
    *   For hard deadlines provided by the user (like \`severanceAgreementDeadline\` or \`medicalCoverageEndDate\`), set the \`timeline\` to "Upcoming Deadline" or "Action Required", and set \`isGoal\` to \`false\`. The \`endDate\` field MUST be populated.
    *   For flexible recommendations (like "Update your resume"), use a timeline like "Within 1 week" or "Within 2 weeks", and set \`isGoal\` to \`true\`. Do not set an \`endDate\` for these.
9.  **Sort by Urgency**: The final list of all recommendations must be sorted chronologically by urgency, with the most critical and time-sensitive tasks first.
10. **Use ALL Key Dates:** For EVERY OTHER date provided in the user's exit details (e.g., \`finalDate\`, \`emailAccessEndDate\`), you MUST create a corresponding, relevant recommendation if it has not already been covered. Each of these recommendations MUST have its \`endDate\` field populated with the provided date.

**AVAILABLE RESOURCES (Use their Related Task IDs for your output):**
---
{{#each externalResources}}
Resource: {{this.name}} (ID: {{this.id}})
Description: {{this.description}}
Related Task IDs: {{#each this.relatedTaskIds}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
---
{{/each}}

**FULL USER PROFILE:**
- Birth Year: {{{profileData.birthYear}}}
- Gender: {{{profileData.gender}}}
- State of Residence: {{{profileData.state}}}
- Marital Status: {{{profileData.maritalStatus}}}
- Has Children Under 13: {{#if profileData.hasChildrenUnder13}}Yes{{else}}No{{/if}}
- Has Children Ages 18-26: {{#if profileData.hasChildrenAges18To26}}Yes{{else}}No{{/if}}
- Has Expected Children: {{#if profileData.hasExpectedChildren}}Yes{{else}}No{{/if}}
- Number of people impacted by income loss: {{{profileData.impactedPeopleCount}}}
- Living Status: {{{profileData.livingStatus}}}
- Citizenship/Visa Status: {{{profileData.citizenshipStatus}}}
- Recent Life Events: {{#each profileData.pastLifeEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**FULL EXIT DETAILS:**
- Employment Start Date: {{{layoffDetails.startDate}}}
- Work Status: {{{layoffDetails.workStatus}}}
- Notification Date: {{{layoffDetails.notificationDate}}}
- Final Day of Employment: {{{layoffDetails.finalDate}}}
- Severance Agreement Deadline: {{{layoffDetails.severanceAgreementDeadline}}}
- Work State: {{{layoffDetails.workState}}}
- Relocation Paid: {{{layoffDetails.relocationPaid}}}
- Relocation Date: {{{layoffDetails.relocationDate}}}
- Union Member: {{{layoffDetails.unionMember}}}
- Work Arrangement: {{{layoffDetails.workArrangement}}}
- Other Arrangement Details: {{{layoffDetails.workArrangementOther}}}
- Work Visa: {{{layoffDetails.workVisa}}}
- On Leave: {{#each layoffDetails.onLeave}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Used Leave Management System: {{{layoffDetails.usedLeaveManagement}}}
- Systems Still Accessible: {{#each layoffDetails.accessSystems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Messaging Access Ends: {{{layoffDetails.internalMessagingAccessEndDate}}}
  - Email Access Ends: {{{layoffDetails.emailAccessEndDate}}}
  - Drive Access Ends: {{{layoffDetails.networkDriveAccessEndDate}}}
  - Portal Access Ends: {{{layoffDetails.layoffPortalAccessEndDate}}}
  - HR/Payroll Access Ends: {{{layoffDetails.hrPayrollSystemAccessEndDate}}}
- Had Medical Insurance: {{{layoffDetails.hadMedicalInsurance}}}
  - Medical Coverage: {{{layoffDetails.medicalCoverage}}}
  - Medical Coverage End Date: {{{layoffDetails.medicalCoverageEndDate}}}
- Had Dental Insurance: {{{layoffDetails.hadDentalInsurance}}}
  - Dental Coverage: {{{layoffDetails.dentalCoverage}}}
  - Dental Coverage End Date: {{{layoffDetails.dentalCoverageEndDate}}}
- Had Vision Insurance: {{{layoffDetails.hadVisionInsurance}}}
  - Vision Coverage: {{{layoffDetails.visionCoverage}}}
  - Vision Coverage End Date: {{{layoffDetails.visionCoverageEndDate}}}
- Had EAP: {{{layoffDetails.hadEAP}}}
  - EAP Coverage End Date: {{{layoffDetails.eapCoverageEndDate}}}
`,
});

export async function getPersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input, streamingCallback) => {
    
    // In a real app, this might come from a different source, but for the prototype,
    // we fetch it from the same demo-data store.
    const externalResources = getExternalResources();
    
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const { output } = await prompt({
            ...input,
            externalResources,
        });
        
        // Add the result to the review queue
        if (output) {
            addReviewQueueItem({
                id: `review-${input.userEmail}-${Date.now()}`,
                userEmail: input.userEmail,
                inputData: { profileData: input.profileData, layoffDetails: input.layoffDetails, companyName: input.companyName },
                output: output,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
        }

        return output!;
      } catch (error: any) {
        attempt++;
        const errorMessage = String(error?.cause || error?.message || '');
        const isOverloaded = errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded');
        
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
