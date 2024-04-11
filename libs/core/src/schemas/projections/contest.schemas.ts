import { z } from 'zod';

export const ContestManager = z
  .object({
    communityId: z.string(),
    contest: z.string().describe('On-Chain contest manager address'),
    interval: z
      .number()
      .int()
      .positive()
      .describe('Recurring contest interval, 0 when one-off'),
    createdAt: z.date(),
  })
  .describe('On-Chain Contest Manager');

export const Contest = z
  .object({
    contest: z.string().describe('On-Chain contest manager address'),
    contestId: z
      .number()
      .int()
      .positive()
      .describe('On-Chain contest id, 0 when one-off'),
    startTime: z.date(),
    endTime: z.date(),
    winners: z
      .array(z.string())
      .describe('Ranked contest-winning creator addresses')
      .optional(),
  })
  .describe('On-Chain contest instance');

export const CONSTEST_ACTIONS = ['added', 'upvoted'] as const;

export const ContestAction = z
  .object({
    contest: z.string().describe('On-Chain contest manager address'),
    contestId: z
      .number()
      .int()
      .positive()
      .describe('On-Chain contest id, 0 when one-off'),
    contentId: z
      .number()
      .int()
      .positive()
      .describe('On-Chain content id, 0 when adding'),
    address: z.string().describe('Actor address'),
    action: z.enum(CONSTEST_ACTIONS).describe('Type of content action'),
    contentUrl: z.string().url().describe('Content url').optional(),
    weight: z
      .number()
      .int()
      .positive()
      .describe('Stake weight of address when action was recorded'),
    createdAt: z.date().describe('Date-time when action was recorded'),
  })
  .describe('On-Chain content related actions on contest instance');
