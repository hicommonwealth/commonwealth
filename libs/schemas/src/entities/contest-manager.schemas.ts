import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { MAX_SCHEMA_INT } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Contest } from '../projections';
import { PG_INT } from '../utils';
import { Topic } from './topic.schemas';

export const ContestManager = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    community_id: z.string(),
    name: z.string(),
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
    topics: z.array(Topic).nullish(),
    contests: z.array(Contest).nullish(),
    farcaster_frame_url: z.string().nullish(),
    farcaster_frame_hashes: z.array(z.string()).nullish(),
  })
  .describe('On-Chain Contest Manager');
