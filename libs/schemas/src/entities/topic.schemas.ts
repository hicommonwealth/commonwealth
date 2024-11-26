import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { MAX_SCHEMA_INT } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Contest } from '../projections';
import { PG_INT } from '../utils';

export enum TopicWeightedVoting {
  Stake = 'stake',
  ERC20 = 'erc20',
}

export const Topic = z.object({
  id: PG_INT.optional(),
  name: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .default('General')
    .refine(
      (v) => !v.match(/["<>%{}|\\/^`]/g),
      'Name must not contain special characters',
    ),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).nullish(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().nullish(),
  order: PG_INT.nullish(),
  channel_id: z.string().max(255).nullish(),
  group_ids: z.array(PG_INT).default([]),
  default_offchain_template_backup: z.string().nullish(),
  weighted_voting: z.nativeEnum(TopicWeightedVoting).nullish(),
  token_address: z
    .string()
    .nullish()
    .describe('token address, used for ERC20 topics'),
  token_symbol: z
    .string()
    .nullish()
    .describe('token symbol, used for ERC20 topics'),
  vote_weight_multiplier: z
    .number()
    .gt(0)
    .nullish()
    .describe('vote weight multiplier, used for ERC20 topics'),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().nullish(),
  archived_at: z.coerce.date().nullish(),
});

export const ContestManager = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    community_id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    image_url: z.string().nullish(),
    funding_token_address: z
      .string()
      .nullish()
      .describe('Provided by admin on creation when stake funds are not used'),
    prize_percentage: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullish()
      .describe('Percentage of pool used for prizes in recurring contests'),
    payout_structure: z
      .array(z.number().int().min(0).max(100))
      .describe('Sorted array of percentages for prize, from first to last'),
    interval: z
      .number()
      .int()
      .min(0)
      .max(MAX_SCHEMA_INT)
      .describe('Recurring contest interval, 0 when one-off'),
    ticker: z.string().default(commonProtocol.Denominations.ETH),
    decimals: PG_INT.default(
      commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH],
    ),
    created_at: z.coerce.date(),
    cancelled: z
      .boolean()
      .nullish()
      .describe('Flags when contest policy is cancelled by admin'),
    ended: z
      .boolean()
      .nullish()
      .describe(
        'Flags when the one-off contest has ended and rollover was completed',
      ),
    contests: z.array(Contest).nullish(),
    farcaster_frame_url: z.string().nullish(),
    farcaster_frame_hashes: z.array(z.string()).nullish(),
    neynar_webhook_id: z
      .string()
      .nullish()
      .describe('Neynar ID of the ReplyCastCreated webhook'),
    neynar_webhook_secret: z
      .string()
      .nullish()
      .describe('Neynar secret for the ReplyCastCreated webhook'),
    topic_id: PG_INT.nullish(),
    topics: z.array(Topic).nullish(),
    is_farcaster_contest: z.boolean(),
  })
  .describe('On-Chain Contest Manager');
