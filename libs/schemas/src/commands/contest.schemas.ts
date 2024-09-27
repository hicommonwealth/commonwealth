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

export const FarcasterCastCreatedWebhook = {
  input: z.object({
    id: z.string(), // TODO: remove this
    address: z.string(),
    frame_url: z.string(),
    button_index: z.number(),
    cast_id: z.object({
      fid: z.number(),
      hash: z.string(),
    }),
  }),
  output: z.object({}),
};

export const FarcasterActionWebhook = {
  input: z.object({
    id: z.string(), // TODO: remove this
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
  }),
  output: z.object({}),
};
