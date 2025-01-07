import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { z } from 'zod';
import { AuthContext } from '../context';
import { Address, User } from '../entities';

export const SignIn = {
  input: z.object({
    address: z.string(),
    community_id: z.string(),
    wallet_id: z.nativeEnum(WalletId),
    session: z.string(),
    block_info: z.string().nullish(),
    referrer_address: z.string().optional(),
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
  input: User.omit({ is_welcome_onboard_flow_complete: true }).extend({
    id: z.number(),
    promotional_emails_enabled: z.boolean().nullish(),
    tag_ids: z.number().array().nullish(),
    referrer_address: z.string().optional(),
  }),
  output: User,
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
};
