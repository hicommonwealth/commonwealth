import { ChainBase, Roles } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Referral } from '../entities';
import { Tags } from '../entities/tag.schemas';
import { UserProfile } from '../entities/user.schemas';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';
import { AddressView, CommentView, ThreadView } from './thread.schemas';

export const UserProfileAddressView = AddressView.extend({
  Community: z.object({
    id: z.string(),
    base: z.nativeEnum(ChainBase),
    ss58_prefix: PG_INT.nullish(),
  }),
});

export const UserProfileCommentView = CommentView.extend({
  community_id: z.string(),
});

export const UserProfileView = z.object({
  userId: PG_INT,
  profile: UserProfile,
  totalUpvotes: z.number().int(),
  addresses: z.array(UserProfileAddressView),
  threads: z.array(ThreadView),
  comments: z.array(UserProfileCommentView),
  commentThreads: z.array(ThreadView),
  isOwner: z.boolean(),
  tags: z.array(Tags.extend({ id: PG_INT })),
  xp_points: z.number().int(),
});

export const GetUserProfile = {
  input: z.object({
    userId: PG_INT.optional(),
  }),
  output: UserProfileView,
};

export const SearchUserProfilesView = z.object({
  user_id: PG_INT,
  profile_name: z.string(),
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
    }),
  ),
};

export const ReferralView = Referral.extend({
  referrer: z.object({
    id: PG_INT,
    profile: UserProfile,
  }),
  referee: z.object({
    id: PG_INT,
    profile: UserProfile,
  }),
});

export const GetUserReferrals = {
  input: z.object({ user_id: PG_INT.optional() }),
  output: z.array(ReferralView),
};
