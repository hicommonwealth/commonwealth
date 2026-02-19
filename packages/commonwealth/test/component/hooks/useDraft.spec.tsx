import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { useDraft } from '../../../client/scripts/hooks/useDraft';

describe('useDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves, restores, and clears draft data using versioned key', () => {
    const { result } = renderHook(() =>
      useDraft<{ title: string }>('thread-editor', { keyVersion: 'v-test' }),
    );

    result.current.saveDraft({ title: 'hello world' });
    expect(localStorage.getItem('cw-draft-v-test-thread-editor')).toBe(
      '{"title":"hello world"}',
    );

    expect(result.current.restoreDraft()).toEqual({ title: 'hello world' });

    result.current.clearDraft();
    expect(result.current.restoreDraft()).toBeNull();
  });

  test('does not persist payloads larger than 4MB', () => {
    const { result } = renderHook(() => useDraft<{ body: string }>('large'));
    const largePayload = { body: 'x'.repeat(1024 * 1024 * 5) };

    result.current.saveDraft(largePayload);

    expect(localStorage.getItem('cw-draft-v2-large')).toBeNull();
  });
});
