import { Roles, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';

export const Image = z.object({
  url: z.string(),
  imageBehavior: z.string(),
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
  promotional_emails_enabled: z.boolean().optional(),
  is_welcome_onboard_flow_complete: z.boolean().default(false).optional(),
  profile: UserProfile,
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
  user_id: PG_INT.nullish(),
  verification_token: z.string().max(255).optional(),
  verification_token_expires: z.date().nullable().optional(),
  verified: z.date().nullable().optional(),
  last_active: z.date().nullable().optional(),
  is_councillor: z.boolean().optional(),
  is_validator: z.boolean().optional(),
  ghost_address: z.boolean().optional(),
  wallet_id: z.nativeEnum(WalletId).optional(),
  block_info: z.string().max(255).optional(),
  is_user_default: z.boolean().optional(),
  role: z.enum(Roles).default('member'),
  wallet_sso_source: z.nativeEnum(WalletSsoSource).optional(),
  hex: z.string().max(64).optional(),
  created_at: z.any(),
  updated_at: z.any(),
  User: User.optional(),
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
