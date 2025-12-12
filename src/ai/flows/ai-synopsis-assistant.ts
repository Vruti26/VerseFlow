'use server';
/**
 * @fileOverview An AI tool that analyzes a book's synopsis and suggests relevant content and improvements to grammar and sentence structure.
 *
 * - aiSynopsisAssistant - A function that provides content suggestions and grammar/sentence structure improvements for a given book synopsis.
 * - AiSynopsisAssistantInput - The input type for the aiSynopsisAssistant function.
 * - AiSynopsisAssistantOutput - The return type for the aiSynopsisAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSynopsisAssistantInputSchema = z.object({
  synopsis: z
    .string()
    .describe('The synopsis of the book for which to provide assistance.'),
});
export type AiSynopsisAssistantInput = z.infer<typeof AiSynopsisAssistantInputSchema>;

const AiSynopsisAssistantOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'A list of suggestions for relevant content that could be added to the book to improve its appeal.'
    ),
  grammarImprovements: z
    .string()
    .describe(
      'Suggested improvements to the grammar and sentence structure of the synopsis to enhance its quality.'
    ),
});
export type AiSynopsisAssistantOutput = z.infer<typeof AiSynopsisAssistantOutputSchema>;

export async function aiSynopsisAssistant(
  input: AiSynopsisAssistantInput
): Promise<AiSynopsisAssistantOutput> {
  return aiSynopsisAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSynopsisAssistantPrompt',
  input: {schema: AiSynopsisAssistantInputSchema},
  output: {schema: AiSynopsisAssistantOutputSchema},
  prompt: `You are an AI writing assistant that helps authors improve their book synopses.

  Analyze the following synopsis and provide suggestions for relevant content that could be added to the book, as well as improvements to the grammar and sentence structure.

  Synopsis: {{{synopsis}}}

  Content Suggestions:
  Grammar and Sentence Structure Improvements:`,
});

const aiSynopsisAssistantFlow = ai.defineFlow(
  {
    name: 'aiSynopsisAssistantFlow',
    inputSchema: AiSynopsisAssistantInputSchema,
    outputSchema: AiSynopsisAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
