import { z } from 'zod';

export const ContestManager = z
  .object({
    communityId: z.number().int(),
    address: z.string().describe('On-Chain contest manager address'),
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
    id: z.number().int().describe('On-Chain contest id'),
    contest: z.string().describe('On-Chain contest manager address'),
    startTime: z.date(),
    endTime: z.date(),
  })
  .describe('On-Chain contest instance');

export const CONSTEST_ACTIONS = ['added', 'upvoted'] as const;

export const ContestAction = z
  .object({
    id: z.number().int().describe('On-Chain contest id'),
    contentId: z.number().int().describe('On-Chain content id'),
    address: z.string().describe('Actor address'),
    action: z.enum(CONSTEST_ACTIONS).describe('Type of content action'),
    contentUrl: z.string().url().describe('Content url'),
    weight: z
      .number()
      .describe('Stake weight of address when action was recorded'),
    createdAt: z.date().describe('Date-time when action was recorded'),
    winners: z
      .array(z.string())
      .describe('Ranked contest-winning creator addresses')
      .optional(),
  })
  .describe('On-Chain content related actions on contest instance');
