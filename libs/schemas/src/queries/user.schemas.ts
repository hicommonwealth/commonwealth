import { ChainBase, Roles, WalletId } from '@hicommonwealth/shared';
import { ZodType, z } from 'zod';
import { AuthContext, VerifiedContext } from '../context';
import { ReferralFees, User } from '../entities';
import { Tags } from '../entities/tag.schemas';
import { USER_TIER, UserProfile } from '../entities/user.schemas';
import { XpLog } from '../entities/xp.schemas';
import { EVM_ADDRESS, PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';
import {
  AddressView,
  CommentView,
  CommentViewType,
  ThreadView,
  UserView,
} from './thread.schemas';

export const UserProfileAddressView = AddressView.extend({
  Community: z.object({
    id: z.string(),
    base: z.nativeEnum(ChainBase),
    ss58_prefix: PG_INT.nullish(),
  }),
});

// Type annotation is needed to avoid:
// The inferred type of this node exceeds the maximum length the compiler will serialize.
// An explicit type annotation is needed.ts(7056)
type UserProfileAddressView = z.infer<typeof UserProfileAddressView>;

export const UserProfileView = z.object({
  userId: PG_INT,
  tier: USER_TIER,
  profile: UserProfile,
  totalUpvotes: z.number().int(),
  addresses: z.array(UserProfileAddressView) as ZodType<
    UserProfileAddressView[]
  >,
  threads: z.array(ThreadView),
  comments: z.array(CommentView) as ZodType<CommentViewType[]>,
  commentThreads: z.array(ThreadView),
  isOwner: z.boolean(),
  tags: z.array(Tags.extend({ id: PG_INT })),
  referred_by_address: z.string().nullish(),
  referral_count: PG_INT.default(0),
  referral_eth_earnings: z.number().optional(),
  xp_points: PG_INT.default(0),
  xp_referrer_points: PG_INT.default(0),
});

type UserProfileView = z.infer<typeof UserProfileView>;

export const GetUserProfile = {
  input: z.object({
    userId: PG_INT.optional(),
  }),
  output: UserProfileView as ZodType<UserProfileView>,
  context: VerifiedContext,
};

export const GetUser = {
  input: z.object({}),
  output: z.union([User, z.object({})]),
};

export const UserStatusAddressView = z.object({
  id: PG_INT,
  address: z.string(),
  role: z.enum(['member', 'moderator', 'admin']),
  wallet_id: z.nativeEnum(WalletId),
  oauth_provider: z.string().nullish(),
  ghost_address: z.boolean().nullish(),
  last_active: z.coerce.date().or(z.string()).nullish(),
  Community: z.object({
    id: z.string(),
    base: z.nativeEnum(ChainBase),
    ss58_prefix: PG_INT.nullish(),
  }),
});

export const UserStatusCommunityView = z.object({
  id: z.string(),
  name: z.string(),
  icon_url: z.string().nullish(),
  redirect: z.string().nullish(),
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  starred_at: z.date().or(z.string()).nullish(),
});

export const GetStatus = {
  input: z.void(),
  output: UserView.omit({ profile: true })
    .extend({
      addresses: z.array(UserStatusAddressView),
      communities: z.array(UserStatusCommunityView),
      jwt: z.string(),
      knockJwtToken: z.string().optional(),
      notify_user_name_change: z.boolean().default(false),
    })
    .optional(),
};

export const SearchUserProfilesView = z.object({
  user_id: PG_INT,
  profile_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
  created_at: z.date().or(z.string()),
  last_active: z.date().or(z.string()).nullish(),
  addresses: z.array(
    z.object({
      id: PG_INT,
      community_id: z.string(),
      address: z.string(),
      role: z.enum(Roles),
    }),
  ),
});

export const SearchUserProfiles = {
  input: PaginationParamsSchema.extend({
    search: z.string(),
    exact_match: z.boolean().optional(),
    community_id: z.string().optional(),
    order_by: z
      .enum(['last_active', 'created_at', 'profile_name', 'rank'])
      .optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(SearchUserProfilesView),
  }),
};

export const GetUserAddresses = {
  input: z.object({
    communities: z.string(),
    addresses: z.string(),
  }),
  output: z.array(
    z.object({
      userId: z.number(),
      name: z.string(),
      address: z.string(),
      lastActive: z.date().or(z.string()),
      avatarUrl: z.string().nullish(),
      tier: z.number().nullish(),
    }),
  ),
};

export const ReferralView = z.object({
  referrer_address: z.string().max(255),
  referee_address: z.string().max(255),
  referee_user_id: PG_INT,
  referee_profile: UserProfile,
  // when referee creates a community
  community_id: z.string().nullish(),
  community_name: z.string().nullish(),
  community_icon_url: z.string().nullish(),
  namespace_address: EVM_ADDRESS.nullish(),
  referrer_received_eth_amount: z.string(),
});

export const GetUserReferrals = {
  input: z.object({ user_id: PG_INT.optional() }),
  output: z.array(ReferralView),
};

export const ReferralFeesView = ReferralFees.extend({
  referrer_received_amount: z.string(),
  transaction_timestamp: z.string(),
  referee_profile: UserProfile.nullish(),
  community_id: z.string().nullish(),
  community_name: z.string().nullish(),
  community_icon_url: z.string().nullish(),
});

export const GetUserReferralFees = {
  input: z.object({
    distributed_token_address: z.string().optional(),
    user_id: PG_INT.optional(),
  }),
  output: z.array(ReferralFeesView),
};

export const XpLogView = XpLog.omit({
  user: true,
  creator: true,
  quest_action_meta: true,
}).extend({
  user_profile: UserProfile,
  quest_id: z.number(),
  quest_action_meta_id: z.number(),
  event_name: z.string(),
  reward_amount: z.number(),
  creator_profile: UserProfile.nullish(),
  is_creator: z.boolean().describe('Actor is the creator or referrer'),
  is_referral: z.boolean().describe('Is a referral event'),
  created_at: z.date().or(z.string()),
  event_created_at: z.date().or(z.string()),
});

export const GetXps = {
  input: z.object({
    user_id: PG_INT.optional().describe('Filters events by user id'),
    user_or_creator_id: PG_INT.optional().describe(
      'Filters events by user or creator id',
    ),
    community_id: z
      .string()
      .optional()
      .describe('Filters events by community id associated to quest'),
    quest_id: z
      .number()
      .optional()
      .describe('Filters events by a specific quest id'),
    from: z.coerce
      .date()
      .optional()
      .describe('Filters events after this date excluding'),
    to: z.coerce
      .date()
      .optional()
      .describe('Filters events before this date including'),
    event_name: z.string().optional().describe('Filters events by event name'),
  }),
  output: z.array(XpLogView),
};

export const XpRankedUser = z.object({
  user_id: PG_INT,
  xp_points: z.number(),
  tier: z.number(),
  user_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
});

export const GetXpsRanked = {
  input: z.object({
    top: z.number(),
    search: z.string().optional(),
    quest_id: z
      .number()
      .optional()
      .describe('Filters events by a specific quest id'),
  }),
  output: z.array(XpRankedUser),
};

export const RandomResourceIdsView = z.object({
  community_id: z.string(),
  thread_id: z.number(),
  comment_id: z.number(),
});

export const GetAddressStatus = {
  input: z.object({
    community_id: z.string(),
    address: z.string(),
  }),
  output: z.object({
    exists: z.boolean(),
    belongs_to_user: z.boolean(),
  }),
  context: VerifiedContext,
};

export const GetMoonpaySignature = {
  input: z.object({
    url: z.string().url(),
  }),
  output: z.object({
    signature: z.string(),
  }),
  context: VerifiedContext,
};

export const MutualCommunityView = z.object({
  id: z.string(),
  name: z.string(),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string().nullish(),
});

export const GetMutualConnections = {
  input: z.object({
    user_id_1: PG_INT,
    user_id_2: PG_INT,
    limit: z.number().int().min(1).max(100).optional().default(10),
  }),
  output: z.object({
    mutual_communities: z.array(MutualCommunityView),
  }),
  context: AuthContext,
};
