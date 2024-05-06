import z from 'zod';
import { ContestManager } from '../entities';
import { PG_INT } from '../utils';

export const CreateContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
    name: z.string(),
    image_url: z.string().optional(),
    funding_token_address: z.string().optional(),
    prize_percentage: PG_INT.optional(),
    payout_structure: z.array(PG_INT),
    interval: PG_INT.min(0),
    ticker: z.string(),
    decimals: PG_INT,
    topic_ids: z.array(z.number()),
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const UpdateContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
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
