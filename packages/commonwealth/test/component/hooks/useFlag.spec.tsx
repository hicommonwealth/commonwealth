import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { useBooleanFlagValueMock } = vi.hoisted(() => ({
  useBooleanFlagValueMock: vi.fn(),
}));

vi.mock('@openfeature/react-sdk', () => ({
  useBooleanFlagValue: useBooleanFlagValueMock,
}));

import { useFlag } from '../../../client/scripts/hooks/useFlag';

describe('useFlag', () => {
  beforeEach(() => {
    useBooleanFlagValueMock.mockReset();
  });

  test('returns SDK boolean value and calls OpenFeature with stable options', () => {
    useBooleanFlagValueMock.mockReturnValue(true);

    const { result } = renderHook(() => useFlag('markets'));

    expect(result.current).toBe(true);
    expect(useBooleanFlagValueMock).toHaveBeenCalledWith('markets', false, {
      updateOnConfigurationChanged: false,
    });
  });

  test('falls back to false when SDK returns nullish value', () => {
    useBooleanFlagValueMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useFlag('governancePage'));

    expect(result.current).toBe(false);
  });
});
