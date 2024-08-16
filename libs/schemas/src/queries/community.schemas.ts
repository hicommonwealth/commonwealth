import {
  ChainBase,
  ChainNetwork,
  MAX_SCHEMA_INT,
  MIN_SCHEMA_INT,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import {
  Community,
  CommunityMember,
  CommunityStake,
  ExtendedCommunity,
} from '../entities';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GetCommunities = {
  input: PaginationParamsSchema.extend({
    network: z.nativeEnum(ChainNetwork).optional(),
    base: z.nativeEnum(ChainBase).optional(),
    // NOTE 8/7/24: passing arrays in GET requests directly is not supported.
    //    Instead we support comma-separated strings of ids.
    tag_ids: z
      .preprocess((value) => {
        if (typeof value === 'string') {
          return value.split(',').map((id) => id.trim());
        }
        return value;
      }, z.array(z.coerce.number().positive()))
      .optional(),
    include_node_info: z.boolean().optional(),
    stake_enabled: z.boolean().optional(),
    has_groups: z.boolean().optional(),
    order_by: z.enum(['profile_count', 'thread_count']).optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: Community.array(),
  }),
};

export const GetCommunity = {
  input: z.object({
    id: z.string(),
    include_node_info: z.boolean().optional(),
  }),
  output: ExtendedCommunity,
};

export const GetCommunityStake = {
  input: z.object({
    community_id: z.string(),
    stake_id: z.coerce
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .optional()
      .describe('The stake id or all stakes when undefined'),
  }),
  output: CommunityStake.optional(),
};

export const GetCommunityMembers = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
    community_id: z.string(),
    include_roles: z.boolean().optional(),
    memberships: z
      .union([
        z.literal('in-group'),
        z.string().regex(/^in-group:\d+$/, 'in-group with a number'),
        z.literal('not-in-group'),
        z.literal('allow-specified-addresses'),
        z.literal('not-allow-specified-addresses'),
      ])
      .optional(),
    include_group_ids: z.coerce.boolean().optional(),
    include_stake_balances: z.coerce.boolean().optional(),
    allowedAddresses: z.string().optional(),
    order_by: z.enum(['last_active', 'name']).optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: CommunityMember.array(),
  }),
};

export const GetStakeTransaction = {
  input: z.object({
    addresses: z.string().optional(),
  }),
  output: z
    .object({
      transaction_hash: z.string(),
      address: z.string(),
      stake_price: z.string(),
      stake_amount: PG_INT,
      vote_weight: PG_INT,
      timestamp: PG_INT,
      stake_direction: z.string(),
      community: z.object({
        id: z.string(),
        default_symbol: z.string().nullish(),
        icon_url: z.string().nullish(),
        name: z.string(),
        chain_node_id: PG_INT.nullish(),
        chain_node_name: z.string().nullish(),
      }),
    })
    .array(),
};

export const GetStakeHistoricalPrice = {
  input: z.object({
    past_date_epoch: z.number().min(1),
    community_id: z.string().optional(),
    stake_id: PG_INT.default(2),
  }),
  output: z
    .object({
      community_id: z.string(),
      old_price: z.string().nullish(),
    })
    .array(),
};
