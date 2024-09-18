import { z } from 'zod';
import { Community, Group, Requirement } from '../entities';
import { PG_INT } from '../utils';

export const CreateGroup = {
  input: z.object({
    id: z.string(),
    metadata: z.object({
      name: z.string(),
      description: z.string(),
      required_requirements: PG_INT.optional(),
      membership_ttl: PG_INT.optional(),
    }),
    requirements: z.array(Requirement),
    topics: z.array(PG_INT).optional(),
  }),
  output: Community.extend({ groups: z.array(Group).optional() }).partial(),
};
