import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';

import { MIN_CHARS_TO_SHOW_MORE, slugify } from '@hicommonwealth/shared';
import useTopicGating from 'client/scripts/hooks/useTopicGating';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useFetchCustomDomainQuery } from 'client/scripts/state/api/configuration';
import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'client/scripts/state/api/feeds/fetchUserActivity';
import useGetActiveThreadsQuery from 'client/scripts/state/api/threads/getActiveThreads';
import useUserStore from 'client/scripts/state/ui/user';
import { VirtuosoGrid } from 'react-virtuoso';
import { EmptyThreadCard } from 'views/components/EmptyThreadCard/EmptyThreadCard';
import { PageNotFound } from '../../404';
import { ThreadCard } from '../../discussions/ThreadCard';
import './TrendingThreadList.scss';

const DEFAULT_COUNT = 3;

type TrendingThreadListProps = {
  query: typeof useFetchGlobalActivityQuery | typeof useFetchUserActivityQuery;
  defaultCount?: number;
  customScrollParent?: HTMLElement;
  communityIdFilter?: string;
  hideHeader?: boolean;
};

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
      hidePublishDate
      hideTrendingTag
      showOnlyThreadActionIcons
      communityHomeLayout
      actionGroups={actionGroups}
      bypassGating={bypassGating}
    />
  );
};

// eslint-disable-next-line react/no-multi-comp
const TrendingThreadList = ({
  query,
  customScrollParent,
  communityIdFilter,
  hideHeader,
}: TrendingThreadListProps) => {
  const communityId = app.activeChainId() || '';
  const navigate = useCommonNavigate();

  // TODO: we don't need to be fetching global activity feed when using this
  //  component from inside a community...
  const {
    data: feed,
    isLoading: feedIsLoading,
    isError: feedIsError,
  } = query({ limit: 3 });

  const {
    data: communityThreads,
    isLoading: communitythreadsLoading,
    isError: threadsError,
  } = useGetActiveThreadsQuery({
    community_id: communityId,
    enabled: !!communityId,
  });

  const isLoading = communityIdFilter ? communitythreadsLoading : feedIsLoading;
  const isError = communityIdFilter ? threadsError : feedIsError;

  if (isError) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allThreads;

  if (communityIdFilter) {
    allThreads = Array.isArray(communityThreads)
      ? communityThreads.filter((thread) => !thread.markedAsSpamAt).slice(0, 3)
      : [];
  } else if (feed?.pages) {
    allThreads = feed.pages
      .flatMap((page) => page.results || [])
      .filter((thread) => !thread.marked_as_spam_at);
  }
  const redirectPath = communityId ? '/discussions' : '/explore?tab=threads';

  if (!allThreads?.length) {
    return (
      <div className="TrendingThreadList">
        {!hideHeader && (
          <div className="heading-container">
            <CWText type="h2">Trending Threads</CWText>
            <div className="link-right" onClick={() => navigate(redirectPath)}>
              <CWText className="link">See all threads</CWText>
              <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
            </div>
          </div>
        )}
        <EmptyThreadCard />
      </div>
    );
  }

  return (
    <div className="TrendingThreadList">
      {!hideHeader && (
        <div className="heading-container">
          <CWText type="h2">Trending Threads</CWText>
          <div className="link-right" onClick={() => navigate(redirectPath)}>
            <CWText className="link">See all threads</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="content">
          <>
            <Skeleton height="300px" />
            <Skeleton height="300px" />
          </>
        </div>
      ) : (
        <div className="content">
          <VirtuosoGrid
            overscan={50}
            customScrollParent={customScrollParent}
            totalCount={allThreads?.length || DEFAULT_COUNT}
            data={allThreads || []}
            style={{ width: '100%', height: '100%' }}
            itemContent={(i, thread) => (
              <FeedThread key={i} thread={thread} onClick={() => {}} />
            )}
          />
        </div>
      )}
    </div>
  );
};

export default TrendingThreadList;
