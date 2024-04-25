import z from 'zod';
import { ContestManager } from '../entities.schemas';

export const CreateContestManagerMetadata = {
  input: z.object({
    contest_address: z.string(),
    name: z.string(),
    image_url: z.string(),
    funding_token_address: z.string(),
    prize_percentage: z.number(),
    payout_structure: z.array(z.number()),
    interval: z.number().min(0),
    paused: z.boolean(),
    created_at: z.date(),
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
  }),
  output: z.object({
    contest_managers: z.array(ContestManager),
  }),
};

export const PauseContestManagerMetadata = {
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
