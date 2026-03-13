export const DISCUSSIONS_VIEWS = {
  ALL: 'all',
  OVERVIEW: 'overview',
  CARDVIEW: 'cardview',
} as const;

export type DiscussionsView =
  (typeof DISCUSSIONS_VIEWS)[keyof typeof DISCUSSIONS_VIEWS];

export type DiscussionsFeedVariant = 'list' | 'overview' | 'grid';

type TopicIdentifierFromUrl = {
  topicId?: number | null;
  topicName?: string | null;
};

type TopicLike = {
  id?: number;
  name: string;
};

type TopicValidationDecision =
  | { type: 'none' }
  | { type: 'navigate'; replace: boolean; target: string };

type TopicValidationInput = {
  generateUrlPartForTopicIdentifiers: (
    topicId: number,
    topicName: string,
  ) => string;
  isLoadingTopics: boolean;
  pathname: string;
  sanitizeTopicName: (topicName: string) => string;
  tabStatus: string | null;
  topicIdentifiersFromURL?: TopicIdentifierFromUrl | null;
  topics?: TopicLike[] | null;
};

type FilterableThread = {
  archivedAt?: unknown;
  markedAsSpamAt?: unknown;
};

type FilterThreadsInput<T extends FilterableThread> = {
  includeArchivedThreads: boolean;
  includeSpamThreads: boolean;
  isOnArchivePage: boolean;
  threads: T[];
};

export const resolveDiscussionsViewFromTab = (
  tabStatus: string | null,
): DiscussionsView => {
  if (tabStatus === DISCUSSIONS_VIEWS.OVERVIEW) {
    return DISCUSSIONS_VIEWS.OVERVIEW;
  }

  if (tabStatus === DISCUSSIONS_VIEWS.CARDVIEW) {
    return DISCUSSIONS_VIEWS.CARDVIEW;
  }

  return DISCUSSIONS_VIEWS.ALL;
};

export const resolveDiscussionsFeedVariant = (
  selectedView: DiscussionsView,
): DiscussionsFeedVariant => {
  if (selectedView === DISCUSSIONS_VIEWS.OVERVIEW) {
    return 'overview';
  }

  if (selectedView === DISCUSSIONS_VIEWS.CARDVIEW) {
    return 'grid';
  }

  return 'list';
};

export const shouldFetchDiscussionsThreads = (
  selectedView: DiscussionsView,
): boolean =>
  selectedView === DISCUSSIONS_VIEWS.ALL ||
  selectedView === DISCUSSIONS_VIEWS.CARDVIEW;

export const shouldShowPrivateTopicBlock = ({
  bypassGating,
  isAllowedMember,
  isPrivateTopic,
}: {
  bypassGating?: boolean;
  isAllowedMember?: boolean;
  isPrivateTopic?: boolean;
}): boolean => !!isPrivateTopic && !isAllowedMember && !bypassGating;

export const filterVisibleThreads = <T extends FilterableThread>({
  includeArchivedThreads,
  includeSpamThreads,
  isOnArchivePage,
  threads,
}: FilterThreadsInput<T>): T[] =>
  threads.filter((thread) => {
    if (!includeSpamThreads && thread.markedAsSpamAt) {
      return false;
    }

    if (!isOnArchivePage && !includeArchivedThreads && thread.archivedAt) {
      return false;
    }

    if (isOnArchivePage && !thread.archivedAt) {
      return false;
    }

    return true;
  });

export const getDiscussionsTotalThreadCount = ({
  filteredThreadsLength,
  isOnArchivePage,
  totalResults,
}: {
  filteredThreadsLength: number;
  isOnArchivePage: boolean;
  totalResults?: number | null;
}): number => (isOnArchivePage ? filteredThreadsLength : totalResults || 0);

export const getTopicValidationNavigationDecision = ({
  generateUrlPartForTopicIdentifiers,
  isLoadingTopics,
  pathname,
  sanitizeTopicName,
  tabStatus,
  topicIdentifiersFromURL,
  topics,
}: TopicValidationInput): TopicValidationDecision => {
  if (
    isLoadingTopics ||
    !topicIdentifiersFromURL ||
    topicIdentifiersFromURL.topicName === 'archived' ||
    topicIdentifiersFromURL.topicName === 'overview' ||
    tabStatus === 'overview'
  ) {
    return { type: 'none' };
  }

  // Don't redirect if we're already on a concrete discussion route.
  if (pathname.includes('/discussion/')) {
    return { type: 'none' };
  }

  const validTopic = topics?.find(
    (topic) =>
      sanitizeTopicName(topic.name) === topicIdentifiersFromURL.topicName,
  );

  if (!validTopic || typeof validTopic.id !== 'number') {
    return {
      type: 'navigate',
      replace: false,
      target: '/discussions',
    };
  }

  if (
    !topicIdentifiersFromURL.topicId ||
    topicIdentifiersFromURL.topicId !== validTopic.id
  ) {
    return {
      type: 'navigate',
      replace: true,
      target: `/discussions/${encodeURI(
        generateUrlPartForTopicIdentifiers(validTopic.id, validTopic.name),
      )}`,
    };
  }

  return { type: 'none' };
};
