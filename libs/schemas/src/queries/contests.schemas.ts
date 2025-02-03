import { z } from 'zod';
import { ChainNode, Community, ContestManager } from '../entities';
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
    community_id: z.string().optional(),
    contest_address: z.string().optional(),
    contest_id: z.number().int().optional(),
    running: z.boolean().optional().describe('Only active contests'),
    with_chain_node: z.string().optional(),
  }),
  output: z.array(ContestResults),
};

export const GetContest = {
  input: z.object({
    contest_address: z.string(),
    with_chain_node: z.boolean().optional(),
    with_contests: z.boolean().optional(),
  }),
  output: ContestManager.extend({
    Community: Community.extend({
      ChainNode: ChainNode.nullish(),
    }).nullish(),
  }).nullish(),
};

export const GetActiveContestManagers = {
  input: z.object({
    community_id: z.string().optional(),
    topic_id: z.number().optional(),
  }),
  output: z.array(
    z.object({
      eth_chain_id: z.number().int(),
      url: z.string(),
      contest_address: z.string(),
      max_contest_id: z.number(),
      end_time: z.coerce.date(),
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
  voting_power: z.string().nullish(),
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

export const GetFarcasterContestCasts = {
  input: z.object({
    contest_address: z.string(),
    sort_by: z.enum(['upvotes', 'recent']).optional().default('upvotes'),
  }),
  output: z.array(z.any()),
};
