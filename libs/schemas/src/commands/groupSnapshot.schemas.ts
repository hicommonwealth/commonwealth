import { z } from 'zod';
import { AuthContext } from '../context';
import { PG_INT } from '../utils';

export const CreateGroupSnapshot = {
  input: z.object({
    community_id: z.string(),
    group_id: PG_INT,
  }),
  output: z.object({
    snapshot_id: z.number(),
    status: z.enum(['pending', 'active', 'error', 'superseded']),
    message: z.string(),
  }),
  context: AuthContext,
};
