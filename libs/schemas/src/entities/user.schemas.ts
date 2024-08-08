import { Roles, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';

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
  created_at: z.date().nullish(),
  updated_at: z.date().nullish(),
});

export const User = z.object({
  id: PG_INT.nullish(),
  email: z.string().max(255).email().nullish(),
  isAdmin: z.boolean().default(false),
  disableRichText: z.boolean().default(false),
  emailVerified: z.boolean().default(false),
  selected_community_id: z.string().max(255).nullish(),
  emailNotificationInterval: z.enum(['weekly', 'never']).default('never'),
  promotional_emails_enabled: z.boolean().nullish(),
  is_welcome_onboard_flow_complete: z.boolean().default(false),
  profile: UserProfile,
  created_at: z.any().nullish(),
  updated_at: z.any().nullish(),
  ProfileTags: z.array(ProfileTags).nullish(),
});

export const Profile = z.object({
  id: PG_INT,
  user_id: PG_INT,
  created_at: z.date().nullish(),
  updated_at: z.date().nullish(),
  profile_name: z.string().max(255).nullish(),
  email: z.string().max(255).nullish(),
  website: z.string().max(255).nullish(),
  bio: z.string().nullish(),
  avatar_url: z.string().max(255).nullish(),
  slug: z.string().max(255).nullish(),
  socials: z.array(z.string()).nullish(),
  background_image: z.any().nullish(),
  bio_backup: z.string().nullish(),
  profile_name_backup: z.string().max(255).nullish(),
});

export const Address = z.object({
  id: PG_INT.nullish(),
  address: z.string().max(255),
  community_id: z.string().max(255),
  user_id: PG_INT.nullish(),
  verification_token: z.string().max(255),
  verification_token_expires: z.date().nullable().nullish(),
  verified: z.date().nullable().nullish(),
  last_active: z.date().nullable().nullish(),
  is_councillor: z.boolean().default(false),
  is_validator: z.boolean().default(false),
  ghost_address: z.boolean().default(false),
  wallet_id: z.nativeEnum(WalletId).nullish(),
  block_info: z.string().max(255).nullish(),
  is_user_default: z.boolean().default(false),
  role: z.enum(Roles).default('member'),
  wallet_sso_source: z.nativeEnum(WalletSsoSource).nullish(),
  hex: z.string().max(64).nullish(),
  created_at: z.any(),
  updated_at: z.any(),
  User: User.nullish(),
});

export const SsoToken = z.object({
  address_id: PG_INT,
  issued_at: PG_INT,
  issuer: z.string(),
  state_id: z.string().nullish(),
  created_at: z.date(),
  updated_at: z.date(),
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
      role: z.string(),
    }),
  ),
  group_ids: z.array(PG_INT),
  last_active: z.any().nullish().describe('string or date'),
});
