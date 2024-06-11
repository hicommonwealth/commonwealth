import { z } from 'zod';

export const CreateWallet = {
  input: z.object({
    address: z.string(),
    signedMessage: z.string(),
  }),
  output: z.object({
    walletAddress: z.string(),
    isNew: z.boolean(),
  }),
};
