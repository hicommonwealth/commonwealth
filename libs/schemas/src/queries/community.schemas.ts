import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '@hicommonwealth/shared';
import { z } from 'zod';
import { CommunityMember, CommunityStake } from '../entities';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

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
      ])
      .optional(),
    include_group_ids: z.coerce.boolean().optional(),
    include_stake_balances: z.coerce.boolean().optional(),
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
        default_symbol: z.string(),
        icon_url: z.string(),
        name: z.string(),
        chain_node_id: PG_INT.nullable(),
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
      old_price: z.string().nullable(),
    })
    .array(),
};
