import { z } from 'zod';
import { ContestAction } from '../projections';

export const GetAllContests = {
  input: z.object({
    contest: z.string().optional(),
    contest_id: z.number().int().optional(),
  }),
  output: z.array(ContestAction),
};
