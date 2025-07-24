
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
import { addReviewQueueItem, getCompanyConfigs } from '@/lib/demo-data';
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

export async function getPersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  context: {
    stateUnemploymentLinks: stateUnemploymentLinks
  },
  prompt: `You are an expert career counselor and legal advisor specializing in employment exits. Your primary goal is to provide a structured list of actionable and personalized recommendations.

Your task is to generate a comprehensive list of actionable recommendations based on the user's profile and layoff details. This should include not only time-sensitive legal and healthcare tasks, but also important financial, career, and well-being steps.

**CRITICAL INSTRUCTIONS:**
1.  **Severance Agreement:** If a \`severanceAgreementDeadline\` is provided, you MUST create a recommendation with the taskId 'review-severance-agreement'. The task should be to "Review and sign your severance agreement" and the details should mention the importance of legal review before signing.
2.  **Use ALL Key Dates:** For every date provided in the user's exit details (e.g., \`finalDate\`, \`medicalCoverageEndDate\`, \`severanceAgreementDeadline\`), create a corresponding, relevant recommendation. Each of these recommendations MUST have its \`endDate\` field populated with the provided date.
3.  **Comprehensive Categories:** Provide recommendations across multiple categories where relevant: Legal, Healthcare, Finances, Career, and Well-being. For example, include tasks like creating a budget, updating a resume, or applying for unemployment.
4.  **Create a unique \`taskId\`**: For each new recommendation you generate, create a unique, descriptive, kebab-case taskId (e.g., \`review-severance-agreement\`, \`explore-health-insurance-options\`).
5.  **Analyze User Data**: Pay close attention to all critical dates, insurance status, and visa status.
6.  **Set \`timeline\` and \`isGoal\`**:
    *   For hard deadlines provided by the user (like \`severanceAgreementDeadline\` or \`medicalCoverageEndDate\`), set the \`timeline\` to "Upcoming Deadline" or "Action Required", and set \`isGoal\` to \`false\`. The \`endDate\` field MUST be populated.
    *   For flexible recommendations (like "Update your resume"), use a timeline like "Within 1 week" or "Within 2 weeks", and set \`isGoal\` to \`true\`. Do not set an \`endDate\` for these.
7.  **Sort by Urgency**: The final list of all recommendations must be sorted chronologically by urgency, with the most critical and time-sensitive tasks first.

**User Profile:**
- State of Residence: {{{profileData.state}}}
- Marital Status: {{{profileData.maritalStatus}}}
- Dependents: {{#if profileData.hasChildrenUnder13}}Has children under 13{{/if}}
- Citizenship/Visa Status: {{{profileData.citizenshipStatus}}} / {{{layoffDetails.workVisa}}}
- Employment Start Date: {{{layoffDetails.startDate}}}

**Key Dates & Details:**
- Final Day of Employment: {{{layoffDetails.finalDate}}}
- Severance Deadline: {{{layoffDetails.severanceAgreementDeadline}}}
- Lost Medical Insurance: {{{layoffDetails.hadMedicalInsurance}}} (Coverage ends: {{{layoffDetails.medicalCoverageEndDate}}})
- Lost Dental Insurance: {{{layoffDetails.hadDentalInsurance}}} (Coverage ends: {{{layoffDetails.dentalCoverageEndDate}}})
- Lost Vision Insurance: {{{layoffDetails.hadVisionInsurance}}} (Coverage ends: {{{layoffDetails.visionCoverageEndDate}}})
- Union Member: {{{layoffDetails.unionMember}}}
- On Leave: {{{layoffDetails.onLeave}}}

**Context Data:**
- State Unemployment Links: {{stateUnemploymentLinks}}
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
                inputData: { profileData: input.profileData, layoffDetails: input.layoffDetails, companyName: input.companyName },
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

