import { z } from 'zod';
import {
  PredictionMarket,
  PredictionMarketPosition,
  PredictionMarketTrade,
} from '../entities/prediction-market.schemas';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

// PostgreSQL returns DECIMAL(78,0) as strings and DATE/TIMESTAMP as strings
// in raw SQL queries (and Sequelize DECIMAL columns). View schemas must
// override PG_ETH → z.string() and dates → z.coerce.date().or(z.string())
// to match what the database actually returns. See LaunchpadTradeView for
// the established pattern.

export const PredictionMarketView = PredictionMarket.extend({
  id: PG_INT,
  total_collateral: z.string(),
  start_time: z.coerce.date().or(z.string()).nullish(),
  end_time: z.coerce.date().or(z.string()).nullish(),
  resolved_at: z.coerce.date().or(z.string()).nullish(),
  created_at: z.coerce.date().or(z.string()).optional(),
  updated_at: z.coerce.date().or(z.string()).optional(),
});

export const PredictionMarketTradeView = PredictionMarketTrade.extend({
  collateral_amount: z.string(),
  p_token_amount: z.string(),
  f_token_amount: z.string(),
});

export const PredictionMarketPositionView = PredictionMarketPosition.extend({
  p_token_balance: z.string(),
  f_token_balance: z.string(),
  total_collateral_in: z.string(),
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
    results: z.array(PredictionMarketTradeView),
  }),
};

export const GetPredictionMarketPositions = {
  input: z.object({
    prediction_market_id: PG_INT,
  }),
  output: z.array(PredictionMarketPositionView),
};
