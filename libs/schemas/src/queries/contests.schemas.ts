import { z } from 'zod';
import { ContestManager } from '../entities';
import { Contest } from '../projections';
import { PG_INT, zDate } from '../utils';

export const ContestResults = ContestManager.extend({
  topics: z.array(z.object({ id: z.number(), name: z.string() })),
  contests: z.array(
    Contest.omit({ contest_address: true }),
    // .extend({
    //   actions: z.array(
    //     ContestAction.omit({ contest_address: true, contest_id: true }),
    //   ),
    // }),
  ),
});

export const GetAllContests = {
  input: z.object({
    community_id: z.string(),
    contest_address: z.string().optional(),
    contest_id: z.number().int().optional(),
    running: z.boolean().optional().describe('Only active contests'),
  }),
  output: z.array(ContestResults),
};

export const ContestLogEntry = z.object({
  event_name: z.string(),
  event_payload: z.object({}),
  contest_address: z.string(),
  contest_id: PG_INT,
  action: z.string().nullish(),
  actor_address: z.string().nullish(),
  voting_power: PG_INT.nullish(),
  thread_id: PG_INT.nullish(),
  thread_title: z.string().nullish(),
  created_at: zDate,
});

export const GetContestLog = {
  input: z.object({
    contest_address: z.string(),
  }),
  output: z.array(ContestLogEntry),
};
