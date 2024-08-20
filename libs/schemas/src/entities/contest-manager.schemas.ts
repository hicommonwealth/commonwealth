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
  })
  .describe('On-Chain Contest Manager');

export const ContestTopic = z
  .object({
    contest_address: z.string(),
    topic_id: PG_INT,
    created_at: z.coerce.date(),
  })
  .describe('X-Ref to topics in contest');

export const FarcasterWebhookEvent = z.object({
  created_at: z.number(),
  type: z.literal('cast.created'),
  data: z.object({
    object: z.string(),
    hash: z.string(),
    thread_hash: z.string(),
    parent_hash: z.string().nullable(),
    parent_url: z.string(),
    root_parent_url: z.string(),
    parent_author: z.object({
      fid: z.number().nullable(),
    }),
    author: z.object({
      object: z.string(),
      fid: z.number(),
      custody_address: z.string(),
      username: z.string(),
      display_name: z.string(),
      pfp_url: z.string(),
      profile: z.any().nullish(), // TODO: Adjust this based on the actual structure of the "profile" object
      follower_count: z.number(),
      following_count: z.number(),
      verifications: z.array(z.string()),
      active_status: z.string(),
    }),
    text: z.string(),
    timestamp: z.string(),
    embeds: z.array(z.any()), // TODO: Adjust this based on the actual structure of the "embeds" array
    reactions: z.object({
      likes: z.array(z.any()), // TODO: Adjust this based on the actual structure of the "likes" array
      recasts: z.array(z.any()), // TODO: Adjust this based on the actual structure of the "recasts" array
    }),
    replies: z.object({
      count: z.number(),
    }),
    mentioned_profiles: z.array(z.any()), // TODO: Adjust this based on the actual structure of the "mentioned_profiles" array
  }),
});
