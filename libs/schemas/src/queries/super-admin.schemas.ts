import { z } from 'zod';
import { ChainNode, CommunityGoalMeta } from '../entities';

export const GetChainNodes = {
  input: z.void(),
  output: z.array(
    ChainNode.extend({
      created_at: z.date().or(z.string()).optional(),
      updated_at: z.date().or(z.string()).optional(),
    }),
  ),
};

export const TotalStats = z.object({
  numCommentsLastMonth: z.number(),
  numThreadsLastMonth: z.number(),
  numPollsLastMonth: z.number(),
  numReactionsLastMonth: z.number(),
  numProposalVotesLastMonth: z.number(),
  numMembersLastMonth: z.number(),
  numGroupsLastMonth: z.number(),
});

export const GetStats = {
  input: z.object({
    community_id: z.string().optional(),
  }),
  output: z.object({
    lastMonthNewCommunities: z.array(
      z.object({
        id: z.string(),
        created_at: z.date(),
      }),
    ),
    totalStats: TotalStats.extend({
      averageAddressesPerCommunity: z.number(),
      populatedCommunities: z.number(),
    }),
  }),
};

export const GetTopUsers = {
  input: z.object({}),
  output: z.array(z.any()),
};

export const MembersStatsView = z.object({
  address: z.string(),
  profile_name: z.string(),
  thread_count: z.number(),
  comment_count: z.number(),
  reaction_count: z.number(),
});

export const GetCommunityMembersStats = {
  input: z.object({
    community_id: z.string().optional(),
  }),
  output: z.object({
    members: z.array(MembersStatsView),
  }),
};

export const GetCommunityGoalMetas = {
  input: z.void(),
  output: z.array(
    CommunityGoalMeta.extend({
      created_at: z.date().or(z.string()).optional(),
      updated_at: z.date().or(z.string()).optional(),
    }),
  ),
};
