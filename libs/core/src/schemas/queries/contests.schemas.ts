import { z } from 'zod';
import { ContestManager } from '../entities.schemas';
import { Contest, ContestAction } from '../projections';

export const ContestResults = ContestManager.extend({
  topics: z.array(z.object({ id: z.number(), name: z.string() })),
  contests: z.array(
    Contest.omit({ contest_address: true }).extend({
      actions: z.array(
        ContestAction.omit({ contest_address: true, contest_id: true }),
      ),
    }),
  ),
});

export const GetAllContests = {
  input: z.object({
    community_id: z.string(),
    contest_id: z.number().int().optional(),
    running: z.boolean().optional().describe('Only active contests'),
  }),
  output: z.array(ContestResults),
};
