import { z } from 'zod';

export const ContestManager = z
  .object({
    community_id: z.string(),
    contest_address: z.string().describe('On-Chain contest manager address'),
    interval: z
      .number()
      .int()
      .positive()
      .describe('Recurring contest interval, 0 when one-off'),
    created_at: z.date(),
  })
  .describe('On-Chain Contest Manager');

export const Contest = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    contest_id: z
      .number()
      .int()
      .positive()
      .describe('On-Chain contest id, 0 when one-off'),
    start_time: z.date(),
    end_time: z.date(),
    winners: z
      .array(z.string())
      .describe('Ranked contest-winning creator addresses')
      .optional(),
  })
  .describe('On-Chain contest instance');

export const CONSTEST_ACTIONS = ['added', 'upvoted'] as const;

export const ContestAction = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    contest_id: z
      .number()
      .int()
      .positive()
      .describe('On-Chain contest id, 0 when one-off'),
    content_id: z
      .number()
      .int()
      .positive()
      .describe('On-Chain content id, 0 when adding'),
    actor_address: z.string(),
    action: z.enum(CONSTEST_ACTIONS).describe('Type of content action'),
    content_url: z.string().url().describe('Content url').optional(),
    voting_power: z
      .number()
      .int()
      .positive()
      .describe('Voting power of address when action was recorded'),
    created_at: z.date().describe('Date-time when action was recorded'),
  })
  .describe('On-Chain content related actions on contest instance');
