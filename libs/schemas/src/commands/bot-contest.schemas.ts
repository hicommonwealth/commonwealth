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

export const LaunchMomToken = {
  input: z.object({
    name: z.string().describe('The name of the token'),
    symbol: z.string().describe('The symbol of the token'),
    chain_id: z.number().describe('The chain id to launch token on'),
    icon_url: z.string().describe('The icon url of the token'),
    description: z.string().describe('The description of the token'),
  }),
  output: z.string().describe('New token address'),
};

export const AddMomBotCandidate = {
  input: z.object({
    token_address: z.string().describe('The address of the contest'),
    candidate_address: z.string().describe('The address of the candidate'),
    chain_id: z.number().describe('The chain id to add candidate to'),
  }),
  output: z.object({}),
};
