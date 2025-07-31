
'use server';

/**
 * @fileOverview An AI agent for reviewing and improving text content.
 *
 * - reviewContent - A function that takes text and suggests improvements for tone, empathy, and grammar.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function reviewContent(text: string): Promise<string> {
    return reviewContentFlow(text);
}

const reviewContentFlow = ai.defineFlow(
  {
    name: 'reviewContentFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (text) => {
    
    const prompt = `You are a compassionate and expert panel of advisors consisting of a seasoned HR Executive, a career coach, and a lawyer. Your primary goal is to review and refine the following text, which will be shown to an individual navigating a difficult job exit.

Your task is to edit the text with three core goals in mind:
1.  **Correct Spelling and Grammar:** Meticulously fix any and all spelling mistakes or grammatical errors to ensure the text is professional and clear.
2.  **Enhance for Empathy and Kindness:** Adjust the tone to be exceptionally supportive, empathetic, and kind. The user is in a vulnerable state, and the language must be gentle and encouraging. Avoid corporate jargon or overly blunt phrasing.
3.  **Preserve Core Facts:** It is absolutely critical that you DO NOT change the core meaning, facts, or instructions of the text. The fundamental information must remain the same. Your role is to improve the delivery, not alter the message.

Return only the revised text, ready to be shown to the user.

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

    return output || text;
  }
);

