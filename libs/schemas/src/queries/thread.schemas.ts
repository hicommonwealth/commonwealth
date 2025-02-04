import { ZodType, z } from 'zod';
import {
  Address,
  Comment,
  CommentVersionHistory,
  ContestManager,
  ProfileTags,
  Thread,
  ThreadVersionHistory,
  UserProfile,
} from '../entities';
import { ContestAction } from '../projections';
import { PG_INT, paginationSchema } from '../utils';
import { TopicView } from './community.schemas';
import { PaginatedResultSchema } from './pagination';

export const ContestManagerView = ContestManager.pick({
  name: true,
  cancelled: true,
  interval: true,
});

export const ContestView = z.object({
  ContestManager: ContestManagerView,
  contest_id: z.number(),
  contest_address: z.string(),
  start_time: z.date().or(z.string()),
  end_time: z.date().or(z.string()),
  score: z.array(
    z.object({
      prize: z.string(),
      votes: z.string(),
      content_id: z.string(),
      creator_address: z.string(),
    }),
  ),
  contest_name: z.string().nullish(),
  contest_interval: z.number().nullish(),
  content_id: z.number().nullish(),
  contest_cancelled: z.boolean().nullish(),
  thread_id: z.number().nullish(),
});

export const ContestActionView = ContestAction.pick({
  content_id: true,
  thread_id: true,
}).extend({
  Contest: ContestView,
});

export const ProfileTagsView = ProfileTags.extend({
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
});

export const UserView = z.object({
  id: PG_INT,
  email: z.string().max(255).email().nullish(),
  isAdmin: z.boolean().default(false).nullish(),
  disableRichText: z.boolean().default(false).optional(),
  emailVerified: z.boolean().default(false).nullish(),
  selected_community_id: z.string().max(255).nullish(),
  emailNotificationInterval: z
    .enum(['weekly', 'never'])
    .default('never')
    .optional(),
  promotional_emails_enabled: z.boolean().nullish(),
  is_welcome_onboard_flow_complete: z.boolean().default(false).optional(),

  profile: UserProfile,
  xp_points: PG_INT.default(0).nullish(),

  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  ProfileTags: z.array(ProfileTagsView).optional(),
  unsubscribe_uuid: z.string().uuid().nullish().optional(),
});
type UserView = z.infer<typeof UserView>;

export const AddressView = Address.extend({
  id: PG_INT,
  verified: z.date().or(z.string()).nullish(),
  verification_token_expires: z.date().or(z.string()).nullish(),
  last_active: z.date().or(z.string()).nullish(),
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  User: UserView.optional().nullish() as ZodType<UserView | null | undefined>,
});

export const ReactionView = z.object({
  id: PG_INT,
  address_id: PG_INT,
  reaction: z.enum(['like']),
  thread_id: PG_INT.nullish(),
  comment_id: PG_INT.nullish(),
  proposal_id: z.number().nullish(),
  calculated_voting_weight: z.string().nullish(),
  canvas_signed_data: z.any().nullish(),
  canvas_msg_id: z.string().max(255).nullish(),
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  // associations
  Address: AddressView.optional(),
  // added by GetThreads query
  address: z.string().optional(),
  last_active: z.date().or(z.string()).nullish(),
  profile_name: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const CommentVersionHistoryView = CommentVersionHistory.extend({
  id: PG_INT,
  timestamp: z.date().or(z.string()),
});

export const CommentView = Comment.extend({
  id: PG_INT,
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  deleted_at: z.date().or(z.string()).nullish(),
  marked_as_spam_at: z.date().or(z.string()).nullish(),
  Address: AddressView.nullish(),
  Thread: z.undefined(),
  community_id: z.string(),
  last_active: z.date().or(z.string()).nullish(),
  Reaction: ReactionView.nullish(),
  search: z.undefined(),
  // this is returned by GetThreads
  address: z.string(),
  profile_name: z.string().optional(),
  profile_avatar: z.string().optional(),
  user_id: PG_INT,
  CommentVersionHistories: z.array(CommentVersionHistoryView).nullish(),
});

export const ThreadVersionHistoryView = ThreadVersionHistory.extend({
  id: PG_INT,
  timestamp: z.date().or(z.string()),
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
  activity_rank_date: z.date().or(z.string()).nullish(),
  Address: AddressView.nullish(),
  Reaction: ReactionView.nullish(),
  collaborators: AddressView.array().nullish(),
  reactions: ReactionView.array().nullish(),
  associatedContests: z.array(ContestView).nullish(),
  topic: TopicView.optional(),
  topic_id: PG_INT.optional(),
  ContestActions: z.array(ContestActionView).optional(),
  Comments: z.array(CommentView).optional(),
  ThreadVersionHistories: z.array(ThreadVersionHistoryView).nullish(),
  search: z.union([z.string(), z.record(z.any())]).nullish(),
  total_num_thread_results: z
    .number()
    .nullish()
    .describe('total number of thread results for the query'),
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
    threadCount: z.number().optional(),
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
    community_id: z.string().optional(),
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
