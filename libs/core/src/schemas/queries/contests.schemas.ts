import { z } from 'zod';
import { Contest, ContestAction } from '../projections';

export const GetAllContests = {
  input: z.object({
    contest: z.string().optional(),
    contest_id: z.number().int().optional(),
  }),
  output: z.array(Contest.extend({ ContestActions: z.array(ContestAction) })),
};
