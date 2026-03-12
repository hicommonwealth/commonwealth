import { describe, expect, test } from 'vitest';
import {
  resolveViewThreadRenderState,
  shouldShowCreateCommentComposer,
  shouldShowJoinCommunityBanner,
  shouldShowViewThreadGatedTopicBanner,
  shouldShowViewThreadSidebar,
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

  describe('shouldShowJoinCommunityBanner', () => {
    test('shows the join banner only for signed-out users when the banner flag is enabled', () => {
      expect(
        shouldShowJoinCommunityBanner({
          hasActiveAccount: false,
          isBannerVisible: true,
        }),
      ).toBe(true);

      expect(
        shouldShowJoinCommunityBanner({
          hasActiveAccount: true,
          isBannerVisible: true,
        }),
      ).toBe(false);

      expect(
        shouldShowJoinCommunityBanner({
          hasActiveAccount: false,
          isBannerVisible: false,
        }),
      ).toBe(false);
    });
  });

  describe('shouldShowViewThreadGatedTopicBanner', () => {
    test('shows the gated topic banner only for gated non-author thread views that are not dismissed', () => {
      expect(
        shouldShowViewThreadGatedTopicBanner({
          hideGatingBanner: false,
          isThreadAuthor: false,
          isTopicGated: true,
        }),
      ).toBe(true);

      expect(
        shouldShowViewThreadGatedTopicBanner({
          hideGatingBanner: true,
          isThreadAuthor: false,
          isTopicGated: true,
        }),
      ).toBe(false);

      expect(
        shouldShowViewThreadGatedTopicBanner({
          hideGatingBanner: false,
          isThreadAuthor: true,
          isTopicGated: true,
        }),
      ).toBe(false);
    });
  });

  describe('shouldShowViewThreadSidebar', () => {
    test('keeps the sidebar desktop-only during the EPIC-3 split', () => {
      expect(
        shouldShowViewThreadSidebar({
          isWindowSmallInclusive: false,
        }),
      ).toBe(true);

      expect(
        shouldShowViewThreadSidebar({
          isWindowSmallInclusive: true,
        }),
      ).toBe(false);
    });
  });
});
