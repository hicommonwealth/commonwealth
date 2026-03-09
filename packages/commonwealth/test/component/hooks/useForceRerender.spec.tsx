import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, test } from 'vitest';
import useForceRerender from '../../../client/scripts/hooks/useForceRerender';

describe('useForceRerender', () => {
  test('returns stable callback and forces rerender', () => {
    const { result } = renderHook(() => {
      const forceRerender = useForceRerender();
      const renderCount = useRef(0);
      renderCount.current += 1;

      return {
        forceRerender,
        renderCount: renderCount.current,
      };
    });

    const firstCallback = result.current.forceRerender;
    expect(result.current.renderCount).toBe(1);

    act(() => {
      firstCallback();
    });

    expect(result.current.renderCount).toBe(2);
    expect(result.current.forceRerender).toBe(firstCallback);
  });
});
