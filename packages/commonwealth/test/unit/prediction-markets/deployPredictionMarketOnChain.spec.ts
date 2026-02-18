import { describe, expect, test, vi } from 'vitest';
import PredictionMarket from '../../../client/scripts/helpers/ContractHelpers/predictionMarket';
import { deployPredictionMarketOnChain } from '../../../client/scripts/views/modals/PredictionMarket/deployPredictionMarketOnChain';

const params = {
  eth_chain_id: 84532,
  chain_rpc: 'https://sepolia.base.org',
  user_address: '0x1234567890123456789012345678901234567890',
  prompt: 'Will it pass?',
  collateral_address:
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
  duration_days: 14,
  resolution_threshold: 0.55,
  initial_liquidity: '0',
};

describe('deployPredictionMarketOnChain', () => {
  test('throws when Futarchy governor is not configured for chain', async () => {
    vi.spyOn(PredictionMarket, 'getGovernorAddress').mockReturnValue(null);
    await expect(deployPredictionMarketOnChain(params)).rejects.toThrow(
      /On-chain deployment is not configured/,
    );
    vi.restoreAllMocks();
  });

  test('throws when not configured', async () => {
    vi.spyOn(PredictionMarket, 'getGovernorAddress').mockReturnValue(null);
    await expect(deployPredictionMarketOnChain(params)).rejects.toThrow(
      'On-chain deployment is not configured for this chain',
    );
    vi.restoreAllMocks();
  });
});
