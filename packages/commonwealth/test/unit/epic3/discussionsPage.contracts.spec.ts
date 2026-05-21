import { describe, expect, test } from 'vitest';
import {
  DISCUSSIONS_VIEWS,
  filterVisibleThreads,
  getTopicValidationNavigationDecision,
  resolveDiscussionsViewFromTab,
  shouldShowPrivateTopicBlock,
} from '../../../client/scripts/views/pages/discussions/discussionsPage.contracts';

describe('DiscussionsPage contracts', () => {
  describe('resolveDiscussionsViewFromTab', () => {
    test('defaults to all view when query tab is absent', () => {
      expect(resolveDiscussionsViewFromTab(null)).toBe(DISCUSSIONS_VIEWS.ALL);
    });

    test('resolves overview and cardview tabs', () => {
      expect(resolveDiscussionsViewFromTab('overview')).toBe(
        DISCUSSIONS_VIEWS.OVERVIEW,
      );
      expect(resolveDiscussionsViewFromTab('cardview')).toBe(
        DISCUSSIONS_VIEWS.CARDVIEW,
      );
    });
  });

  describe('shouldShowPrivateTopicBlock', () => {
    test('returns true only for private topics without member access and no bypass', () => {
      expect(
        shouldShowPrivateTopicBlock({
          isPrivateTopic: true,
          isAllowedMember: false,
          bypassGating: false,
        }),
      ).toBe(true);

      expect(
        shouldShowPrivateTopicBlock({
          isPrivateTopic: true,
          isAllowedMember: true,
          bypassGating: false,
        }),
      ).toBe(false);

      expect(
        shouldShowPrivateTopicBlock({
          isPrivateTopic: false,
          isAllowedMember: false,
          bypassGating: false,
        }),
      ).toBe(false);
    });
  });

  describe('filterVisibleThreads', () => {
    const baseThreads = [
      { id: 1, markedAsSpamAt: null, archivedAt: null },
      { id: 2, markedAsSpamAt: '2025-01-01T00:00:00.000Z', archivedAt: null },
      { id: 3, markedAsSpamAt: null, archivedAt: '2025-01-01T00:00:00.000Z' },
    ];

    test('hides spam and archived threads by default on discussions page', () => {
      const filtered = filterVisibleThreads({
        threads: baseThreads,
        includeSpamThreads: false,
        includeArchivedThreads: false,
        isOnArchivePage: false,
      });

      expect(filtered.map((thread) => thread.id)).toEqual([1]);
    });

    test('shows only archived threads on archive page', () => {
      const filtered = filterVisibleThreads({
        threads: baseThreads,
        includeSpamThreads: true,
        includeArchivedThreads: true,
        isOnArchivePage: true,
      });

      expect(filtered.map((thread) => thread.id)).toEqual([3]);
    });
  });

  describe('getTopicValidationNavigationDecision', () => {
    const sanitizeTopicName = (topicName: string) =>
      topicName.toLowerCase().replace(/\s+/g, '-');
    const generateUrlPartForTopicIdentifiers = (
      topicId: number,
      topicName: string,
    ) => `${topicId}-${sanitizeTopicName(topicName)}`;

    test('redirects malformed topic names to /discussions', () => {
      const decision = getTopicValidationNavigationDecision({
        isLoadingTopics: false,
        pathname: '/discussions/123-unknown-topic',
        tabStatus: null,
        topics: [{ id: 42, name: 'General' }],
        topicIdentifiersFromURL: { topicId: 123, topicName: 'unknown-topic' },
        sanitizeTopicName,
        generateUrlPartForTopicIdentifiers,
      });

      expect(decision).toEqual({
        type: 'navigate',
        replace: false,
        target: '/discussions',
      });
    });

    test('normalizes topic identifier when name is valid but id is stale', () => {
      const decision = getTopicValidationNavigationDecision({
        isLoadingTopics: false,
        pathname: '/discussions/1-general',
        tabStatus: null,
        topics: [{ id: 42, name: 'General' }],
        topicIdentifiersFromURL: { topicId: 1, topicName: 'general' },
        sanitizeTopicName,
        generateUrlPartForTopicIdentifiers,
      });

      expect(decision).toEqual({
        type: 'navigate',
        replace: true,
        target: '/discussions/42-general',
      });
    });

    test('skips redirects when already inside a concrete discussion route', () => {
      const decision = getTopicValidationNavigationDecision({
        isLoadingTopics: false,
        pathname: '/discussion/777',
        tabStatus: null,
        topics: [{ id: 42, name: 'General' }],
        topicIdentifiersFromURL: { topicId: 42, topicName: 'general' },
        sanitizeTopicName,
        generateUrlPartForTopicIdentifiers,
      });

      expect(decision).toEqual({ type: 'none' });
    });
  });
});
