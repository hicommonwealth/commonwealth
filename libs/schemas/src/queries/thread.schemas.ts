import { z } from 'zod';
import { Thread } from '../entities';
import {
  DiscordMetaSchema,
  PG_INT,
  linksSchema,
  paginationSchema,
} from '../utils';
import { PaginatedResultSchema } from './pagination';

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

export const BulkThread = z.object({
  id: PG_INT,
  title: z.string(),
  url: z.string().nullable(),
  body: z.string(),
  last_edited: z.date().nullable().optional(),
  kind: z.string(),
  stage: z.string(),
  read_only: z.boolean(),
  discord_meta: DiscordMetaSchema.nullish(),
  pinned: z.boolean(),
  chain: z.string(),
  locked_at: z.date().nullable().optional(),
  links: z.object(linksSchema).array().nullable().optional(),
  collaborators: z.any().array(),
  has_poll: z.boolean().nullable().optional(),
  last_commented_on: z.date().nullable().optional(),
  Address: z.object({
    id: PG_INT,
    address: z.string(),
    community_id: z.string(),
  }),
  numberOfComments: PG_INT,
  reactionIds: z.string().array(),
  reactionTimestamps: z.coerce.date().array(),
  reactionWeights: PG_INT.array(),
  reaction_weights_sum: PG_INT,
  addressesReacted: z.string().array(),
  reactedProfileName: z.string().array().optional(),
  reactedProfileAvatarUrl: z.string().array().optional(),
  reactedAddressLastActive: z.string().array().optional(),
  reactionType: z.string().array(),
  marked_as_spam_at: z.date().nullable().optional(),
  archived_at: z.date().nullable().optional(),
  latest_activity: z.date().nullable().optional(),
  topic: z
    .object({
      id: PG_INT,
      name: z.string(),
      description: z.string(),
      chainId: z.string(),
      telegram: z.string().nullish(),
    })
    .optional(),
  user_id: PG_INT,
  avatar_url: z.string().nullable(),
  address_last_active: z.date().nullable(),
  profile_name: z.string().nullable(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
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
    threads: z.array(BulkThread),
  }),
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
    threads: z.array(MappedThread),
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
  output: z.array(Thread),
};

export const GetActiveThreads = {
  input: z.object({
    community_id: z.string(),
    threads_per_topic: z.coerce.number().min(0).max(10).optional(),
    withXRecentComments: z.coerce.number().optional(),
  }),
  output: z.array(Thread),
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
    results: z.array(Thread),
  }),
};
