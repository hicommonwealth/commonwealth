import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockUseBrowserWindow } = vi.hoisted(() => ({
  mockUseBrowserWindow: vi.fn(),
}));

vi.mock('shared/hooks/useBrowserWindow', () => ({
  default: mockUseBrowserWindow,
}));

vi.mock('hooks/useBrowserWindow', () => ({
  default: mockUseBrowserWindow,
}));

vi.mock('react-device-detect', () => ({
  isMobile: true,
}));

import useWindowResize from '../../../client/scripts/hooks/useWindowResize';

describe('useWindowResize', () => {
  beforeEach(() => {
    mockUseBrowserWindow.mockReset();
  });

  test('toggles mobile view and updates menu for discussions on small screens', () => {
    window.history.pushState({}, '', '/discussions/topic-1');
    mockUseBrowserWindow.mockReturnValue({ isWindowSmallInclusive: true });
    const setMenu = vi.fn();

    const { result } = renderHook(() => useWindowResize({ setMenu }));

    expect(result.current.toggleMobileView).toBe(true);
    expect(setMenu).toHaveBeenCalledWith({
      name: 'default',
      isVisible: false,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(setMenu).toHaveBeenCalledTimes(2);
  });

  test('does not toggle mobile view for non-target routes', () => {
    window.history.pushState({}, '', '/governance');
    mockUseBrowserWindow.mockReturnValue({ isWindowSmallInclusive: true });
    const setMenu = vi.fn();

    const { result } = renderHook(() => useWindowResize({ setMenu }));

    expect(result.current.toggleMobileView).toBe(false);
  });
});
