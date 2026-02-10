import { z } from 'zod';
import {
  PredictionMarket,
  PredictionMarketPosition,
  PredictionMarketTrade,
} from '../entities/prediction-market.schemas';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const PredictionMarketView = PredictionMarket.extend({
  id: PG_INT,
  start_time: z.coerce.date().or(z.string()).nullish(),
  end_time: z.coerce.date().or(z.string()).nullish(),
  resolved_at: z.coerce.date().or(z.string()).nullish(),
  created_at: z.coerce.date().or(z.string()).optional(),
  updated_at: z.coerce.date().or(z.string()).optional(),
});

export const GetPredictionMarkets = {
  input: PaginationParamsSchema.extend({
    thread_id: PG_INT,
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(PredictionMarketView),
  }),
};

export const GetPredictionMarketTrades = {
  input: PaginationParamsSchema.extend({
    prediction_market_id: PG_INT,
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(PredictionMarketTrade),
  }),
};

export const GetPredictionMarketPositions = {
  input: z.object({
    prediction_market_id: PG_INT,
  }),
  output: z.array(PredictionMarketPosition),
};
