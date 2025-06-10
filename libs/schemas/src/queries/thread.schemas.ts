import { LinkSource } from '@hicommonwealth/shared';
import { ZodType, z } from 'zod';
import { AuthContext, ThreadContext } from '../context';
import {
  Address,
  Comment,
  CommentVersionHistory,
  ContestManager,
  Link,
  ProfileTags,
  Thread,
  ThreadVersionHistory,
  USER_TIER,
  UserProfile,
} from '../entities';
import { ContestAction } from '../projections';
import { PG_INT, paginationSchema } from '../utils';
import { TopicView } from './community.schemas';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

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
  score: z
    .array(
      z.object({
        prize: z.string(),
        votes: z.string(),
        content_id: z.string(),
        creator_address: z.string(),
      }),
    )
    .nullish(),
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

export const ProfileTagsView = ProfileTags.omit({ Tag: true }).extend({
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
  tier: z.number().nullish().optional(),
  referred_by_address: z.string().nullish(),
  xp_referrer_points: PG_INT.default(0).nullish(),
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
}).omit({
  oauth_email: true,
  oauth_provider: true,
  oauth_phone_number: true,
  oauth_username: true,
  oauth_email_verified: true,
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
  avatar_url: z.string().optional(),
  user_id: PG_INT,
  CommentVersionHistories: z.array(CommentVersionHistoryView).nullish(),
});

export type CommentViewType = z.infer<typeof CommentView>;

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
  is_linking_token: z.boolean().optional(),
  launchpad_token_address: z.string().nullable().optional(),
  ContestActions: z.array(ContestActionView).optional(),
  Comments: z.array(CommentView).optional(),
  ThreadVersionHistories: z.array(ThreadVersionHistoryView).nullish(),
  search: z.union([z.string(), z.record(z.string(), z.any())]).nullish(),
  total_num_thread_results: z
    .number()
    .nullish()
    .describe('total number of thread results for the query'),
  user_id: PG_INT.nullish(),
  user_tier: USER_TIER.nullish(),
  avatar_url: z.string().nullish(),
  address_last_active: z.date().or(z.string()).nullish(),
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
  input: PaginationParamsSchema.extend({
    community_id: z.string(),
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
  output: PaginatedResultSchema.extend({
    results: z.array(ThreadView),
  }),
  context: AuthContext,
};

export const GetThreadsByIds = {
  input: z.object({
    community_id: z.string(),
    thread_ids: z.string(),
  }),
  output: z.array(ThreadView),
  context: AuthContext,
};

export const GetThreadById = {
  input: z.object({
    thread_id: PG_INT,
  }),
  output: ThreadView,
  context: ThreadContext,
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
  context: AuthContext,
};

export const SearchThreads = {
  input: PaginationParamsSchema.extend({
    community_id: z.string(),
    search_term: z.string(),
    thread_title_only: z.coerce.boolean().default(false),
    include_count: z.coerce.boolean().default(false),
    order_by: z
      .enum(['last_active', 'rank', 'created_at', 'profile_name'])
      .optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(ThreadView),
  }),
  context: AuthContext,
};

export const GetLinks = {
  input: z.object({
    thread_id: PG_INT.optional(),
    link_source: z.nativeEnum(LinkSource).optional(),
    link_identifier: z.string().optional(),
  }),
  output: z.object({
    links: z.array(Link).optional(),
    threads: z
      .array(
        z.object({
          id: PG_INT,
          title: z.string(),
        }),
      )
      .optional(),
  }),
};
