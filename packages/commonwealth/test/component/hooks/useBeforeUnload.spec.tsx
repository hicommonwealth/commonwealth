import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import useBeforeUnload from '../../../client/scripts/hooks/useBeforeUnload';

describe('useBeforeUnload', () => {
  test('registers listener and blocks unload when enabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useBeforeUnload(true));
    const beforeUnloadHandler = addSpy.mock.calls.find(
      ([eventName]) => eventName === 'beforeunload',
    )?.[1] as ((event: BeforeUnloadEvent) => void) | undefined;

    expect(beforeUnloadHandler).toBeTypeOf('function');

    const event = new Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', {
      writable: true,
      value: undefined,
    });

    beforeUnloadHandler?.(event);
    expect(event.returnValue).toBe(true);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      'beforeunload',
      beforeUnloadHandler as EventListener,
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test('keeps unload untouched when disabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useBeforeUnload(false));
    const beforeUnloadHandler = addSpy.mock.calls.find(
      ([eventName]) => eventName === 'beforeunload',
    )?.[1] as ((event: BeforeUnloadEvent) => void) | undefined;

    const event = new Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', {
      writable: true,
      value: undefined,
    });

    beforeUnloadHandler?.(event);
    expect(event.returnValue).toBeUndefined();

    addSpy.mockRestore();
  });
});
