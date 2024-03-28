import { z } from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../../constants';
import {
  CommunityMember,
  CommunityStake,
  StakeTransaction,
} from '../entities.schemas';
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
    address: z.string().optional(),
    community_id: z.string().optional(),
  }),
  output: StakeTransaction.and(z.object({ address: z.string() })).array(),
};

export const GetStakeHistoricalPrice = {
  input: z.object({
    past_date_epoch: z.number().min(1),
    community_id: z.string(),
    stake_id: z
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .default(2),
  }),
  output: z.object({
    old_price: z.number().nullable(),
  }),
};
