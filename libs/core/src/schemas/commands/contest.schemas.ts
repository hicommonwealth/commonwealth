import { commonProtocol } from '@hicommonwealth/shared';
import z from 'zod';
import { ContestManager } from '../entities.schemas';
import { PG_INT } from '../utils.schemas';

export const CreateContestManagerMetadata = {
  input: z.object({
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
    interval: z
      .number()
      .int()
      .min(0)
      .max(100)
      .describe('Recurring contest interval, 0 when one-off'),
    ticker: z.string().optional().default(commonProtocol.Denominations.ETH),
    decimals: PG_INT.optional().default(
      commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH],
    ),
    topic_ids: z.array(z.number()).optional(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const UpdateContestManagerMetadata = {
  input: z.object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    name: z.string().optional(),
    image_url: z.string().optional(),
    topic_ids: z.array(z.number()).optional(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const CancelContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const ResumeContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};
