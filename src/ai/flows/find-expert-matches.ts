'use server';

/**
 * @fileOverview An AI agent for finding expert matches for users.
 *
 * - findExpertMatches - A function that finds the best external resources for a user based on their profile.
 * - ExpertMatchInput - The input type for the findExpertMatches function.
 * - ExpertMatchOutput - The return type for the findExpertMatches function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { externalResources, type ExternalResource } from '@/lib/external-resources';

const ProfileDataSchema = z.object({
  birthYear: z.number().optional(),
  state: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  hasChildrenUnder13: z.boolean().optional(),
  hasExpectedChildren: z.boolean().optional(),
  impactedPeopleCount: z.string().optional(),
  livingStatus: z.string().optional(),
  citizenshipStatus: z.string().optional(),
  pastLifeEvents: z.array(z.string()).optional(),
  hasChildrenAges18To26: z.boolean().optional(),
});

const LayoffDetailsSchema = z.object({
  workStatus: z.string().optional(),
  startDate: z.string().optional(),
  notificationDate: z.string().optional(),
  finalDate: z.string().optional(),
  severanceAgreementDeadline: z.string().optional(),
  workState: z.string().optional(),
  relocationPaid: z.string().optional(),
  relocationDate: z.string().optional(),
  unionMember: z.string().optional(),
  workArrangement: z.string().optional(),
  workVisa: z.string().optional(),
  onLeave: z.array(z.string()).optional(),
  hadMedicalInsurance: z.string().optional(),
  hadDentalInsurance: z.string().optional(),
  hadVisionInsurance: z.string().optional(),
});

export const ExpertMatchInputSchema = z.object({
  profileData: ProfileDataSchema.describe('The user profile data.'),
  layoffDetails: LayoffDetailsSchema.describe("Details about the user's exit."),
});
export type ExpertMatchInput = z.infer<typeof ExpertMatchInputSchema>;

const MatchSchema = z.object({
    resourceId: z.string().describe("The unique ID of the matched external resource."),
    reason: z.string().describe("A brief, user-facing explanation for why this resource is a good match."),
});

export const ExpertMatchOutputSchema = z.object({
    matches: z.array(MatchSchema).describe('A list of the top 3-4 most relevant external resources for the user.'),
});
export type ExpertMatchOutput = z.infer<typeof ExpertMatchOutputSchema>;

export async function findExpertMatches(input: ExpertMatchInput): Promise<ExpertMatchOutput> {
  return findExpertMatchesFlow(input);
}

const findExpertMatchesFlow = ai.defineFlow(
  {
    name: 'findExpertMatchesFlow',
    inputSchema: ExpertMatchInputSchema,
    outputSchema: ExpertMatchOutputSchema,
  },
  async (input) => {
    // In a real app, this could be a more sophisticated search/retrieval step.
    // For the prototype, we pass the full list to the model.
    const allResources = externalResources;

    const prompt = `You are an expert career and life transition counselor. Your task is to analyze a user's profile and layoff details to identify their most pressing needs. Then, you will match them with the most relevant external resources from the provided list.

Analyze the user's data to understand their key challenges. Are they on a work visa? Did they lose health insurance? Are they struggling with the emotional impact? Do they need to review a legal document?

Based on your analysis, select the top 3-4 most critical resources from the list below that would provide the most immediate help to this user. For each match, provide the resource's ID and a short, empathetic reason for the recommendation.

USER PROFILE:
- State of Residence: {{{profileData.state}}}
- Marital Status: {{{profileData.maritalStatus}}}
- Dependents: {{#if profileData.hasChildrenUnder13}}Has children under 13{{/if}}
- Citizenship/Visa Status: {{{profileData.citizenshipStatus}}} / {{{layoffDetails.workVisa}}}
- Recent Life Events: {{#each profileData.pastLifeEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

EXIT DETAILS:
- Severance Deadline: {{{layoffDetails.severanceAgreementDeadline}}}
- Lost Medical Insurance: {{{layoffDetails.hadMedicalInsurance}}}
- Union Member: {{{layoffDetails.unionMember}}}
- On Leave: {{{layoffDetails.onLeave}}}

AVAILABLE RESOURCES:
---
{{#each resources}}
ID: {{{this.id}}}
Name: {{{this.name}}}
Description: {{{this.description}}}
Keywords: {{#each this.keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
---
{{/each}}
`;

    const { output } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: ExpertMatchOutputSchema
      },
      context: {
        resources: allResources,
        profileData: input.profileData,
        layoffDetails: input.layoffDetails,
      },
    });

    return output!;
  }
);
