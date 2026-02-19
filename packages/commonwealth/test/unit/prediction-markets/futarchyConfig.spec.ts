import { describe, expect, test, vi } from 'vitest';

// Avoid loading @polkadot/extension-dapp (requires window) via ContractBase -> web_wallets
vi.mock('../../../client/scripts/controllers/app/web_wallets', () => ({
  default: {
    get Instance() {
      return {
        availableWallets: () => [],
        getByName: () => null,
      };
    },
  },
}));

import PredictionMarket from '../../../client/scripts/helpers/ContractHelpers/predictionMarket';

describe('predictionMarket address lookup', () => {
  test('getGovernorAddress returns null when not configured', () => {
    // Use chain IDs that have no FutarchyGovernor in factoryContracts
    expect(PredictionMarket.getGovernorAddress(11155111)).toBeNull(); // Sepolia
    expect(PredictionMarket.getGovernorAddress(999999)).toBeNull(); // not in config
  });

  test('isDeployConfigured is false when address is null', () => {
    expect(PredictionMarket.isDeployConfigured(11155111)).toBe(false);
  });
});
