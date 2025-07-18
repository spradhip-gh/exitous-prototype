'use server';
/**
 * @fileOverview An AI flow to summarize document content.
 *
 * - summarizeDocument - A function that takes document text and returns a summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DocumentSummarizationInputSchema = z.object({
  contentDataUri: z.string().describe("The document content as a data URI."),
  mimeType: z.string().describe("The MIME type of the document (e.g., 'text/plain', 'application/pdf')."),
});

const DocumentSummarizationOutputSchema = z.string();

export async function summarizeDocument(
  input: z.infer<typeof DocumentSummarizationInputSchema>
): Promise<string> {
  return documentSummarizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentSummarizationPrompt',
  input: { schema: DocumentSummarizationInputSchema },
  output: { schema: DocumentSummarizationOutputSchema },
  prompt: `You are an expert at summarizing technical and legal documents for a general audience.
Analyze the following document and provide a concise, easy-to-understand summary.
Focus on the key points, actions required, and any critical information the user needs to know.
Use bullet points for clarity if needed.

Document Content:
{{media url=contentDataUri}}
`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async (input) => {
    if (!input || !input.contentDataUri || !input.mimeType) {
        console.warn('Document summarization flow called with invalid input.');
        return 'The document is empty or could not be read.';
    }

    if (!input.mimeType.startsWith('text/') && input.mimeType !== 'application/pdf') {
       throw new Error(`Cannot summarize non-text or non-PDF files. Mime type: ${input.mimeType}`);
    }

    const { output } = await prompt(input);
    return output!;
  }
);
