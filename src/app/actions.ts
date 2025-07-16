'use server';

import { generateCodeReview, generateDiffReview, type GenerateCodeReviewInput, type Suggestion } from '@/ai/flows/generate-code-review';
import { diff_match_patch, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE, type Diff } from 'diff-match-patch';

const CONTEXT_LINES = 3;

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

function createUnifiedDiff(originalCode: string, modifiedCode: string, diffs: Diff[]): string {
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');
    let unifiedDiff = '';
    let originalLineNum = 0;
    let modifiedLineNum = 0;

    let i = 0;
    while (i < diffs.length) {
        const [op, text] = diffs[i];

        if (op === DIFF_EQUAL) {
            originalLineNum += text.split('\n').length - 1;
            modifiedLineNum += text.split('\n').length - 1;
            i++;
            continue;
        }

        // Find a block of changes
        let startBlock = i;
        while (i < diffs.length && diffs[i][0] !== DIFF_EQUAL) {
            i++;
        }
        let endBlock = i;

        // Context before the change
        const contextBeforeStart = Math.max(0, originalLineNum - CONTEXT_LINES);
        let hunkHeaderOriginalStart = contextBeforeStart + 1;
        
        let modifiedContextStartLine = 0;
        let tempOriginalLine = 0;
        for(let j=0; j<startBlock; j++) {
            if (diffs[j][0] === DIFF_EQUAL) modifiedContextStartLine += diffs[j][1].split('\n').length - 1;
            if (diffs[j][0] === DIFF_INSERT) modifiedContextStartLine += diffs[j][1].split('\n').length - 1;
            if (diffs[j][0] === DIFF_DELETE) modifiedContextStartLine -= diffs[j][1].split('\n').length - 1;
        }
        
        let hunkHeaderModifiedStart = originalLineNum + modifiedContextStartLine - CONTEXT_LINES + 1;
        if(hunkHeaderModifiedStart < 1) hunkHeaderModifiedStart = 1;


        let hunk = '';
        for (let j = contextBeforeStart; j < originalLineNum; j++) {
            hunk += ` ${originalLines[j]}\n`;
        }

        let originalHunkSize = originalLineNum - contextBeforeStart;
        let modifiedHunkSize = originalHunkSize;


        for (let j = startBlock; j < endBlock; j++) {
            const [op, text] = diffs[j];
            const lines = text.split('\n');
            if (op === DIFF_INSERT) {
                lines.forEach(line => {
                    if (line) hunk += `+${line}\n`;
                });
                modifiedHunkSize += lines.length - 1;
            } else if (op === DIFF_DELETE) {
                 lines.forEach(line => {
                    if (line) hunk += `-${line}\n`;
                });
                originalHunkSize += lines.length - 1;
            }
        }
        
        originalLineNum += (diffs[startBlock][1].split('\n').length - 1);


        // Context after the change
        const nextEqualBlock = diffs[endBlock];
        if (nextEqualBlock) {
            const contextLines = nextEqualBlock[1].split('\n').slice(0, CONTEXT_LINES);
            contextLines.forEach(line => {
                if (line) hunk += ` ${line}\n`;
            });
            originalHunkSize += contextLines.length - (contextLines.length > 0 ? 1 : 0);
            modifiedHunkSize += contextLines.length - (contextLines.length > 0 ? 1 : 0);
        }

        unifiedDiff += `@@ -${hunkHeaderOriginalStart},${originalHunkSize} +${hunkHeaderModifiedStart},${modifiedHunkSize} @@\n`;
        unifiedDiff += hunk;

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

  try {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(originalCode, modifiedCode);
    dmp.diff_cleanupSemantic(diffs);
    
    const diffText = createUnifiedDiff(originalCode, modifiedCode, diffs);

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