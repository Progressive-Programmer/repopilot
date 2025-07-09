// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Generates code reviews with actionable advice and suggestions for improvements.
 *
 * - generateCodeReview - A function that handles the code review process.
 * - GenerateCodeReviewInput - The input type for the generateCodeReview function.
 * - GenerateCodeReviewOutput - The return type for the generateCodeReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeReviewInputSchema = z.object({
  code: z.string().describe('The code to be reviewed.'),
  language: z.string().describe('The programming language of the code.'),
});
export type GenerateCodeReviewInput = z.infer<typeof GenerateCodeReviewInputSchema>;

const GenerateCodeReviewOutputSchema = z.object({
  review: z.string().describe('The code review with actionable advice and suggestions for improvements.'),
});
export type GenerateCodeReviewOutput = z.infer<typeof GenerateCodeReviewOutputSchema>;

export async function generateCodeReview(input: GenerateCodeReviewInput): Promise<GenerateCodeReviewOutput> {
  return generateCodeReviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeReviewPrompt',
  input: {schema: GenerateCodeReviewInputSchema},
  output: {schema: GenerateCodeReviewOutputSchema},
  prompt: `You are an expert code reviewer. Provide a code review for the following code, including actionable advice and suggestions for improvements.\n\nLanguage: {{{language}}}\n\nCode:\n{{{code}}}`,
});

const generateCodeReviewFlow = ai.defineFlow(
  {
    name: 'generateCodeReviewFlow',
    inputSchema: GenerateCodeReviewInputSchema,
    outputSchema: GenerateCodeReviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
