import { z } from 'zod';
import { ThreadContext } from '../context';
import {
  PredictionMarket,
  PredictionMarketTradeAction,
} from '../entities/prediction-market.schemas';
import {
  EVM_ADDRESS,
  EVM_BYTES,
  EVM_TRANSACTION_HASH,
  PG_ETH,
  PG_INT,
} from '../utils';

export const CreatePredictionMarket = {
  input: z.object({
    thread_id: PG_INT,
    prompt: z.string(),
    collateral_address: EVM_ADDRESS,
    duration: PG_INT,
    resolution_threshold: z.number(),
  }),
  output: PredictionMarket,
  context: ThreadContext,
};

export const DeployPredictionMarket = {
  input: z.object({
    thread_id: PG_INT,
    prediction_market_id: PG_INT,
    vault_address: EVM_ADDRESS,
    governor_address: EVM_ADDRESS,
    router_address: EVM_ADDRESS,
    strategy_address: EVM_ADDRESS,
    p_token_address: EVM_ADDRESS,
    f_token_address: EVM_ADDRESS,
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
  }),
  output: PredictionMarket,
  context: ThreadContext,
};

export const ResolvePredictionMarket = {
  input: z.object({
    thread_id: PG_INT,
    prediction_market_id: PG_INT,
    winner: z.number().int().min(0).max(2),
  }),
  output: PredictionMarket,
  context: ThreadContext,
};

export const CancelPredictionMarket = {
  input: z.object({
    thread_id: PG_INT,
    prediction_market_id: PG_INT,
  }),
  output: z.boolean(),
  context: ThreadContext,
};

export const ProjectPredictionMarketTrade = {
  input: z.object({
    market_id: EVM_BYTES,
    eth_chain_id: PG_INT,
    tx_hash: EVM_TRANSACTION_HASH,
    trader_address: EVM_ADDRESS,
    action: z.enum(
      Object.values(PredictionMarketTradeAction) as [
        PredictionMarketTradeAction,
        ...PredictionMarketTradeAction[],
      ],
    ),
    collateral_amount: PG_ETH,
    p_token_amount: PG_ETH,
    f_token_amount: PG_ETH,
    timestamp: PG_INT,
  }),
  output: z.object({}).optional(),
};

export const ProjectPredictionMarketResolution = {
  input: z.object({
    market_id: EVM_BYTES,
    winner: z.number().int().min(0).max(2),
    resolved_at: z.coerce.date(),
  }),
  output: z.object({}).optional(),
};
