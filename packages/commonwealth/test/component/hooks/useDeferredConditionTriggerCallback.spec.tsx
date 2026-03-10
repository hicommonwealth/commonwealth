import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import useDeferredConditionTriggerCallback from '../../../client/scripts/shared/hooks/useDeferredConditionTriggerCallback';

describe('useDeferredConditionTriggerCallback', () => {
  test('registers callback and triggers it once with preserved args', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDeferredConditionTriggerCallback({ shouldRunTrigger: false }),
    );

    act(() => {
      result.current.register({
        cb: callback,
        args: { id: 42 },
      });
      result.current.trigger();
      result.current.trigger();
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ id: 42 });
  });

  test('automatically triggers when shouldRunTrigger changes to true', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ shouldRunTrigger }) =>
        useDeferredConditionTriggerCallback({ shouldRunTrigger }),
      {
        initialProps: { shouldRunTrigger: false },
      },
    );

    act(() => {
      result.current.register({ cb: callback, args: 'payload' });
    });

    rerender({ shouldRunTrigger: true });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('payload');
  });
});
