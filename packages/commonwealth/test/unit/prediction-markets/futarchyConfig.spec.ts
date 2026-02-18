import { describe, expect, test } from 'vitest';
import PredictionMarket from '../../../client/scripts/helpers/ContractHelpers/predictionMarket';

describe('predictionMarket address lookup', () => {
  test('getGovernorAddress returns null when not configured', () => {
    expect(PredictionMarket.getGovernorAddress(84532)).toBeNull();
    expect(PredictionMarket.getGovernorAddress(8453)).toBeNull();
  });

  test('isDeployConfigured is false when address is null', () => {
    expect(PredictionMarket.isDeployConfigured(84532)).toBe(false);
  });
});
