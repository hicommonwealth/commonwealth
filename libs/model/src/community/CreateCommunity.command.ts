import type { CommandMetadata } from '@hicommonwealth/core';
import {
  ChainBase,
  ChainType,
  CommunityCategoryType,
} from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { MustNotExist } from '../middleware/invariants';
import type { CommunityAttributes } from '../models';
import { checkIconSize } from '../utils/checkIconSize';
import { ALL_COMMUNITIES } from '../utils/constants';

const schema = z.object({
  id: z.string(),
  name: z
    .string()
    .max(255)
    .refine((data) => !data.includes(ALL_COMMUNITIES), {
      message: `String must not contain '${ALL_COMMUNITIES}'`,
    }),
  chain_node_id: z.number().optional(), // corresponds to the chain field
  description: z.string().optional(),
  icon_url: z
    .string()
    .url()
    .superRefine(async (val, ctx) => await checkIconSize(val, ctx))
    .optional(),
  social_links: z.array(z.string().url()).default([]),
  tags: z.array(z.nativeEnum(CommunityCategoryType)).default([]),
  directory_page_enabled: z.boolean().default(false),
  type: z.nativeEnum(ChainType).default(ChainType.Offchain),
  base: z.nativeEnum(ChainBase),

  // hidden optional params
  user_address: z.string().optional(), // address for the user
  alt_wallet_url: z.string().url().optional(),
  eth_chain_id: z.coerce.number().optional(),
  cosmos_chain_id: z.string().optional(),
  address: z.string().optional(), // address for the contract of the chain
  decimals: z.number().optional(),
  substrate_spec: z.string().optional(),
  bech32_prefix: z.string().optional(), // required for cosmos communities
  token_name: z.string().optional(),

  // deprecated params to be removed
  node_url: z.string().url(),
  network: z.string(),
  default_symbol: z.string().max(9),
  website: z.string().url().optional(),
  github: z.string().url().startsWith('https://github.com/').optional(),
  telegram: z.string().url().startsWith('https://t.me/').optional(),
  element: z.string().url().startsWith('https://matrix.to/').optional(),
  discord: z.string().url().startsWith('https://discord.com/').optional(),
});

export type CreateCommunity = z.infer<typeof schema>;

export const CreateCommunity: CommandMetadata<
  CommunityAttributes,
  typeof schema
> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const community = await models.Community.findOne({ where: { id } });

    MustNotExist('Community', community);

    //await models.Community.create(payload)
    return payload as Partial<CommunityAttributes>;
  },
};
