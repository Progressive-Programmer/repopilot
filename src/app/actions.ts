'use server';

import { generateCodeReview, generateDiffReview, type GenerateCodeReviewInput, type Suggestion } from '@/ai/flows/generate-code-review';
import { diff_match_patch, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE, type Diff } from 'diff-match-patch';
import { GEMINI_PRO, GEMINI_15_FLASH } from '@/ai/genkit';
import type { GenerationModel } from 'genkit';

const CONTEXT_LINES = 3;
const MODELS_TO_TRY: GenerationModel[] = [GEMINI_15_FLASH, GEMINI_PRO];

function isOverloadedError(e: any): boolean {
  return e.message?.includes('503') || e.message?.includes('overloaded') || e.message?.includes('429');
}

async function runReviewWithFallbacks<T>(
  reviewFunction: (input: T) => Promise<{ review?: Suggestion[]; error?: string }>,
  input: T
): Promise<{ review?: Suggestion[]; error?: string }> {
  let lastError: any;
  for (const model of MODELS_TO_TRY) {
    try {
      const inputWithModel = { ...input, model };
      const result = await reviewFunction(inputWithModel);
      if (result.review) {
        return result; // Success
      }
      if (result.error && !isOverloadedError({ message: result.error })) {
        return result; // Return non-overload errors immediately
      }
      lastError = result.error;
    } catch (e: any) {
      lastError = e;
      if (!isOverloadedError(e)) {
        console.error(`Non-overload error with model ${model.name}, failing fast:`, e);
        break; // Don't retry on other errors
      }
      console.log(`Model ${model.name} is overloaded, trying next model...`);
    }
  }

  console.error('All models failed:', lastError);
  const errorMessage = lastError?.message || 'An unexpected error occurred after trying all available models. Please try again later.';
  return { error: errorMessage };
}


export async function runCodeReview(input: GenerateCodeReviewInput): Promise<{ review?: Suggestion[]; error?: string }> {
  if (!input.code || !input.language) {
    return { error: 'Code and language are required to generate a review.' };
  }
  return runReviewWithFallbacks(generateCodeReview, input);
}


function createUnifiedDiff(originalCode: string, modifiedCode: string, diffs: Diff[]): string {
    const originalLines = originalCode.split('\n');
    let unifiedDiff = '';
    let originalLineNum = 0;

    let i = 0;
    while (i < diffs.length) {
        const currentDiff = diffs[i];

        // Find a block of changes (non-equal parts)
        if (currentDiff[0] !== DIFF_EQUAL) {
            let startBlock = i;
            while (i < diffs.length && diffs[i][0] !== DIFF_EQUAL) {
                i++;
            }
            let endBlock = i;

            // Calculate hunk start lines
            const contextBeforeStartLine = Math.max(0, originalLineNum - CONTEXT_LINES);
            let hunkHeaderOriginalStart = contextBeforeStartLine + 1;

            let modifiedLineCursor = originalLineNum + 1;
            for (let j = 0; j < startBlock; j++) {
                if (diffs[j][0] === DIFF_INSERT) modifiedLineCursor += diffs[j][1].split('\n').length - 1;
                if (diffs[j][0] === DIFF_DELETE) modifiedLineCursor -= diffs[j][1].split('\n').length - 1;
            }
            let hunkHeaderModifiedStart = Math.max(1, modifiedLineCursor - CONTEXT_LINES);

            let hunk = '';
            let originalHunkSize = 0;
            let modifiedHunkSize = 0;

            // Add context before
            for (let j = contextBeforeStartLine; j < originalLineNum; j++) {
                hunk += ` ${originalLines[j]}\n`;
                originalHunkSize++;
                modifiedHunkSize++;
            }

            // Add changes
            for (let j = startBlock; j < endBlock; j++) {
                const [op, text] = diffs[j];
                const lines = text.split('\n');
                lines.forEach((line, index) => {
                    // Don't add the last empty line from a split
                    if (index === lines.length - 1 && line === '') return;

                    if (op === DIFF_INSERT) {
                        hunk += `+${line}\n`;
                        modifiedHunkSize++;
                    } else if (op === DIFF_DELETE) {
                        hunk += `-${line}\n`;
                        originalHunkSize++;
                    }
                });
            }

            // Add context after
            const nextEqualBlock = diffs[endBlock];
            if (nextEqualBlock) {
                const contextLines = nextEqualBlock[1].split('\n');
                const contextToAdd = contextLines.slice(0, CONTEXT_LINES);
                contextToAdd.forEach(line => {
                    hunk += ` ${line}\n`;
                    originalHunkSize++;
                    modifiedHunkSize++;
                });
            }
            
            // Finalize hunk header and add to diff
            unifiedDiff += `@@ -${hunkHeaderOriginalStart},${originalHunkSize} +${hunkHeaderModifiedStart},${modifiedHunkSize} @@\n`;
            unifiedDiff += hunk;
        }

        // Move originalLineNum cursor
        if (currentDiff[0] === DIFF_EQUAL || currentDiff[0] === DIFF_DELETE) {
             originalLineNum += currentDiff[1].split('\n').length - 1;
        }
        
        i++;
    }
    return unifiedDiff;
}


export async function runDiffReview(originalCode: string, modifiedCode: string, language: string): Promise<{ review?: Suggestion[]; error?: string }> {
  if (!language) {
    return { error: 'Language is required to generate a review.' };
  }
  
  if (originalCode === modifiedCode) {
      return { review: [] };
  }

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(originalCode, modifiedCode);
  dmp.diff_cleanupSemantic(diffs);
  
  const diffText = createUnifiedDiff(originalCode, modifiedCode, diffs);

  if (!diffText.trim().length) {
    return { review: [] };
  }
  
  return runReviewWithFallbacks(generateDiffReview, { diff: diffText, language });
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
