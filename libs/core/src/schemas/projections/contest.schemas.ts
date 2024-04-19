import { z } from 'zod';

export const ContestManager = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    community_id: z.string(),
    name: z.string(),
    image_url: z.string(),
    funding_token_address: z
      .string()
      .optional()
      .describe('Provided by admin on creation when stake funds are not used'),
    prize_percentage: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Percentage of pool used for prizes in recurring contests'),
    payout_structure: z
      .array(z.number())
      .describe(
        'Sorted array of percentages for prize, from first to last, adding up to 1',
      ),
    interval: z
      .number()
      .int()
      .positive()
      .describe('Recurring contest interval, 0 when one-off'),
    created_at: z.date(),
    paused: z
      .boolean()
      .optional()
      .describe('Flags when contest policy is paused by admin'),
  })
  .describe('On-Chain Contest Manager');

export const ContestTopic = z
  .object({
    contest_address: z.string(),
    topic_id: z.number().int(),
    created_at: z.date(),
  })
  .describe('X-Ref to topics in contest');

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
      .array(
        z.object({
          creator_address: z.string(),
          prize: z.number(),
        }),
      )
      .describe('Contest winners, sorted from first to last')
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
    thread_id: z
      .number()
      .int()
      .optional()
      .describe('Thread id mapped from content url'),
    voting_power: z
      .number()
      .int()
      .positive()
      .describe('Voting power of address when action was recorded'),
    created_at: z.date().describe('Date-time when action was recorded'),
  })
  .describe('On-Chain content related actions on contest instance');
