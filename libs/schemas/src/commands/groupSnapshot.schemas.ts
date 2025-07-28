import { z } from 'zod';
import { AuthContext } from '../context';

export const CreateGroupSnapshot = {
  input: z.object({
    groupId: z.number(),
    source: z.object({
      type: z.literal('sui_nft'),
      suiNetwork: z.string(),
      collectionId: z.string(),
    }),
    blockHeight: z.bigint().optional(),
  }),
  output: z.object({
    snapshotId: z.number(),
    status: z.enum(['pending', 'active', 'error', 'superseded']),
    message: z.string(),
  }),
  context: AuthContext,
};
