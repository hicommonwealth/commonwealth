import { z } from 'zod';
import { ContestManager } from '../entities';
import { Contest, ContestAction } from '../projections';
import { PG_INT } from '../utils';

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

export const GetActiveContestManagers = {
  input: z.object({
    community_id: z.string(),
    topic_id: z.number(),
  }),
  output: z.array(
    z.object({
      eth_chain_id: z.number().int(),
      url: z.string(),
      contest_address: z.string(),
      max_contest_id: z.number(),
      actions: z.array(ContestAction),
    }),
  ),
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
  created_at: z.coerce.date(),
});

export const GetContestLog = {
  input: z.object({
    contest_address: z.string(),
  }),
  output: z.array(ContestLogEntry),
};

export const GetThreadContestManagers = {
  input: z.object({
    topic_id: z.number().nullish(),
    community_id: z.string(),
  }),
  output: z.array(
    z.object({
      contest_address: z.string(),
    }),
  ),
};

export const FarcasterAction = {
  input: z.object({
    contest_address: z.string(),
  }),
  output: z.void(),
};

export const GetFarcasterUpvoteActionMetadata = {
  input: z.any(),
  output: z.object({
    name: z.string(),
    icon: z.string(),
    description: z.string(),
    aboutUrl: z.string().url(),
    action: z.object({
      type: z.literal('post'),
      postUrl: z.string().url(),
    }),
  }),
};
