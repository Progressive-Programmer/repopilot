import {genkit, GenerationModel} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/googleai';

export const GEMINI_15_FLASH = gemini15Flash as GenerationModel;
export const GEMINI_PRO = googleAI.model('gemini-pro') as GenerationModel;

export const ai = genkit({
  plugins: [googleAI()],
  // Default to the fastest model for most operations.
  // The fallback logic will use gemini-pro when this one is overloaded.
  model: GEMINI_15_FLASH,
});
