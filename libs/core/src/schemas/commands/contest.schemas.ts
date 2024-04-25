import z from 'zod';
import { ContestManager } from '../entities.schemas';

export const CreateContestManagerMetadata = {
  input: z.object({
    community_id: z.string(),
    name: z.string(),
    image_url: z.string(),
    funding_token_address: z.string(),
    prize_percentage: z.number(),
    payout_structure: z.array(z.number()),
    interval: z.number().min(0),
    paused: z.boolean(),
    created_at: z.date(),
  }),
  output: ContestManager,
};

export const UpdateContestManagerMetadata = {
  input: z.object({
    name: z.string().optional(),
    image_url: z.string().optional(),
  }),
  output: ContestManager,
};

export const PauseContestManagerMetadata = {
  input: z.object({}),
  output: ContestManager,
};

export const ResumeContestManagerMetadata = {
  input: z.object({}),
  output: ContestManager,
};
