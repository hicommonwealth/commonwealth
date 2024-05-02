import { z } from 'zod';
import { PG_INT } from '../utils.schemas';

export const CONTEST_ACTIONS = ['added', 'upvoted'] as const;

export const ContestAction = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    contest_id: PG_INT.describe('On-Chain contest id, 0 when one-off'),
    content_id: PG_INT.describe('On-Chain content id, 0 when adding'),
    actor_address: z.string(),
    action: z.enum(CONTEST_ACTIONS).describe('Type of content action'),
    content_url: z.string().url().describe('Content url').optional(),
    thread_id: PG_INT.optional().describe('Thread id mapped from content url'),
    thread_title: z.string().optional(),
    voting_power: PG_INT.positive().describe(
      'Voting power of address when action was recorded',
    ),
    created_at: z.date().describe('Date-time when action was recorded'),
  })
  .describe('On-Chain content related actions on contest instance');

export const Contest = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    contest_id: PG_INT.describe('On-Chain contest id, 0 when one-off'),
    start_time: z.date(),
    end_time: z.date(),
    winners: z
      .array(
        z.object({
          creator_address: z.string(),
          prize: PG_INT,
        }),
      )
      .describe('Contest winners, sorted from first to last')
      .optional(),
    actions: z.array(ContestAction).optional(),
  })
  .describe('On-Chain contest instance');
