import { commonProtocol } from '@hicommonwealth/shared';
import z from 'zod';
import { ContestManager } from '../entities';
import { PG_INT } from '../utils';

export const CreateContestManagerMetadata = {
  input: z.object({
    id: z.string(),
    contest_address: z.string().describe('On-Chain contest manager address'),
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
    interval: PG_INT.describe(
      'Recurring contest interval in seconds, 0 when one-off',
    ),
    ticker: z.string().optional().default(commonProtocol.Denominations.ETH),
    decimals: PG_INT.optional().default(
      commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH],
    ),
    topic_ids: z.array(z.number()).max(1).optional(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const UpdateContestManagerMetadata = {
  input: z.object({
    id: z.string(),
    contest_address: z.string().describe('On-Chain contest manager address'),
    name: z.string().optional(),
    image_url: z.string().optional(),
    topic_ids: z.array(z.number()).max(1).optional(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const CancelContestManagerMetadata = {
  input: z.object({
    id: z.string(),
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const ResumeContestManagerMetadata = {
  input: z.object({
    id: z.string(),
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const PerformContestRollovers = {
  input: z.object({ id: z.string() }),
  output: z.object({}),
};

export const FarcasterCast = z.object({
  object: z.string(),
  hash: z.string(),
  thread_hash: z.string(),
  parent_hash: z.string().nullable(),
  parent_url: z.string().nullable(),
  root_parent_url: z.string().nullable(),
  parent_author: z.object({
    fid: z.number().nullable(),
  }),
  author: z.object({
    object: z.string(),
    fid: z.number(),
    custody_address: z.string(),
    username: z.string(),
    display_name: z.string(),
    pfp_url: z.string().url(),
    profile: z.object({
      bio: z.object({
        text: z.string(),
      }),
    }),
    follower_count: z.number(),
    following_count: z.number(),
    verifications: z.array(z.unknown()),
    verified_addresses: z.object({
      eth_addresses: z.array(z.string()),
      sol_addresses: z.array(z.string()),
    }),
    active_status: z.string(),
    power_badge: z.boolean(),
  }),
  text: z.string(),
  timestamp: z.string(),
  embeds: z.array(
    z.object({
      url: z.string().url(),
      metadata: z.object({
        content_type: z.string(),
        content_length: z.string(),
        _status: z.string(),
        image: z.object({
          width_px: z.number(),
          height_px: z.number(),
        }),
      }),
    }),
  ),
  reactions: z.object({
    likes_count: z.number(),
    recasts_count: z.number(),
    likes: z.array(z.unknown()),
    recasts: z.array(z.unknown()),
  }),
  replies: z.object({
    count: z.number(),
  }),
  channel: z.string().nullable(),
  mentioned_profiles: z.array(z.unknown()),
  event_timestamp: z.string(),
});

export const FarcasterCastCreatedWebhook = {
  input: z.object({
    created_at: z.number(),
    type: z.string(),
    data: FarcasterCast,
  }),
  output: z.object({
    status: z.literal('ok'),
  }),
};

export const FarcasterUpvoteAction = {
  input: z.object({}),
  output: z.object({}),
};
