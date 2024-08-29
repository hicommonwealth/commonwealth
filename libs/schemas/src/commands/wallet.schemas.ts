import { z } from 'zod';

export const CreateWallet = {
  input: z.object({
    id: z.number(),
    address: z.string(),
    signedMessage: z.string(),
  }),
  output: z.object({
    walletAddress: z.string(),
    isNew: z.boolean(),
  }),
};
