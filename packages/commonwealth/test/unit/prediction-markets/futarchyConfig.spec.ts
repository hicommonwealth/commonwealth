import { describe, expect, test } from 'vitest';
import {
  getFutarchyGovernorAddress,
  isFutarchyDeployConfigured,
} from '../../../client/scripts/views/modals/futarchyConfig';

describe('futarchyConfig', () => {
  test('getFutarchyGovernorAddress returns null when no env or static config', () => {
    expect(getFutarchyGovernorAddress(84532)).toBeNull();
    expect(getFutarchyGovernorAddress(8453)).toBeNull();
  });

  test('isFutarchyDeployConfigured is false when address is null', () => {
    expect(isFutarchyDeployConfigured(84532)).toBe(false);
  });
});
