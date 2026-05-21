import { z } from 'zod';
import { PG_INT } from '../utils';

export const Markets = ['kalshi', 'polymarket'] as const;
export type Markets = (typeof Markets)[number];

export const MarketStatus = ['open', 'closed', 'settled'] as const;
export type MarketStatus = (typeof MarketStatus)[number];

export const Market = z.object({
  id: PG_INT.optional(),
  provider: z.enum(Markets),
  slug: z.string().describe('The provider-specific market id'),
  question: z.string().describe('The question being asked'),
  category: z.string().describe('The category of the question'),
  start_time: z.coerce.date().describe('The start time of the market'),
  end_time: z.coerce.date().describe('The end time of the market'),
  status: z.enum(MarketStatus).describe('The status of the market'),
  image_url: z.string().nullish().describe('The image URL for the market'),
  is_globally_featured: z
    .boolean()
    .optional()
    .describe('Whether this market is featured globally in explore page'),
  created_at: z.coerce
    .date()
    .optional()
    .describe('The creation time of the market'),
  updated_at: z.coerce
    .date()
    .optional()
    .describe('The last update time of the market'),
});
