import { z } from 'zod';
import { Thread } from '../entities';
import { PG_INT } from '../utils';

export const ThreadFeedRecord = z.object({
  thread_id: PG_INT,
  last_activity: z.coerce.string(),
  notification_data: z.string(),
  category_id: z.string(),
  comment_count: PG_INT,
  commenters: z.array(
    z.object({
      Addresses: z.array(
        z.object({
          id: PG_INT,
          address: z.string(),
          community_id: z.string(),
        }),
      ),
    }),
  ),
});

export const ThreadFeed = {
  input: z.object({}),
  output: z.array(ThreadFeedRecord),
};

export const ChainFeedRecord = z.object({
  community_id: z.string(),
  network: z.string(),
  block_number: PG_INT,
  event_data: z.object({
    id: z.string(),
    kind: z.string(),
  }),
});

export const ChainFeed = {
  input: z.object({}),
  output: z.array(ChainFeedRecord),
};

export const MappedReaction = z.object({
  id: z.number(),
  type: z.literal('like'),
  address: z.string(),
  updated_at: z.date(),
  voting_weight: z.number(),
  profile_name: z.string().optional(),
  avatar_url: z.string().optional(),
  last_active: z.date().optional(),
});

export const MappedThread = Thread.extend({
  associatedReactions: z.array(MappedReaction),
});

export const GetUserFeedStatus = z.enum(['active', 'pastWinners', 'all']);
export const GetUserFeedOrderBy = z.enum([
  'newest',
  'oldest',
  'mostLikes',
  'mostComments',
  'latestActivity',
]);

export const GetUserFeed = {
  input: z.object({
    community_id: z.string(),
    page: z.number().optional(),
    limit: z.number().optional(),
    stage: z.string().optional(),
    topic_id: PG_INT.optional(),
    includePinnedThreads: z.boolean().optional(),
    order_by: GetUserFeedOrderBy.optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    archived: z.boolean().optional(),
    contestAddress: z.string().optional(),
    status: GetUserFeedStatus.optional(),
    withXRecentComments: z.number().optional(),
  }),
  output: z.object({
    page: z.number(),
    limit: z.number(),
    numVotingThreads: z.number(),
    threads: z.array(MappedThread),
  }),
};
