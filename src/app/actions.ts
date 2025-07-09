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

export async function commitFile({
  repoFullName,
  filePath,
  content,
  sha,
  commitMessage,
}: {
  repoFullName: string;
  filePath: string;
  content: string;
  sha: string;
  commitMessage: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // The browser's atob function is not available in server components, so we use Buffer.
    const encodedContent = Buffer.from(content).toString('base64');

    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/github/repos/${repoFullName}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        content: encodedContent,
        sha: sha,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('GitHub API Error:', errorData);
      return { success: false, error: errorData.message || 'Failed to commit file.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Commit file error:', error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
