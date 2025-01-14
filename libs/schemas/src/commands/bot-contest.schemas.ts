import { z } from 'zod';

export const CreateBotContest = {
  input: z.object({
    castHash: z.string().optional(),
    prompt: z
      .string()
      .describe('The cast text containing the prompt for contest creation'),
  }),
  output: z.string().describe('New contest address'),
};
