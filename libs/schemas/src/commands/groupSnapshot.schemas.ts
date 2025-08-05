import { z } from 'zod';
import { AuthContext } from '../context';
import { GroupSnapshot } from '../entities';
import { PG_INT } from '../utils';

export const CreateGroupSnapshot = {
  input: z.object({
    community_id: z.string(),
    group_id: PG_INT,
  }),
  output: GroupSnapshot,
  context: AuthContext,
};
