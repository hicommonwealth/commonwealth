import { ActionGroups } from '@hicommonwealth/shared';
import React from 'react';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import type Thread from '../../../models/Thread';
import type { ThreadFeaturedFilterTypes } from '../../../models/types';
import OverviewPage from '../overview';
import type { DiscussionsFeedVariant } from './discussionsPage.contracts';
import { DISCUSSIONS_GRID_COMPONENTS } from './DiscussionsPageGridComponents';
import { EmptyThreadsPlaceholder } from './EmptyThreadsPlaceholder';
import type { DiscussionsContestsData } from './RenderThreadCard';
import { RenderThreadCard } from './RenderThreadCard';

const renderEmptyPlaceholder = (
  isInitialLoading: boolean,
  isOnArchivePage: boolean,
) => (
  <EmptyThreadsPlaceholder
    isInitialLoading={isInitialLoading}
    isOnArchivePage={isOnArchivePage}
  />
);

type DiscussionsPageFeedProps = {
  actionGroups: ActionGroups;
  bypassGating: boolean;
  communityId: string;
  containerRef: React.RefObject<HTMLDivElement>;
  contestsData: DiscussionsContestsData;
  featuredFilter: ThreadFeaturedFilterTypes;
  fetchNextPage: () => Promise<unknown>;
  filteredThreads: Thread[];
  hasNextPage?: boolean;
  isInitialLoading: boolean;
  isOnArchivePage: boolean;
  topicId?: number;
  variant: DiscussionsFeedVariant;
  timelineFilter: {
    fromDate: string | null;
    toDate: string;
  };
};

export const DiscussionsPageFeed = ({
  actionGroups,
  bypassGating,
  communityId,
  containerRef,
  contestsData,
  featuredFilter,
  fetchNextPage,
  filteredThreads,
  hasNextPage,
  isInitialLoading,
  isOnArchivePage,
  topicId,
  timelineFilter,
  variant,
}: DiscussionsPageFeedProps) => {
  if (variant === 'overview') {
    return (
      <OverviewPage
        topicId={topicId}
        featuredFilter={featuredFilter}
        timelineFilter={timelineFilter}
      />
    );
  }

  if (variant === 'grid') {
    return (
      <VirtuosoGrid
        data={isInitialLoading ? [] : filteredThreads}
        customScrollParent={containerRef.current || undefined}
        components={DISCUSSIONS_GRID_COMPONENTS}
        itemContent={(_, thread) => (
          <RenderThreadCard
            thread={thread}
            hideThreadOptions={true}
            isCardView={true}
            hidePublishDate={true}
            hideTrendingTag={true}
            hideSpamTag={true}
            communityId={communityId}
            actionGroups={actionGroups}
            bypassGating={bypassGating}
            contestsData={contestsData}
          />
        )}
        endReached={() => {
          if (hasNextPage) {
            void fetchNextPage();
          }
        }}
        overscan={50}
      />
    );
  }

  return (
    <Virtuoso
      className="thread-list"
      style={{ height: '100%', width: '100%' }}
      data={isInitialLoading ? [] : filteredThreads}
      customScrollParent={containerRef.current || undefined}
      itemContent={(_, thread) => (
        <RenderThreadCard
          thread={thread}
          communityId={communityId}
          actionGroups={actionGroups}
          bypassGating={bypassGating}
          contestsData={contestsData}
        />
      )}
      endReached={() => {
        if (hasNextPage) {
          void fetchNextPage();
        }
      }}
      overscan={50}
      components={{
        EmptyPlaceholder: () =>
          renderEmptyPlaceholder(isInitialLoading, isOnArchivePage),
      }}
    />
  );
};
