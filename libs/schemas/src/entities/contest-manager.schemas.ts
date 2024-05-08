import { MAX_SCHEMA_INT, commonProtocol } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Contest } from '../projections';
import { PG_INT } from '../utils';
import { Topic } from './topic.schemas';

export const ContestManager = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    community_id: z.string(),
    name: z.string(),
    image_url: z.string().optional(),
    funding_token_address: z
      .string()
      .optional()
      .describe('Provided by admin on creation when stake funds are not used'),
    prize_percentage: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
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
    ticker: z.string().optional().default(commonProtocol.Denominations.ETH),
    decimals: PG_INT.optional().default(
      commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH],
    ),
    created_at: z.date(),
    cancelled: z
      .boolean()
      .optional()
      .describe('Flags when contest policy is cancelled by admin'),
    topics: z.array(Topic).optional(),
    contests: z.array(Contest).optional(),
  })
  .describe('On-Chain Contest Manager');

export const ContestTopic = z
  .object({
    contest_address: z.string(),
    topic_id: PG_INT,
    created_at: z.date(),
  })
  .describe('X-Ref to topics in contest');
