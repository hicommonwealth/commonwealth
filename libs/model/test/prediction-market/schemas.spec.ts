import {
  CancelPredictionMarket,
  CreatePredictionMarket,
  DeployPredictionMarket,
  PredictionMarket,
  PredictionMarketPosition,
  PredictionMarketStatus,
  PredictionMarketTrade,
  PredictionMarketTradeAction,
  ProjectPredictionMarketResolution,
  ProjectPredictionMarketTrade,
  ResolvePredictionMarket,
} from '@hicommonwealth/schemas';
import { describe, expect, it } from 'vitest';

const largeAmount = '340282366920938463463374607431768211455';

const basePredictionMarket = {
  thread_id: 1,
  eth_chain_id: 8453,
  proposal_id: `0x${'a'.repeat(64)}`,
  market_id: `0x${'b'.repeat(64)}`,
  vault_address: '0x1111111111111111111111111111111111111111',
  governor_address: '0x2222222222222222222222222222222222222222',
  router_address: '0x3333333333333333333333333333333333333333',
  strategy_address: '0x4444444444444444444444444444444444444444',
  p_token_address: '0x5555555555555555555555555555555555555555',
  f_token_address: '0x6666666666666666666666666666666666666666',
  collateral_address: '0x7777777777777777777777777777777777777777',
  creator_address: '0x8888888888888888888888888888888888888888',
  prompt: 'Will the proposal pass? ',
  status: PredictionMarketStatus.Draft,
  winner: 0,
  duration: 86400,
  resolution_threshold: 0.55,
  start_time: new Date(),
  end_time: new Date(Date.now() + 1000 * 60 * 60),
  resolved_at: null,
  total_collateral: largeAmount,
  current_probability: 0.5,
};

const baseTrade = {
  prediction_market_id: 1,
  eth_chain_id: 8453,
  transaction_hash: `0x${'c'.repeat(64)}`,
  trader_address: '0x9999999999999999999999999999999999999999',
  action: PredictionMarketTradeAction.Mint,
  collateral_amount: largeAmount,
  p_token_amount: largeAmount,
  f_token_amount: largeAmount,
  timestamp: 1_700_000_000,
};

const basePosition = {
  prediction_market_id: 1,
  user_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  user_id: 42,
  p_token_balance: largeAmount,
  f_token_balance: largeAmount,
  total_collateral_in: largeAmount,
};

const baseCreateCommand = {
  thread_id: 1,
  prompt: 'Will the proposal pass?',
  collateral_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  duration: 86400,
  resolution_threshold: 0.6,
};

const baseDeployCommand = {
  prediction_market_id: 1,
  vault_address: '0x1111111111111111111111111111111111111111',
  governor_address: '0x2222222222222222222222222222222222222222',
  router_address: '0x3333333333333333333333333333333333333333',
  strategy_address: '0x4444444444444444444444444444444444444444',
  p_token_address: '0x5555555555555555555555555555555555555555',
  f_token_address: '0x6666666666666666666666666666666666666666',
  start_time: new Date(),
  end_time: new Date(Date.now() + 1000 * 60 * 60),
};

const baseResolveCommand = {
  prediction_market_id: 1,
  winner: 1,
};

const baseCancelCommand = {
  prediction_market_id: 1,
};

const baseProjectTradeCommand = {
  market_id: `0x${'d'.repeat(64)}`,
  eth_chain_id: 8453,
  tx_hash: `0x${'e'.repeat(64)}`,
  trader_address: '0xcccccccccccccccccccccccccccccccccccccccc',
  action: PredictionMarketTradeAction.Mint,
  collateral_amount: largeAmount,
  p_token_amount: largeAmount,
  f_token_amount: largeAmount,
  timestamp: 1_700_000_002,
};

const baseProjectResolutionCommand = {
  market_id: `0x${'f'.repeat(64)}`,
  winner: 2,
  resolved_at: new Date(),
};

describe('Prediction market schemas', () => {
  it('accepts a valid PredictionMarket payload', () => {
    const result = PredictionMarket.safeParse(basePredictionMarket);
    expect(result.success).toBe(true);
  });

  it('rejects invalid PredictionMarketStatus values', () => {
    const result = PredictionMarket.safeParse({
      ...basePredictionMarket,
      status: 'invalid-status',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid PredictionMarketTrade payloads with large amounts', () => {
    const result = PredictionMarketTrade.safeParse(baseTrade);
    expect(result.success).toBe(true);
  });

  it('rejects invalid PredictionMarketTradeAction values', () => {
    const result = PredictionMarketTrade.safeParse({
      ...baseTrade,
      action: 'invalid-action',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid PredictionMarketPosition payloads with large amounts', () => {
    const result = PredictionMarketPosition.safeParse(basePosition);
    expect(result.success).toBe(true);
  });

  it('rejects PredictionMarketPosition payloads missing required fields', () => {
    const result = PredictionMarketPosition.safeParse({
      prediction_market_id: 1,
    });
    expect(result.success).toBe(false);
  });

  it('validates CreatePredictionMarket command input', () => {
    const result = CreatePredictionMarket.input.safeParse(baseCreateCommand);
    expect(result.success).toBe(true);

    const invalid = CreatePredictionMarket.input.safeParse({
      ...baseCreateCommand,
      thread_id: undefined,
    });
    expect(invalid.success).toBe(false);
  });

  it('validates DeployPredictionMarket command input', () => {
    const result = DeployPredictionMarket.input.safeParse(baseDeployCommand);
    expect(result.success).toBe(true);

    const invalid = DeployPredictionMarket.input.safeParse({
      ...baseDeployCommand,
      end_time: undefined,
    });
    expect(invalid.success).toBe(false);
  });

  it('validates ResolvePredictionMarket command input', () => {
    const result = ResolvePredictionMarket.input.safeParse(baseResolveCommand);
    expect(result.success).toBe(true);

    const invalid = ResolvePredictionMarket.input.safeParse({
      ...baseResolveCommand,
      winner: 4,
    });
    expect(invalid.success).toBe(false);
  });

  it('validates CancelPredictionMarket command input', () => {
    const result = CancelPredictionMarket.input.safeParse(baseCancelCommand);
    expect(result.success).toBe(true);

    const invalid = CancelPredictionMarket.input.safeParse({});
    expect(invalid.success).toBe(false);
  });

  it('validates ProjectPredictionMarketTrade command input', () => {
    const result = ProjectPredictionMarketTrade.input.safeParse(
      baseProjectTradeCommand,
    );
    expect(result.success).toBe(true);

    const invalid = ProjectPredictionMarketTrade.input.safeParse({
      ...baseProjectTradeCommand,
      action: 'bad-action',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates ProjectPredictionMarketResolution command input', () => {
    const result = ProjectPredictionMarketResolution.input.safeParse(
      baseProjectResolutionCommand,
    );
    expect(result.success).toBe(true);

    const invalid = ProjectPredictionMarketResolution.input.safeParse({
      ...baseProjectResolutionCommand,
      market_id: '0x1234',
    });
    expect(invalid.success).toBe(false);
  });
});
