import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import useColorScheme from '../../../client/scripts/shared/hooks/useColorScheme';

describe('useColorScheme', () => {
  let onChangeListener: ((event: MediaQueryListEvent) => void) | undefined;

  beforeEach(() => {
    onChangeListener = undefined;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const matches = query === '(prefers-color-scheme: light)' ? false : false;
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, listener) => {
          if (event === 'change') {
            onChangeListener = listener as (event: MediaQueryListEvent) => void;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('reads initial light-mode preference from media query', () => {
    const { result } = renderHook(() => useColorScheme());

    expect(result.current).toBe(false);
  });

  test('updates preference when media query change event fires', () => {
    const { result } = renderHook(() => useColorScheme());

    act(() => {
      onChangeListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });
});
