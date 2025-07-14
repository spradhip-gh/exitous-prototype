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

export const CorrectTextInputSchema = z.string();
export type CorrectTextInput = z.infer<typeof CorrectTextInputSchema>;

export const CorrectTextOutputSchema = z.string();
export type CorrectTextOutput = z.infer<typeof CorrectTextOutputSchema>;

export async function correctText(
  input: CorrectTextInput
): Promise<CorrectTextOutput> {
  return spellCheckFlow(input);
}

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

const spellCheckFlow = ai.defineFlow(
  {
    name: 'spellCheckFlow',
    inputSchema: CorrectTextInputSchema,
    outputSchema: CorrectTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
