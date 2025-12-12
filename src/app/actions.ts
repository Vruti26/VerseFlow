'use server';

import { aiSynopsisAssistant, AiSynopsisAssistantOutput } from '@/ai/flows/ai-synopsis-assistant';

export type FormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  data: AiSynopsisAssistantOutput | null;
};

export async function getSynopsisSuggestions(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const synopsis = formData.get('synopsis') as string;

  if (!synopsis || synopsis.trim().length < 20) {
    return {
      status: 'error',
      message: 'Synopsis must be at least 20 characters long.',
      data: null,
    };
  }

  try {
    const result = await aiSynopsisAssistant({ synopsis });
    return {
      status: 'success',
      message: 'Suggestions generated successfully!',
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      message: 'An error occurred while generating suggestions. Please try again.',
      data: null,
    };
  }
}
