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
import { diff_match_patch } from 'diff-match-patch';

const SuggestionSchema = z.object({
  title: z.string().describe('A short, descriptive title for the suggestion.'),
  description: z.string().describe('A detailed explanation of the issue and why the change is recommended.'),
  severity: z.enum(['Critical', 'Warning', 'Improvement', 'Info']).describe('The severity of the issue.'),
  lines: z.string().describe('The line range in the code that this suggestion refers to (e.g., "10-15").'),
  suggestion: z.string().optional().describe('The suggested code to replace the problematic lines. This should be the exact code, including original indentation.'),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;


const GenerateCodeReviewInputSchema = z.object({
  code: z.string().describe('The code to be reviewed.'),
  language: z.string().describe('The programming language of the code.'),
});
export type GenerateCodeReviewInput = z.infer<typeof GenerateCodeReviewInputSchema>;

const GenerateDiffReviewInputSchema = z.object({
  diff: z.string().describe('The code diff to be reviewed.'),
  language: z.string().describe('The programming language of the code.'),
});
export type GenerateDiffReviewInput = z.infer<typeof GenerateDiffReviewInputSchema>;

const GenerateCodeReviewOutputSchema = z.object({
  review: z.array(SuggestionSchema).describe('A list of suggestions for improving the code.'),
});
export type GenerateCodeReviewOutput = z.infer<typeof GenerateCodeReviewOutputSchema>;

export async function generateCodeReview(input: GenerateCodeReviewInput): Promise<GenerateCodeReviewOutput> {
  return generateCodeReviewFlow(input);
}

export async function generateDiffReview(input: GenerateDiffReviewInput): Promise<GenerateCodeReviewOutput> {
  return generateDiffReviewFlow(input);
}

const fullReviewPrompt = ai.definePrompt({
  name: 'generateCodeReviewPrompt',
  input: {schema: GenerateCodeReviewInputSchema},
  output: {schema: GenerateCodeReviewOutputSchema, format: 'json'},
  prompt: `You are an expert code reviewer acting as an automated linter. Your task is to provide a thorough code review with actionable advice and suggestions for improvements.

Analyze the following code, paying close attention to:
- Best practices for the specified language.
- Potential bugs and security vulnerabilities.
- Code smells, readability, and maintainability.
- Performance optimizations.

For each issue you find, provide a clear suggestion. Each suggestion must include:
1.  A short, descriptive title.
2.  A detailed description explaining the issue and why your suggestion is better.
3.  A severity level (Critical, Warning, Improvement, Info).
4.  The exact line range (e.g., "10-15") the issue pertains to in the original code.
5.  If applicable, provide a concrete 'suggestion' with the exact code that should replace the problematic lines. The suggested code should be perfectly formatted and include the original indentation to ensure it can be applied directly.

Return your findings as a structured list of suggestions in JSON format.

Language: {{{language}}}

Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
`,
});

const diffReviewPrompt = ai.definePrompt({
  name: 'generateDiffReviewPrompt',
  input: { schema: GenerateDiffReviewInputSchema },
  output: { schema: GenerateCodeReviewOutputSchema, format: 'json' },
  prompt: `You are an expert code reviewer acting as an automated linter. Your task is to provide a thorough code review based on a code diff. Focus your analysis ONLY on the changes presented in the diff.

Analyze the following diff, paying close attention to:
- Best practices for the specified language.
- Potential bugs and security vulnerabilities introduced by the changes.
- Code smells, readability, and maintainability issues in the new code.
- Performance optimizations related to the changes.

For each issue you find, provide a clear suggestion. Each suggestion must include:
1.  A short, descriptive title.
2.  A detailed description explaining the issue and why your suggestion is better.
3.  A severity level (Critical, Warning, Improvement, Info).
4.  The exact line range (e.g., "10-15") the issue pertains to in the NEW, MODIFIED code.
5.  If applicable, provide a concrete 'suggestion' with the exact code that should replace the problematic lines. The suggested code should be perfectly formatted and include the original indentation to ensure it can be applied directly.

Return your findings as a structured list of suggestions in JSON format.

Language: {{{language}}}

Diff:
\`\`\`diff
{{{diff}}}
\`\`\`
`,
});


const generateCodeReviewFlow = ai.defineFlow(
  {
    name: 'generateCodeReviewFlow',
    inputSchema: GenerateCodeReviewInputSchema,
    outputSchema: GenerateCodeReviewOutputSchema,
  },
  async input => {
    const {output} = await fullReviewPrompt(input);
    return output!;
  }
);

const generateDiffReviewFlow = ai.defineFlow(
  {
    name: 'generateDiffReviewFlow',
    inputSchema: GenerateDiffReviewInputSchema,
    outputSchema: GenerateCodeReviewOutputSchema,
  },
  async input => {
    const { output } = await diffReviewPrompt(input);
    return output!;
  }
);
