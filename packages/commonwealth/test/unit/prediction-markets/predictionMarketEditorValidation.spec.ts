import { describe, expect, test } from 'vitest';
import {
  DURATION_MAX,
  DURATION_MIN,
  isPredictionMarketFormValid,
  PROMPT_MAX_LENGTH,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
} from '../../../client/scripts/views/modals/predictionMarketEditorValidation';

const validAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

describe('isPredictionMarketFormValid', () => {
  const validInput = {
    prompt: 'Will the proposal pass?',
    durationDays: 14,
    resolutionThreshold: 55,
    collateralAddress: validAddress,
    initialLiquidity: '',
  };

  test('accepts valid form', () => {
    expect(isPredictionMarketFormValid(validInput)).toBe(true);
  });

  test('rejects empty prompt', () => {
    expect(
      isPredictionMarketFormValid({ ...validInput, prompt: '' }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({ ...validInput, prompt: '   ' }),
    ).toBe(false);
  });

  test('rejects prompt over max length', () => {
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        prompt: 'a'.repeat(PROMPT_MAX_LENGTH + 1),
      }),
    ).toBe(false);
  });

  test('accepts prompt at max length', () => {
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        prompt: 'a'.repeat(PROMPT_MAX_LENGTH),
      }),
    ).toBe(true);
  });

  test('enforces duration bounds', () => {
    expect(
      isPredictionMarketFormValid({ ...validInput, durationDays: DURATION_MIN - 1 }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({ ...validInput, durationDays: DURATION_MAX + 1 }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({ ...validInput, durationDays: DURATION_MIN }),
    ).toBe(true);
    expect(
      isPredictionMarketFormValid({ ...validInput, durationDays: DURATION_MAX }),
    ).toBe(true);
  });

  test('enforces resolution threshold bounds', () => {
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        resolutionThreshold: THRESHOLD_MIN - 1,
      }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        resolutionThreshold: THRESHOLD_MAX + 1,
      }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        resolutionThreshold: THRESHOLD_MIN,
      }),
    ).toBe(true);
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        resolutionThreshold: THRESHOLD_MAX,
      }),
    ).toBe(true);
  });

  test('rejects invalid collateral address', () => {
    expect(
      isPredictionMarketFormValid({ ...validInput, collateralAddress: '0x123' }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({
        ...validInput,
        collateralAddress: 'not-an-address',
      }),
    ).toBe(false);
  });

  test('rejects non-positive initial liquidity', () => {
    expect(
      isPredictionMarketFormValid({ ...validInput, initialLiquidity: '0' }),
    ).toBe(false);
    expect(
      isPredictionMarketFormValid({ ...validInput, initialLiquidity: '-1' }),
    ).toBe(false);
  });

  test('accepts positive decimal initial liquidity', () => {
    expect(
      isPredictionMarketFormValid({ ...validInput, initialLiquidity: '100' }),
    ).toBe(true);
    expect(
      isPredictionMarketFormValid({ ...validInput, initialLiquidity: '1.5' }),
    ).toBe(true);
  });
});
