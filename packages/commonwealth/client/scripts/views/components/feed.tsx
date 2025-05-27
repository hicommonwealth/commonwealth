import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import './feed.scss';

import { PageNotFound } from '../pages/404';
import { UserDashboardRowSkeleton } from '../pages/user_dashboard/user_dashboard_row';

import { MIN_CHARS_TO_SHOW_MORE, slugify } from '@hicommonwealth/shared';
import { extractImages } from 'client/scripts/helpers/feed';
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
import ThreadPreviewModal from '../modals/ThreadPreviewModal';
import { ThreadCard } from '../pages/discussions/ThreadCard';
import { CWModal } from './component_kit/new_designs/CWModal';

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
};

// eslint-disable-next-line react/no-multi-comp
export const Feed = ({ query, customScrollParent }: FeedProps) => {
  const {
    data: feed,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isError,
  } = query({ limit: 10 });

  const [isThreadModalOpen, setIsThreadModalOpen] = useState<boolean>(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);

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
  const allThreads = (
    feed?.pages ? feed.pages.flatMap((page) => page.results || []) : []
  ).map((t) => new Thread(t));

  if (!allThreads?.length) {
    return (
      <div className="Feed">
        <div className="no-feed-message">
          Join some communities to see Activity!
        </div>
      </div>
    );
  }

  const openModal = (thread: Thread) => {
    setSelectedThread(thread);
    setIsThreadModalOpen(true);
  };

  const closeModal = () => {
    setIsThreadModalOpen(false);
    setSelectedThread(null);
  };

  return (
    <div className="Feed">
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
  );
};
