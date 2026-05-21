import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useAnimation } from '../../../client/scripts/shared/hooks/useAnimation';

describe('useAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('transitions animation styles from initial to visible state', () => {
    const { result } = renderHook(() =>
      useAnimation({
        transitionDuration: '250ms',
        transformNumber: 'translateY(20px)',
      }),
    );

    expect(result.current.animationStyles).toEqual({
      opacity: 0,
      transform: 'translateY(20px)',
      transition: '250ms',
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.animationStyles).toEqual({
      opacity: 1,
      transform: 'translateY(0)',
      transition: '250ms',
    });
  });
});
