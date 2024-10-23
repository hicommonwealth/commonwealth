import { z } from 'zod';
import { PG_INT } from '../utils';

export const CONTEST_ACTIONS = ['added', 'upvoted'] as const;

export const ContestAction = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    contest_id: PG_INT.describe('On-Chain contest id, 0 when one-off'),
    content_id: PG_INT.describe('On-Chain content id, 0 when adding'),
    actor_address: z.string(),
    action: z.enum(CONTEST_ACTIONS).describe('Type of content action'),
    content_url: z.string().describe('Content url').nullish(),
    thread_id: PG_INT.nullish().describe('Thread id mapped from content url'),
    thread_title: z.string().nullish(),
    voting_power: z
      .string()
      .describe('Voting power of address when action was recorded'),
    created_at: z.coerce.date().describe('Date-time when action was recorded'),
  })
  .describe('On-Chain content related actions on contest instance');

export const ContestScore = z
  .array(
    z.object({
      creator_address: z.string(),
      content_id: z.string(),
      votes: PG_INT,
      prize: z.string(),
      tickerPrize: z.number().optional(),
    }),
  )
  .describe('Contest score, sorted from first to last');

export const Contest = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    contest_id: PG_INT.describe('On-Chain contest id, 0 when one-off'),
    start_time: z.date(),
    end_time: z.date(),
    score_updated_at: z.date().nullish(),
    score: ContestScore.nullish(),
    actions: z.array(ContestAction).nullish(),
  })
  .describe('On-Chain contest instance');
