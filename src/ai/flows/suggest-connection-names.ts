'use server';

/**
 * @fileOverview AI agent to suggest connection names for a tree.
 *
 * - suggestConnectionNames - A function that suggests names for potential 'big' and 'little' connections.
 * - SuggestConnectionNamesInput - The input type for the suggestConnectionNames function.
 * - SuggestConnectionNamesOutput - The return type for the suggestConnectionNames function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestConnectionNamesInputSchema = z.object({
  existingConnections: z
    .array(z.string())
    .describe('List of existing connection names in the tree.'),
  treeName: z.string().describe('The name of the tree.'),
});
export type SuggestConnectionNamesInput = z.infer<typeof SuggestConnectionNamesInputSchema>;

const SuggestConnectionNamesOutputSchema = z.object({
  suggestedBigName: z.string().describe('Suggested name for the "big" connection.'),
  suggestedLittleName: z.string().describe('Suggested name for the "little" connection.'),
});
export type SuggestConnectionNamesOutput = z.infer<typeof SuggestConnectionNamesOutputSchema>;

export async function suggestConnectionNames(
  input: SuggestConnectionNamesInput
): Promise<SuggestConnectionNamesOutput> {
  return suggestConnectionNamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestConnectionNamesPrompt',
  input: {schema: SuggestConnectionNamesInputSchema},
  output: {schema: SuggestConnectionNamesOutputSchema},
  prompt: `You are an AI assistant helping to suggest new connection names (big and little) for a tree.

  Consider the existing connections in the tree to find suitable matches and avoid duplicates.

  Tree Name: {{treeName}}
  Existing Connections: {{#each existingConnections}}{{{this}}}, {{/each}}

  Suggest a name for both big and little, taking into consideration existing connections, and the tree name.
  Do not use names that already exist.
  Ensure that the suggested names sound realistic and appropriate for the context.
  Be creative but also considerate of naming conventions.
  `,
});

const suggestConnectionNamesFlow = ai.defineFlow(
  {
    name: 'suggestConnectionNamesFlow',
    inputSchema: SuggestConnectionNamesInputSchema,
    outputSchema: SuggestConnectionNamesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
