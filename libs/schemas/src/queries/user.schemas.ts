import { Roles } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Community, Thread } from '../entities';
import { Comment } from '../entities/comment.schemas';
import { Tags } from '../entities/tag.schemas';
import { Address, UserProfile } from '../entities/user.schemas';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GetUserProfile = {
  input: z.object({
    userId: PG_INT.optional(),
  }),
  output: z.object({
    userId: PG_INT,
    profile: UserProfile,
    totalUpvotes: z.number().int(),
    addresses: z.array(
      Address.extend({
        Community: Community.pick({
          id: true,
          base: true,
          ss58_prefix: true,
        }),
      }),
    ),
    threads: z.array(Thread),
    comments: z.array(
      Comment.extend({
        Thread: z.undefined(),
        community_id: z.string(),
      }),
    ),
    commentThreads: z.array(Thread),
    isOwner: z.boolean(),
    tags: z.array(Tags.extend({ id: PG_INT })),
  }),
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
  //group_ids: z.array(PG_INT),
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
