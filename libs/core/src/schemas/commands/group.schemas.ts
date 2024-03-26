import { z } from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../../constants';
import { Community, Group, Requirement } from '../entities.schemas';

export const CreateGroup = {
  input: z.object({
    metadata: z.object({
      name: z.string(),
      description: z.string(),
      required_requirements: z
        .number()
        .int()
        .min(MIN_SCHEMA_INT)
        .max(MAX_SCHEMA_INT)
        .optional(),
      membership_ttl: z
        .number()
        .int()
        .min(MIN_SCHEMA_INT)
        .max(MAX_SCHEMA_INT)
        .optional(),
    }),
    requirements: z.array(Requirement),
    topics: z
      .array(z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT))
      .optional(),
  }),
  output: Community.extend({ groups: z.array(Group).optional() }),
};
