import { z } from 'zod';
import { ThreadContext } from '../context';
import { EVM_ADDRESS, PG_INT } from '../utils';

export const CreatePredictionMarket = {
  input: z.object({
    thread_id: PG_INT,
    prompt: z.string(),
    collateral_address: EVM_ADDRESS,
    duration: PG_INT,
    resolution_threshold: z.number(),
  }),
  output: z.boolean(),
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
  output: z.boolean(),
  context: ThreadContext,
};

export const ResolvePredictionMarket = {
  input: z.object({
    thread_id: PG_INT,
    prediction_market_id: PG_INT,
    winner: z.number().int().min(0).max(2),
  }),
  output: z.boolean(),
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
