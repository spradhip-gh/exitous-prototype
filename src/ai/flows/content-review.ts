
'use server';

/**
 * @fileOverview An AI agent for reviewing and improving text content.
 *
 * - reviewContent - A function that takes text and suggests improvements for tone, empathy, and grammar.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Handlebars from 'handlebars';

const ReviewContentInputSchema = z.object({
    name: z.string().optional().describe('The short name or title of the content.'),
    detail: z.string().describe('The main body of the content to be reviewed.'),
});
type ReviewContentInput = z.infer<typeof ReviewContentInputSchema>;

const ReviewContentOutputSchema = z.object({
    revisedName: z.string().optional().describe('The revised name/title.'),
    revisedDetail: z.string().describe('The revised detail text.'),
});
type ReviewContentOutput = z.infer<typeof ReviewContentOutputSchema>;


export async function reviewContent(input: ReviewContentInput): Promise<ReviewContentOutput> {
    return reviewContentFlow(input);
}

const reviewContentFlow = ai.defineFlow(
  {
    name: 'reviewContentFlow',
    inputSchema: ReviewContentInputSchema,
    outputSchema: ReviewContentOutputSchema,
  },
  async (input) => {
    
    const promptTemplate = `You are a compassionate and expert panel of advisors consisting of a seasoned HR Executive, a career coach, and a lawyer. Your primary goal is to review and refine the following text, which will be shown to an individual navigating a difficult job exit.

You will be given a "name" (a short title) and a "detail" (the main body of text).

**Name/Title Instructions:**
- Review the name for clarity and conciseness.
- It should be an actionable, imperative phrase (e.g., "Apply for Unemployment", "Review Your Budget").
- If it is too long or unclear, shorten and clarify it.

**Detail Text Instructions:**
- **Correct Spelling and Grammar:** Meticulously fix any and all spelling mistakes or grammatical errors to ensure the text is professional and clear.
- **Enhance for Empathy and Kindness:** Adjust the tone to be exceptionally supportive, empathetic, and kind. The user is in a vulnerable state, and the language must be gentle and encouraging. Avoid corporate jargon or overly blunt phrasing.
- **Keep it Concise:** Keep the revised detail text clear and concise, ideally under 100 words.

**CRITICAL INSTRUCTIONS:**
- **Preserve Core Facts:** It is absolutely critical that you DO NOT change the core meaning, facts, or instructions of the text. Do not add new steps. Do not invent details like FedEx account numbers unless they are present in the original text. Your role is to improve the delivery, not to alter the message or add new information.
- **No Conversational Filler:** Avoid conversational pleasantries like "Thank you" or "Please note." The tone should be helpful and direct, but not overly conversational.
- **Return Original if Unchanged:** If you believe a field does not need any changes, return the original text for that field.

Return the revised name and detail in the specified output format.

**Original Name:**
---
{{{name}}}
---

**Original Detail:**
---
{{{detail}}}
---
    `;
    
    const compiledTemplate = Handlebars.compile(promptTemplate);
    const finalPrompt = compiledTemplate(input);

    const { output } = await ai.generate({
      prompt: finalPrompt,
      model: 'googleai/gemini-2.0-flash',
      output: { schema: ReviewContentOutputSchema },
    });

    return output!;
  }
);
