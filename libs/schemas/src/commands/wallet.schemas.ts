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

export const SendTransaction = {
  input: z.object({
    id: z.number(),
    to: z.string(),
    value: z.number(),
    data: z.string(),
  }),
  output: z.object({
    transaction_hash: z.string(),
  }),
};
