import { Denominations, WeiDecimals } from '@hicommonwealth/evm-protocols';
import z from 'zod';
import { AuthContext } from '../context';
import { ContestManager } from '../entities/contest-manager.schemas';
import { FarcasterAction } from '../entities/farcaster.schemas';
import { ContestAction } from '../projections';
import { PG_INT } from '../utils';

export const CreateContestManagerMetadata = {
  input: z.object({
    community_id: z.string(),
    contest_address: z.string().describe('On-Chain contest manager address'),
    name: z.string(),
    description: z.string().nullish(),
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
    ticker: z.string().optional().default(Denominations.ETH),
    decimals: PG_INT.optional().default(WeiDecimals[Denominations.ETH]),
    topic_id: z.number().optional(),
    is_farcaster_contest: z.boolean().optional(),
    vote_weight_multiplier: z.number().optional().nullish(),
    namespace_judge_token_id: PG_INT.optional().nullish(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
  context: AuthContext,
};

export const UpdateContestManagerMetadata = {
  input: z.object({
    community_id: z.string(),
    contest_address: z.string().describe('On-Chain contest manager address'),
    name: z.string().optional(),
    description: z.string().optional(),
    image_url: z.string().optional(),
    topic_id: PG_INT.optional(),
    namespace_judge_token_id: PG_INT.optional(),
  }),
  output: z.object({
    contest_managers: z.array(
      ContestManager.extend({ topic_id: PG_INT.nullish() }),
    ),
  }),
  context: AuthContext,
};

export const CancelContestManagerMetadata = {
  input: z.object({
    community_id: z.string(),
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
  context: AuthContext,
};

export const ResumeContestManagerMetadata = {
  input: z.object({
    community_id: z.string(),
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
  context: AuthContext,
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
  author: z
    .object({
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
    })
    .partial()
    .nullish(),
  text: z.string(),
  timestamp: z.string(),
  embeds: z.array(
    z.object({
      url: z.string().url(),
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
  channel: z.any().nullable(),
  mentioned_profiles: z.array(z.unknown()),
  event_timestamp: z.string(),
});

export const FarcasterCastWebhook = {
  input: z.object({
    created_at: z.number(),
    type: z.string(),
    data: FarcasterCast,
  }),
  output: z.object({
    status: z.literal('ok'),
  }),
};

export const RelayFarcasterContestBotMentioned = {
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
  input: FarcasterAction,
  output: z.object({
    message: z.string(),
  }),
};

export const FarcasterNotificationsWebhook = {
  input: z.any(),
  output: z.any(),
};

export const SetContestEnding = {
  input: z.object({
    contest_address: z.string(),
    contest_id: PG_INT,
    is_one_off: z.boolean(),
    actions: z.array(
      ContestAction.pick({ action: true, content_id: true, content_url: true }),
    ),
    chain_url: z.string(),
  }),
  output: z.object({}),
};

export const SetContestEnded = {
  input: z.object({
    eth_chain_id: z.number(),
    contest_address: z.string(),
    contest_id: PG_INT,
    prize_percentage: z.number(),
    payout_structure: z.array(z.number()),
    is_one_off: z.boolean(),
    chain_url: z.string(),
    chain_private_url: z.string().nullish(),
  }),
  output: z.object({}),
};

export const UpdateContestManagerFrameHashes = {
  input: z.object({
    contest_address: z.string(),
    frames_to_remove: z.array(z.string()).optional(),
    frames_to_add: z.array(z.string()).optional(),
    webhooks_only: z.boolean().optional(),
  }),
  output: z.object({}),
};

export const DeleteContestManagerMetadata = {
  input: z.object({
    community_id: z.string(),
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
  context: AuthContext,
};

export const ConfigureNominationsMetadata = {
  input: z.object({
    community_id: z.string(),
    judge_token_id: PG_INT,
  }),
  output: z.object({
    community_id: z.string(),
    judge_token_id: PG_INT,
    success: z.boolean(),
  }),
  context: AuthContext,
};
