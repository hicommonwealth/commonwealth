import { describe, expect, test } from 'vitest';
import {
  resolveViewThreadRenderState,
  shouldShowCreateCommentComposer,
} from '../../../client/scripts/views/pages/view_thread/viewThreadPage.contracts';

describe('ViewThreadPage contracts', () => {
  describe('resolveViewThreadRenderState', () => {
    test('returns fetch_error for invalid identifiers or fetch failures', () => {
      expect(
        resolveViewThreadRenderState({
          identifier: 123,
          fetchThreadError: null,
          hasChainMeta: true,
          isLoading: false,
          isLoadingContentBody: false,
          contentUrlBodyToFetch: null,
          thread: null,
          activeChainId: 'cosmos',
        }),
      ).toBe('fetch_error');

      expect(
        resolveViewThreadRenderState({
          identifier: '123-thread',
          fetchThreadError: { message: 'Boom' },
          hasChainMeta: true,
          isLoading: false,
          isLoadingContentBody: false,
          contentUrlBodyToFetch: null,
          thread: null,
          activeChainId: 'cosmos',
        }),
      ).toBe('fetch_error');
    });

    test('returns loading while chain meta or content body are still loading', () => {
      expect(
        resolveViewThreadRenderState({
          identifier: '123-thread',
          fetchThreadError: null,
          hasChainMeta: false,
          isLoading: false,
          isLoadingContentBody: false,
          contentUrlBodyToFetch: null,
          thread: { communityId: 'cosmos' },
          activeChainId: 'cosmos',
        }),
      ).toBe('loading');

      expect(
        resolveViewThreadRenderState({
          identifier: '123-thread',
          fetchThreadError: null,
          hasChainMeta: true,
          isLoading: false,
          isLoadingContentBody: true,
          contentUrlBodyToFetch: 'https://content.example/thread-body',
          thread: { communityId: 'cosmos' },
          activeChainId: 'cosmos',
        }),
      ).toBe('loading');
    });

    test('returns thread_not_found for missing/mismatched thread ownership', () => {
      expect(
        resolveViewThreadRenderState({
          identifier: '123-thread',
          fetchThreadError: null,
          hasChainMeta: true,
          isLoading: false,
          isLoadingContentBody: false,
          contentUrlBodyToFetch: null,
          thread: null,
          activeChainId: 'cosmos',
        }),
      ).toBe('thread_not_found');

      expect(
        resolveViewThreadRenderState({
          identifier: '123-thread',
          fetchThreadError: null,
          hasChainMeta: true,
          isLoading: false,
          isLoadingContentBody: false,
          contentUrlBodyToFetch: null,
          thread: { communityId: 'ethereum' },
          activeChainId: 'cosmos',
        }),
      ).toBe('thread_not_found');
    });

    test('returns ready when thread is loaded and belongs to the active community', () => {
      expect(
        resolveViewThreadRenderState({
          identifier: '123-thread',
          fetchThreadError: null,
          hasChainMeta: true,
          isLoading: false,
          isLoadingContentBody: false,
          contentUrlBodyToFetch: null,
          thread: { communityId: 'cosmos' },
          activeChainId: 'cosmos',
        }),
      ).toBe('ready');
    });
  });

  describe('shouldShowCreateCommentComposer', () => {
    test('shows composer only for editable thread views with logged-in users', () => {
      expect(
        shouldShowCreateCommentComposer({
          thread: { readOnly: false },
          fromDiscordBot: false,
          isGloballyEditing: false,
          isUserLoggedIn: true,
        }),
      ).toBe(true);

      expect(
        shouldShowCreateCommentComposer({
          thread: { readOnly: true },
          fromDiscordBot: false,
          isGloballyEditing: false,
          isUserLoggedIn: true,
        }),
      ).toBe(false);

      expect(
        shouldShowCreateCommentComposer({
          thread: { readOnly: false },
          fromDiscordBot: true,
          isGloballyEditing: false,
          isUserLoggedIn: true,
        }),
      ).toBe(false);

      expect(
        shouldShowCreateCommentComposer({
          thread: { readOnly: false },
          fromDiscordBot: false,
          isGloballyEditing: true,
          isUserLoggedIn: true,
        }),
      ).toBe(false);
    });
  });
});
