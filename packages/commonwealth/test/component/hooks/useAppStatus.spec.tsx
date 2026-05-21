import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import useAppStatus from '../../../client/scripts/shared/hooks/useAppStatus';

const setNavigatorFields = ({
  userAgent,
  platform = 'Win32',
  maxTouchPoints = 0,
}: {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
}) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    value: platform,
  });
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    configurable: true,
    value: maxTouchPoints,
  });
};

describe('useAppStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('detects standalone iOS marketing page session', () => {
    window.history.pushState({}, '', '/');
    setNavigatorFields({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      return {
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });

    const { result } = renderHook(() => useAppStatus());

    expect(result.current.isAddedToHomeScreen).toBe(true);
    expect(result.current.isMarketingPage).toBe(true);
    expect(result.current.isIOS).toBe(true);
    expect(result.current.isAndroid).toBe(false);
  });

  test('detects Android app session off marketing page', () => {
    window.history.pushState({}, '', '/discussions/topic-1');
    setNavigatorFields({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
    });

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });

    const { result } = renderHook(() => useAppStatus());

    expect(result.current.isAddedToHomeScreen).toBe(false);
    expect(result.current.isMarketingPage).toBe(false);
    expect(result.current.isIOS).toBe(false);
    expect(result.current.isAndroid).toBe(true);
  });
});
