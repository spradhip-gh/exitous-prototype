
'use server';

/**
 * @fileOverview An AI agent for reviewing and improving text content.
 *
 * - reviewContent - A function that takes text and suggests improvements for tone, empathy, and grammar.
 * - ContentReviewInputSchema - The input type for the reviewContent function.
 * - ContentReviewOutputSchema - The return type for the reviewContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ContentReviewInputSchema = z.string();

export const ContentReviewOutputSchema = z.string();

export async function reviewContent(text: string): Promise<string> {
    return reviewContentFlow(text);
}

const reviewContentFlow = ai.defineFlow(
  {
    name: 'reviewContentFlow',
    inputSchema: ContentReviewInputSchema,
    outputSchema: ContentReviewOutputSchema,
  },
  async (text) => {
    
    const prompt = `You are an expert editor specializing in compassionate and clear communication. Your task is to review the following text.

    Your goals are:
    1.  **Correct Spelling and Grammar:** Fix any spelling mistakes or grammatical errors.
    2.  **Improve Tone:** Adjust the tone to be more empathetic, supportive, and kind. The user is likely going through a difficult time.
    3.  **Preserve Facts:** DO NOT change the core meaning, facts, or instructions of the text. The fundamental information must remain the same.

    Return only the revised text.

    Original Text:
    ---
    {{{text}}}
    ---
    `;

    const { output } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      context: { text },
    });

    return output() || text;
  }
);
