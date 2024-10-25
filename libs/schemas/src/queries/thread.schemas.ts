import { z } from 'zod';
import { Thread } from '../entities';
import { PG_INT, paginationSchema } from '../utils';
import { TopicView } from './community.schemas';
import { PaginatedResultSchema } from './pagination';

export const ReactionView = z.object({
  id: PG_INT,
  type: z.literal('like'),
  address: z.string(),
  voting_weight: z.number(),
  profile_name: z.string().optional(),
  avatar_url: z.string().optional(),
  updated_at: z.date().or(z.string()).nullish(),
  last_active: z.date().or(z.string()).nullish(),
});

export const ThreadView = Thread.extend({
  id: PG_INT,
  body: z.string(),
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  deleted_at: z.date().or(z.string()).nullish(),
  last_edited: z.date().or(z.string()).nullish(),
  last_commented_on: z.date().or(z.string()).nullish(),
  marked_as_spam_at: z.date().or(z.string()).nullish(),
  archived_at: z.date().or(z.string()).nullish(),
  locked_at: z.date().or(z.string()).nullish(),
  associatedReactions: z.array(ReactionView).optional(),
  topic: TopicView.optional(),
});

export const OrderByQueriesKeys = z.enum([
  'createdAt:asc',
  'createdAt:desc',
  'numberOfComments:asc',
  'numberOfComments:desc',
  'numberOfLikes:asc',
  'numberOfLikes:desc',
  'latestActivity:asc',
  'latestActivity:desc',
]);

// TODO: reconcile this with ThreadView, so that all thread queries return the same shape
export const BulkThreadView = ThreadView.extend({
  chain: z.string(),
  Address: z.object({
    id: PG_INT,
    address: z.string(),
    community_id: z.string(),
  }),
  numberOfComments: PG_INT,
  reactionIds: z.string().array(),
  reactionTimestamps: z.coerce.date().array(),
  reactionWeights: PG_INT.array(),
  addressesReacted: z.string().array(),
  reactedProfileName: z.string().array().optional(),
  reactedProfileAvatarUrl: z.string().array().optional(),
  reactedAddressLastActive: z.string().array().optional(),
  reactionType: z.string().array(),
  latest_activity: z.date().nullable().optional(),
  user_id: PG_INT,
  avatar_url: z.string().nullable(),
  address_last_active: z.date().nullable(),
  profile_name: z.string().nullable(),
});

export const GetBulkThreads = {
  input: z.object({
    community_id: z.string(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    archived: z.coerce.boolean().default(false),
    includePinnedThreads: z.coerce.boolean().default(false),
    topicId: PG_INT.optional(),
    stage: z.string().optional(),
    orderBy: OrderByQueriesKeys.default('createdAt:desc'),
    cursor: PG_INT.optional(),
    ...paginationSchema,
  }),
  output: z.object({
    limit: PG_INT,
    numVotingThreads: PG_INT,
    cursor: PG_INT,
    threads: z.array(BulkThreadView),
  }),
};

export const GetThreadsStatus = z.enum(['active', 'pastWinners', 'all']);
export const GetThreadsOrderBy = z.enum([
  'newest',
  'oldest',
  'mostLikes',
  'mostComments',
  'latestActivity',
]);

export const GetThreads = {
  input: z.object({
    community_id: z.string(),
    page: z.number().optional(),
    limit: z.number().optional(),
    stage: z.string().optional(),
    topic_id: PG_INT.optional(),
    includePinnedThreads: z.boolean().optional(),
    order_by: GetThreadsOrderBy.optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    archived: z.boolean().optional(),
    contestAddress: z.string().optional(),
    status: GetThreadsStatus.optional(),
    withXRecentComments: z.number().optional(),
  }),
  output: z.object({
    page: z.number(),
    limit: z.number(),
    numVotingThreads: z.number(),
    threads: z.array(ThreadView),
  }),
};

export const DEPRECATED_GetThreads = z.object({
  community_id: z.string(),
  bulk: z.coerce.boolean().default(false),
  thread_ids: z.coerce.number().int().array().optional(),
  active: z.string().optional(),
  search: z.string().optional(),
  count: z.coerce.boolean().optional().default(false),
  include_count: z.coerce.boolean().default(false),
});

export const DEPRECATED_GetBulkThreads = z.object({
  topic_id: z.coerce.number().int().optional(),
  includePinnedThreads: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().optional(),
  page: z.coerce.number().int().optional(),
  archived: z.coerce.boolean().optional(),
  stage: z.string().optional(),
  orderBy: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  contestAddress: z.string().optional(),
  status: z.string().optional(),
  withXRecentComments: z.coerce.number().optional(),
});

export const GetThreadsByIds = {
  input: z.object({
    community_id: z.string(),
    thread_ids: z.string(),
  }),
  output: z.array(ThreadView),
};

export const GetThreadCount = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.number(),
};

export const GetActiveThreads = {
  input: z.object({
    community_id: z.string(),
    threads_per_topic: z.coerce.number().min(0).max(10).optional(),
    withXRecentComments: z.coerce.number().optional(),
  }),
  output: z.array(ThreadView),
};

export const SearchThreads = {
  input: z.object({
    communityId: z.string(),
    searchTerm: z.string(),
    threadTitleOnly: z.coerce.boolean().default(false),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
    orderBy: z
      .enum(['last_active', 'rank', 'created_at', 'profile_name'])
      .optional(),
    orderDirection: z.enum(['ASC', 'DESC']).optional(),
    includeCount: z.coerce.boolean().default(false),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(ThreadView),
  }),
};
