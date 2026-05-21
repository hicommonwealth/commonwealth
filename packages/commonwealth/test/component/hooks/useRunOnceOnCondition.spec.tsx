import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import useRunOnceOnCondition from '../../../client/scripts/shared/hooks/useRunOnceOnCondition';

describe('useRunOnceOnCondition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('invokes callback only once after condition becomes true', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ shouldRun }) => useRunOnceOnCondition({ callback, shouldRun }),
      {
        initialProps: { shouldRun: false },
      },
    );

    vi.runOnlyPendingTimers();
    expect(callback).not.toHaveBeenCalled();

    rerender({ shouldRun: true });
    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ shouldRun: true });
    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
