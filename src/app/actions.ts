'use server';

import { generateCodeReview, generateDiffReview, type GenerateCodeReviewInput, type GenerateDiffReviewInput, type Suggestion } from '@/ai/flows/generate-code-review';
import { diff_match_patch, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE } from 'diff-match-patch';

export async function runCodeReview(input: GenerateCodeReviewInput): Promise<{ review?: Suggestion[]; error?: string }> {
  if (!input.code || !input.language) {
    return { error: 'Code and language are required to generate a review.' };
  }

  try {
    const result = await generateCodeReview(input);
    return { review: result.review };
  } catch (e: any) {
    console.error(e);
    const errorMessage = e.message || 'An unexpected error occurred while generating the code review. Please try again later.';
    return { error: errorMessage };
  }
}

export async function runDiffReview(originalCode: string, modifiedCode: string, language: string): Promise<{ review?: Suggestion[]; error?: string }> {
  if (!language) {
    return { error: 'Language is required to generate a review.' };
  }

  try {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(originalCode, modifiedCode);
    dmp.diff_cleanupSemantic(diffs);

    let diffText = '';
    let originalLine = 1;
    let modifiedLine = 1;

    for (const [op, text] of diffs) {
      const lines = text.split('\n');
      const lineCount = lines.length - 1;

      if (op === DIFF_EQUAL) {
        // No prefix for equal lines
        originalLine += lineCount;
        modifiedLine += lineCount;
      } else if (op === DIFF_DELETE) {
        diffText += text.split('\n').map(l => l ? `- ${l}` : '-').join('\n');
        originalLine += lineCount;
      } else if (op === DIFF_INSERT) {
        diffText += text.split('\n').map(l => l ? `+ ${l}` : '+').join('\n');
        modifiedLine += lineCount;
      }
    }
    
    // If there's no actual difference, don't run the review.
    if (!diffText.trim().length) {
      return { review: [] };
    }
    
    const result = await generateDiffReview({ diff: diffText, language });
    return { review: result.review };
  } catch (e: any) {
    console.error(e);
    const errorMessage = e.message || 'An unexpected error occurred while generating the code review. Please try again later.';
    return { error: errorMessage };
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
