import { z } from 'zod';
import { AuthContext } from '../context';
import { Market, MarketStatus, Markets } from '../entities/market.schemas';
import { PG_INT } from '../utils';

export const UpdateMarket = {
  input: z.object({
    id: PG_INT.describe('The id of the market to update'),
    provider: z.enum(Markets).optional().describe('The market provider'),
    slug: z.string().optional().describe('The provider-specific market id'),
    question: z.string().optional().describe('The question being asked'),
    category: z.string().optional().describe('The category of the question'),
    start_time: z.coerce
      .date()
      .optional()
      .describe('The start time of the market'),
    end_time: z.coerce.date().optional().describe('The end time of the market'),
    status: z
      .enum(MarketStatus)
      .optional()
      .describe('The status of the market'),
    image_url: z
      .string()
      .nullish()
      .optional()
      .describe('The image URL for the market'),
  }),
  output: Market,
  context: AuthContext,
};
