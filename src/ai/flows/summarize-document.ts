'use server';
/**
 * @fileOverview An AI flow to summarize document content.
 *
 * - summarizeDocument - A function that takes document text and returns a summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DocumentSummarizationInputSchema = z.string();

const DocumentSummarizationOutputSchema = z.string();

export async function summarizeDocument(
  documentContent: string
): Promise<string> {
  return documentSummarizationFlow(documentContent);
}

const prompt = ai.definePrompt({
  name: 'documentSummarizationPrompt',
  input: { schema: DocumentSummarizationInputSchema },
  output: { schema: DocumentSummarizationOutputSchema },
  prompt: `You are an expert at summarizing technical and legal documents for a general audience.
Analyze the following document content and provide a concise, easy-to-understand summary.
Focus on the key points, actions required, and any critical information the user needs to know.
Use bullet points for clarity if needed.

Document Content:
{{{input}}}
`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
