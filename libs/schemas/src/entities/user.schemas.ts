import { z } from 'zod';
import { PG_INT } from '../utils';

export const User = z.object({
  id: PG_INT.optional(),
  email: z.string().max(255).email().nullish(),
  isAdmin: z.boolean().default(false).optional(),
  disableRichText: z.boolean().default(false).optional(),
  emailVerified: z.boolean().default(false).optional(),
  selected_community_id: z.string().max(255).optional().nullish(),
  emailNotificationInterval: z
    .enum(['weekly', 'never'])
    .default('never')
    .optional(),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});

export const Profile = z.object({
  id: PG_INT,
  user_id: PG_INT,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  profile_name: z.string().max(255).optional(),
  email: z.string().max(255).optional(),
  website: z.string().max(255).optional(),
  bio: z.string().optional(),
  avatar_url: z.string().max(255).optional(),
  slug: z.string().max(255).optional(),
  socials: z.array(z.string()).optional(),
  background_image: z.any().optional(),
  bio_backup: z.string().optional(),
  profile_name_backup: z.string().max(255).optional(),
});

export const Address = z.object({
  id: PG_INT.optional(),
  address: z.string().max(255),
  community_id: z.string().max(255).optional(),
  user_id: PG_INT.optional(),
  verification_token: z.string().max(255).optional(),
  verification_token_expires: z.date().nullable().optional(),
  verified: z.date().nullable().optional(),
  keytype: z.string().max(255).optional(),
  last_active: z.date().nullable().optional(),
  is_councillor: z.boolean().optional(),
  is_validator: z.boolean().optional(),
  ghost_address: z.boolean().optional(),
  profile_id: PG_INT.nullish().optional(),
  wallet_id: z.string().max(255).optional(),
  block_info: z.string().max(255).optional(),
  is_user_default: z.boolean().optional(),
  role: z.enum(['member', 'admin', 'moderator']).default('member'),
  wallet_sso_source: z.string().max(255).optional(),
  hex: z.string().max(64).optional(),
  created_at: z.any(),
  updated_at: z.any(),
});

export const CommunityMember = z.object({
  id: PG_INT,
  user_id: PG_INT,
  profile_name: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  addresses: z.array(
    z.object({
      id: PG_INT,
      community_id: z.string(),
      address: z.string(),
      stake_balance: z.string().optional(),
    }),
  ),
  roles: z.array(z.string()).optional(),
  group_ids: z.array(PG_INT),
  last_active: z.any().optional().nullable().describe('string or date'),
});
