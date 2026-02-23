import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import useNecessaryEffect from '../../../client/scripts/hooks/useNecessaryEffect';

describe('useNecessaryEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('runs callback asynchronously', () => {
    const callback = vi.fn();

    renderHook(() => useNecessaryEffect(callback, []));
    expect(callback).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('clears pending callback when dependencies change quickly', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ dep }) => useNecessaryEffect(callback, [dep]),
      {
        initialProps: { dep: 1 },
      },
    );

    rerender({ dep: 2 });
    vi.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
