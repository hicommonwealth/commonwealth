import { Roles, WalletId } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';
import { Tags } from './tag.schemas';

export const ApiKey = z.object({
  user_id: PG_INT.optional(),
  hashed_api_key: z.string(),
  salt: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const Image = z.object({
  url: z.string().nullish(),
  imageBehavior: z.string().nullish(),
});

export const UserProfile = z.object({
  name: z.string().max(255).nullish(),
  email: z.string().max(255).nullish(),
  website: z.string().max(255).nullish(),
  bio: z.string().nullish(),
  avatar_url: z.string().max(255).nullish(),
  slug: z.string().max(255).nullish(),
  socials: z.array(z.string()).nullish(),
  background_image: Image.nullish(),
});

export const ProfileTags = z.object({
  user_id: z.number(),
  tag_id: z.number(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),

  Tag: Tags.nullish(),
});

export const User = z.object({
  id: PG_INT.optional(),
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
  referral_link: z.string().nullish(),

  ProfileTags: z.array(ProfileTags).optional(),
  ApiKey: ApiKey.optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const Address = z.object({
  id: PG_INT.optional(),
  address: z.string().max(255),
  community_id: z.string().max(255),
  user_id: PG_INT.nullish(),
  verification_token: z.string().max(255).optional(),
  verification_token_expires: z.date().nullish(),
  verified: z.date().nullish(),
  last_active: z.date().nullish(),
  ghost_address: z.boolean().default(false),
  wallet_id: z.nativeEnum(WalletId).nullish(),
  block_info: z.string().max(255).nullish(),
  is_user_default: z.boolean().default(false),
  role: z.enum(Roles).default('member'),
  is_banned: z.boolean().default(false),
  hex: z.string().max(64).nullish(),

  User: User.optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const SsoToken = z.object({
  address_id: PG_INT,
  issued_at: PG_INT,
  issuer: z.string(),
  state_id: z.string().nullish(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const CommunityMember = z.object({
  user_id: PG_INT,
  profile_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
  addresses: z.array(
    z.object({
      id: PG_INT,
      community_id: z.string(),
      address: z.string(),
      stake_balance: z.number().nullish(),
      role: z.enum(Roles),
    }),
  ),
  group_ids: z.array(PG_INT),
  last_active: z.any().nullish().describe('string or date'),
});

export const XpLog = z.object({
  user_id: PG_INT,
  created_at: z.coerce.date(),
  event_name: z.string(),
  xp_points: PG_INT,
});
