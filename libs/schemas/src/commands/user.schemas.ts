import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { z } from 'zod';
import { AuthContext, VerifiedContext } from '../context';
import { Address, User } from '../entities';

export const SignIn = {
  input: z.object({
    address: z.string(),
    community_id: z.string(),
    wallet_id: z.nativeEnum(WalletId),
    session: z.string(),
    block_info: z.string().nullish(),
    referrer_address: z.string().nullish(),
    privy: z
      .object({
        identityToken: z.string(),
        ssoOAuthToken: z
          .string()
          .optional()
          .describe(
            'The OAuth token of the SSO service the user signed in with e.g. Google, Github, etc.',
          ),
        ssoProvider: z
          .union([
            z.literal('google_oauth'),
            z.literal('github_oauth'),
            z.literal('discord_oauth'),
            z.literal('apple_oauth'),
            z.literal('twitter_oauth'),
            z.literal('phone'),
            z.literal('farcaster'),
            z.literal('email'),
          ])
          .optional(),
      })
      .optional(),
  }),
  output: Address.extend({
    community_base: z.nativeEnum(ChainBase),
    community_ss58_prefix: z.number().nullish(),
    was_signed_in: z.boolean().describe('True when user was already signed in'),
    user_created: z
      .boolean()
      .describe(
        'True when a user is newly created for this address, equivalent to signing up',
      ),
    address_created: z
      .boolean()
      .describe(
        'True when address is newly created, equivalent to joining a community',
      ),
    first_community: z
      .boolean()
      .describe('True when address joins the first community'),
  }),
  context: AuthContext,
};

export const UpdateUser = {
  input: User.omit({
    is_welcome_onboard_flow_complete: true,
    tier: true,
  }).extend({
    id: z.number(),
    promotional_emails_enabled: z.boolean().nullish(),
    tag_ids: z.number().array().nullish(),
  }),
  output: User,
  context: VerifiedContext,
};

export const GetNewContent = {
  input: z.object({}),
  output: z.object({
    joinedCommunityIdsWithNewContent: z.array(z.string()),
  }),
};

export const CreateApiKey = {
  input: z.object({}),
  output: z.object({
    api_key: z.string(),
  }),
  context: VerifiedContext,
};

export const GetApiKey = {
  input: z.object({}),
  output: z.object({
    hashed_api_key: z.string().optional(),
    created_at: z.string().optional(),
  }),
};

export const DeleteApiKey = {
  input: z.object({}),
  output: z.object({
    deleted: z.boolean(),
  }),
  context: VerifiedContext,
};

export const DistributeSkale = {
  input: z.object({
    address: z.string(),
    eth_chain_id: z
      .number()
      .refine((data) => data === cp.ValidChains.SKALE_TEST, {
        message: `eth_chain_id must be a Skale chain Id`,
      }),
  }),
  output: z.undefined(),
};

export const UpdateSettings = {
  input: z.object({
    disable_rich_text: z.boolean().optional(),
    enable_promotional_emails: z.boolean().optional(),
    email_interval: z.enum(['never', 'weekly']).optional(),
  }),
  output: z.boolean(),
  context: VerifiedContext,
};

export const UpdateEmail = {
  input: z.object({
    email: z.string().email(),
  }),
  output: User.extend({ email: z.string(), update_token: z.string() }),
  context: VerifiedContext,
};

export const FinishUpdateEmail = {
  input: z.object({
    email: z.string().email(),
    token: z.string(),
  }),
  output: z.object({ redirect_path: z.string() }),
  context: VerifiedContext,
};
