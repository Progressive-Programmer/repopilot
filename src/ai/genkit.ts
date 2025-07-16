import {genkit, GenerationModel} from 'genkit';
import {googleAI, gemini15Flash, geminiPro} from '@genkit-ai/googleai';

export const GEMINI_15_FLASH = gemini15Flash as GenerationModel;
export const GEMINI_PRO = geminiPro as GenerationModel;

export const ai = genkit({
  plugins: [googleAI()],
  // Default to the fastest model for most operations.
  // The fallback logic will use GEMINI_PRO when this one is overloaded.
  model: GEMINI_15_FLASH,
});
