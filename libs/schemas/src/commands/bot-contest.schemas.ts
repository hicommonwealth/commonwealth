import { z } from 'zod';

export const CreateBotContest = {
  input: z.object({
    prompt: z
      .string()
      .describe('The cast/post containing the prompt for contest creation'),
    chain_id: z.number().describe('The chain id to create contest for'),
  }),
  output: z.string().describe('New contest address'),
};
