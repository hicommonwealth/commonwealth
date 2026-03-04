import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('state', () => ({
  __esModule: true,
  default: {
    chain: {
      meta: {
        name: 'Test Chain',
      },
    },
  },
}));

import useManageDocumentTitle from '../../../client/scripts/shared/hooks/useManageDocumentTitle';

describe('useManageDocumentTitle', () => {
  test('prefixes title with active chain name', () => {
    renderHook(() => useManageDocumentTitle('Discussions'));

    expect(document.title).toBe('Test Chain - Discussions');
  });

  test('uses details string when provided', () => {
    renderHook(() => useManageDocumentTitle('Discussions', 'Thread #1'));

    expect(document.title).toBe('Test Chain - Thread #1');
  });
});
