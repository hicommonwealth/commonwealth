import { z } from 'zod';
import {
  EVM_ADDRESS,
  EVM_BYTES,
  EVM_TRANSACTION_HASH,
  PG_ETH,
  PG_INT,
} from '../utils';

export enum PredictionMarketStatus {
  Draft = 'draft',
  Active = 'active',
  Resolved = 'resolved',
  Cancelled = 'cancelled',
}

export enum PredictionMarketTradeAction {
  Mint = 'mint',
  Merge = 'merge',
  SwapBuyPass = 'swap_buy_pass',
  SwapBuyFail = 'swap_buy_fail',
  Redeem = 'redeem',
}

const PredictionMarketStatusValues = Object.values(PredictionMarketStatus) as [
  PredictionMarketStatus,
  ...PredictionMarketStatus[],
];

const PredictionMarketTradeActionValues = Object.values(
  PredictionMarketTradeAction,
) as [PredictionMarketTradeAction, ...PredictionMarketTradeAction[]];

export const PredictionMarket = z.object({
  id: PG_INT.optional(),
  thread_id: PG_INT,
  eth_chain_id: PG_INT,
  proposal_id: EVM_BYTES.nullish(),
  market_id: EVM_BYTES.nullish(),
  vault_address: EVM_ADDRESS.nullish(),
  governor_address: EVM_ADDRESS.nullish(),
  router_address: EVM_ADDRESS.nullish(),
  strategy_address: EVM_ADDRESS.nullish(),
  p_token_address: EVM_ADDRESS.nullish(),
  f_token_address: EVM_ADDRESS.nullish(),
  collateral_address: EVM_ADDRESS,
  creator_address: EVM_ADDRESS,
  prompt: z.string(),
  status: z.enum(PredictionMarketStatusValues),
  winner: z.number().int().min(0).max(2).nullish(),
  duration: PG_INT,
  resolution_threshold: z.number(),
  start_time: z.coerce.date().nullish(),
  end_time: z.coerce.date().nullish(),
  resolved_at: z.coerce.date().nullish(),
  total_collateral: PG_ETH,
  current_probability: z.number().nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const PredictionMarketTrade = z.object({
  prediction_market_id: PG_INT,
  eth_chain_id: PG_INT,
  transaction_hash: EVM_TRANSACTION_HASH,
  trader_address: EVM_ADDRESS,
  action: z.enum(PredictionMarketTradeActionValues),
  collateral_amount: PG_ETH,
  p_token_amount: PG_ETH,
  f_token_amount: PG_ETH,
  timestamp: PG_INT,
});

export const PredictionMarketPosition = z.object({
  id: PG_INT.optional(),
  prediction_market_id: PG_INT,
  user_address: EVM_ADDRESS,
  user_id: PG_INT.nullish(),
  p_token_balance: PG_ETH,
  f_token_balance: PG_ETH,
  total_collateral_in: PG_ETH,
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
