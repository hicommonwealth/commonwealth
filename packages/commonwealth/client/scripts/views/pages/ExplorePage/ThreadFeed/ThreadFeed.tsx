import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import './ThreadFeed.scss';

import { MIN_CHARS_TO_SHOW_MORE, slugify } from '@hicommonwealth/shared';
import { extractImages } from 'helpers/feed';
import useTopicGating from 'hooks/useTopicGating';
import { getProposalUrlPath } from 'identifiers';
import { Thread } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'state/api/feeds/fetchUserActivity';
import useUserStore from 'state/ui/user';
import { CWButton } from '../../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../../components/component_kit/new_designs/CWModal';
import { CWTag } from '../../../components/component_kit/new_designs/CWTag';
import ThreadPreviewModal from '../../../modals/ThreadPreviewModal';
import { PageNotFound } from '../../404';
import { ThreadCard } from '../../discussions/ThreadCard';
import { UserDashboardRowSkeleton } from '../../user_dashboard/user_dashboard_row';
import { FiltersDrawer, ThreadFilters } from './FiltersDrawer/FiltersDrawer';

const DEFAULT_COUNT = 10;

type FeedThreadProps = {
  thread: Thread;
  onClick: () => void;
};

const FeedThread = ({ thread, onClick }: FeedThreadProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const discussionLink = getProposalUrlPath(
    thread?.slug,
    `${thread?.identifier}-${slugify(thread.title)}`,
    false,
    thread?.communityId,
  );

  const { data: community } = useGetCommunityByIdQuery({
    id: thread.communityId,
    enabled: !!thread.communityId,
  });

  const account = user.addresses?.find(
    (a) => a?.community?.id === thread?.communityId,
  );

  const { actionGroups, bypassGating } = useTopicGating({
    communityId: thread.communityId,
    userAddress: account?.address || '',
    apiEnabled: !!account?.address && !!thread.communityId,
    topicId: thread?.topic?.id || 0,
  });

  // edge case for deleted communities with orphaned posts
  if (!community) {
    return (
      <ThreadCard
        thread={thread}
        layoutType="community-first"
        showSkeleton
        actionGroups={actionGroups}
        bypassGating={bypassGating}
      />
    );
  }

  return (
    <ThreadCard
      thread={thread}
      canUpdateThread={false} // we dont want user to update thread from here, even if they have permissions
      onStageTagClick={() => {
        navigate(
          `${
            domain?.isCustomDomain ? '' : `/${thread.communityId}`
          }/discussions?stage=${thread.stage}`,
        );
      }}
      threadHref={discussionLink}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
      customStages={community.custom_stages}
      hideReactionButton
      hideUpvotesDrawer
      layoutType="community-first"
      onImageClick={onClick}
      maxChars={MIN_CHARS_TO_SHOW_MORE}
      cutoffLines={4}
      actionGroups={actionGroups}
      bypassGating={bypassGating}
    />
  );
};

type FeedProps = {
  query: typeof useFetchGlobalActivityQuery | typeof useFetchUserActivityQuery;
  defaultCount?: number;
  customScrollParent?: HTMLElement;
  searchText?: string;
  onClearSearch?: () => void;
  hideFilters?: boolean;
};

// eslint-disable-next-line react/no-multi-comp
export const ThreadFeed = ({
  query,
  customScrollParent,
  searchText,
  onClearSearch,
  hideFilters,
}: FeedProps) => {
  const [isThreadModalOpen, setIsThreadModalOpen] = useState<boolean>(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const user = useUserStore();

  const [filters, setFilters] = useState<ThreadFilters>({
    in_community_id: undefined,
  });

  const {
    data: feed,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isError,
  } = query({
    limit: 10,
    ...(filters.in_community_id && { community_id: filters.in_community_id }),
    ...(searchText?.trim() && { search: searchText.trim() }),
  });

  if (isLoading) {
    return (
      <div className="Feed">
        <Virtuoso
          customScrollParent={customScrollParent}
          totalCount={4}
          style={{ height: '100%' }}
          itemContent={(i) => <UserDashboardRowSkeleton key={i} />}
        />
      </div>
    );
  }

  if (isError) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  const allThreads =
    feed?.pages.flatMap((p) => p.results.map((t) => new Thread(t))) || [];

  const openModal = (thread: Thread) => {
    setSelectedThread(thread);
    setIsThreadModalOpen(true);
  };

  const closeModal = () => {
    setIsThreadModalOpen(false);
    setSelectedThread(null);
  };

  const removeCommunityFilter = () => {
    setFilters({
      ...filters,
      in_community_id: undefined,
    });
  };

  const selectedCommunity = user.communities?.find(
    (c) => c.id === (filters.in_community_id || ''),
  );

  return (
    <>
      {!hideFilters && (
        <div className="filters">
          <CWButton
            label="Filters"
            iconRight="funnelSimple"
            buttonType="secondary"
            onClick={() => setIsFilterDrawerOpen((isOpen) => !isOpen)}
          />
          {searchText?.trim() && (
            <CWTag
              label={`Search: ${searchText.trim()}`}
              type="filter"
              onCloseClick={onClearSearch}
            />
          )}
          {filters.in_community_id && selectedCommunity && (
            <CWTag
              label={`Community: ${selectedCommunity.name}`}
              type="filter"
              onCloseClick={removeCommunityFilter}
            />
          )}
          <FiltersDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(newFilters)}
          />
        </div>
      )}
      <div className="Feed">
        {!allThreads?.length ? (
          <div className="no-feed-message">No threads found!</div>
        ) : (
          <Virtuoso
            overscan={50}
            customScrollParent={customScrollParent}
            totalCount={allThreads?.length || DEFAULT_COUNT}
            data={allThreads || []}
            style={{ height: '100%' }}
            itemContent={(i, thread) => (
              <FeedThread
                key={i}
                thread={thread}
                onClick={() => openModal(thread)}
              />
            )}
            endReached={() => {
              hasNextPage && fetchNextPage().catch(console.error);
            }}
          />
        )}
        {selectedThread && (
          <CWModal
            size="large"
            content={
              <ThreadPreviewModal
                isThreadModalOpen={isThreadModalOpen}
                onClose={() => setIsThreadModalOpen(false)}
                images={extractImages(selectedThread?.body)}
                thread={selectedThread}
              />
            }
            onClose={closeModal}
            open={isThreadModalOpen}
          />
        )}
      </div>
    </>
  );
};
