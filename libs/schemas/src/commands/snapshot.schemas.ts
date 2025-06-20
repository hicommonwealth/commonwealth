import { z } from 'zod/v4';

export const CreateSnapshotProposal = {
  input: z.object({
    id: z.string(),
    event: z.literal('proposal/created'),
    space: z.string(),
    expire: z.number(),
    token: z.string().optional(),
    secret: z.string().optional(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
};
