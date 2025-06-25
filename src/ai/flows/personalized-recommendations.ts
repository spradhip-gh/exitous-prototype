'use server';

/**
 * @fileOverview A personalized recommendations AI agent.
 *
 * - getPersonalizedRecommendations - A function that generates personalized recommendations based on user profile and assessment data.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
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

const AssessmentDataSchema = z.object({
  emotionalState: z.string().describe('The user\'s emotional state from the assessment.'),
});

const PersonalizedRecommendationsInputSchema = z.object({
  profileData: ProfileDataSchema.describe('The user profile data.'),
  assessmentData: AssessmentDataSchema.describe('The user assessment data.'),
});

export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('Personalized recommendations for resources, support networks, and career advice.'),
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
  prompt: `Based on the user's profile and emotional assessment, provide personalized recommendations for resources, support networks, and career advice. The recommendations should be tailored to their specific situation and needs.\n\nHere is the user's profile data:\nBirth Year: {{{profileData.birthYear}}}\nState: {{{profileData.state}}}\nGender: {{{profileData.gender}}}\nMarital Status: {{{profileData.maritalStatus}}}\nHas Children Under 13: {{{profileData.hasChildrenUnder13}}}\nHas Expected Children: {{{profileData.hasExpectedChildren}}}\nImpacted People Count: {{{profileData.impactedPeopleCount}}}\nLiving Status: {{{profileData.livingStatus}}}\nCitizenship Status: {{{profileData.citizenshipStatus}}}\nPast Life Events: {{#each profileData.pastLifeEvents}}{{{this}}}, {{/each}}\nHas Children Ages 18 to 26: {{{profileData.hasChildrenAges18To26}}}\n\nHere is the user's assessment data:\nEmotional State: {{{assessmentData.emotionalState}}}\n\nRecommendations:`,
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
