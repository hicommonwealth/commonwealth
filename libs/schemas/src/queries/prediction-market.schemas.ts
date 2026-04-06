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
  market_volume: z.string().optional(),
  initial_liquidity: z.string().nullish(),
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

/** Row returned for discovery: market + community_id for thread link */
export const ActivePredictionMarketRow = PredictionMarketView.extend({
  community_id: z.string(),
});

export const GetActivePredictionMarkets = {
  input: z.object({
    community_id: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
  output: z.object({
    results: z.array(ActivePredictionMarketRow),
  }),
};

const PredictionMarketDiscoverSort = z.enum(['volume', 'recency']);
const PredictionMarketStatusFilter = z.enum([
  'draft',
  'active',
  'resolved',
  'cancelled',
]);

export const DiscoverPredictionMarkets = {
  input: PaginationParamsSchema.extend({
    community_id: z.string().optional(),
    statuses: z.array(PredictionMarketStatusFilter).optional().default([]),
    sort: PredictionMarketDiscoverSort.optional().default('recency'),
    search: z.string().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(
      PredictionMarketView.extend({
        community_id: z.string(),
      }),
    ),
  }),
};
