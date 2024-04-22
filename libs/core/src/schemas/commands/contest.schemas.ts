import z from 'zod';
import { ContestManager } from '../projections';

export const CreateContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
    community_id: z.string(),
    name: z.string(),
    image_url: z.string(),
    funding_token_address: z.string().optional(),
    prize_percentage: z.number().optional(),
    payout_structure: z.array(z.number()),
  }),
  output: ContestManager,
};

export const UpdateContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
    community_id: z.string(),
    name: z.string(),
    image_url: z.string(),
  }),
  output: ContestManager,
};

export const PauseContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
    community_id: z.string(),
  }),
  output: ContestManager,
};

export const ResumeContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
    community_id: z.string(),
  }),
  output: ContestManager,
};
