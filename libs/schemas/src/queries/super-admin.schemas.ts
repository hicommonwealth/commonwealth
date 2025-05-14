import { z } from 'zod';
import { ChainNode } from '../entities';

export const GetChainNodes = {
  input: z.object({}),
  output: z.array(ChainNode),
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
