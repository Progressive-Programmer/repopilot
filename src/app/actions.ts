'use server';

import { generateCodeReview, type GenerateCodeReviewInput } from '@/ai/flows/generate-code-review';

export async function runCodeReview(input: GenerateCodeReviewInput): Promise<{ review?: string; error?: string }> {
  if (!input.code || !input.language) {
    return { error: 'Code and language are required to generate a review.' };
  }

  try {
    const result = await generateCodeReview(input);
    return { review: result.review };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred while generating the code review. Please try again later.' };
  }
}
