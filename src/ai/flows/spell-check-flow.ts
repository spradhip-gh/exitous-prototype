'use server';

/**
 * @fileOverview A simple text correction AI flow.
 *
 * - correctText - A function that corrects spelling and grammar in a given text string.
 * - CorrectTextInput - The input type for the correctText function.
 * - CorrectTextOutput - The return type for the correctText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export type CorrectTextInput = string;
export type CorrectTextOutput = string;

export async function correctText(
  input: CorrectTextInput
): Promise<CorrectTextOutput> {
  // Define schemas inside the function to avoid exporting them from a 'use server' file.
  const CorrectTextInputSchema = z.string();
  const CorrectTextOutputSchema = z.string();

  const spellCheckFlow = ai.defineFlow(
    {
      name: 'spellCheckFlow',
      inputSchema: CorrectTextInputSchema,
      outputSchema: CorrectTextOutputSchema,
    },
    async (flowInput) => {
      const prompt = ai.definePrompt({
          name: 'spellCheckPrompt',
          input: {schema: CorrectTextInputSchema},
          output: {schema: CorrectTextOutputSchema},
          prompt: `You are a helpful writing assistant. Correct any spelling and grammar mistakes in the following text.
Do not add any preamble or explanation. Only return the corrected text.

Text to correct:
"{{prompt}}"
`,
      });

      const {output} = await prompt(flowInput);
      return output!;
    }
  );

  return spellCheckFlow(input);
}
