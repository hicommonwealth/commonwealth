import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';

import { ActivityThread } from '@hicommonwealth/schemas';
import { MIN_CHARS_TO_SHOW_MORE, slugify } from '@hicommonwealth/shared';
import useTopicGating from 'client/scripts/hooks/useTopicGating';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import { ThreadKind, ThreadStage } from 'client/scripts/models/types';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useFetchCustomDomainQuery } from 'client/scripts/state/api/configuration';
import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'client/scripts/state/api/feeds/fetchUserActivity';
import { useFetchThreadsQuery } from 'client/scripts/state/api/threads';
import useUserStore from 'client/scripts/state/ui/user';
import { VirtuosoGrid } from 'react-virtuoso';
import { EmptyThreadCard } from 'views/components/EmptyThreadCard/EmptyThreadCard';
import { z } from 'zod';
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

// TODO: Reconcile client state with query schemas
function mapThread(thread: z.infer<typeof ActivityThread>): Thread {
  return new Thread({
    Address: {
      id: 0,
      address: thread.user_address,
      community_id: thread.community_id,
      ghost_address: false,
      is_banned: false,
      role: 'member',
    },
    title: thread.title,
    id: thread.id,
    created_at: thread.created_at ?? '',
    updated_at: thread.updated_at ?? thread.created_at ?? '',
    topic: {
      community_id: thread.community_id,
      id: thread.topic.id,
      name: thread.topic.name,
      description: thread.topic.description,
      created_at: '',
      featured_in_sidebar: false,
      featured_in_new_post: false,
      active_contest_managers: [],
      total_threads: 0,
      // If we expect to do tokenized stuff on the community homepage, modify this
      allow_tokenized_threads: false,
    },
    kind: thread.kind as ThreadKind,
    stage: thread.stage as ThreadStage,
    ThreadVersionHistories: [],
    community_id: thread.community_id,
    read_only: thread.read_only,
    body: thread.body,
    content_url: thread.content_url || null,
    locked_at: thread.locked_at ?? '',
    archived_at: thread.archived_at ?? '',
    has_poll: thread.has_poll ?? false,
    marked_as_spam_at: thread.marked_as_spam_at ?? '',
    discord_meta: thread.discord_meta!,
    profile_name: thread.profile_name ?? '',
    avatar_url: thread.profile_avatar ?? '',
    user_id: thread.user_id,
    user_tier: thread.user_tier,
    userId: thread.user_id,
    last_edited: thread.updated_at ?? '',
    last_commented_on: '',
    reaction_weights_sum: '0',
    address_last_active: '',
    address_id: 0,
    search: '',
    ContestActions: [],
    numberOfComments: thread.number_of_comments,
    recentComments:
      thread.recent_comments?.map((c) => ({
        id: c.id,
        address: c.address,
        user_id: c.user_id ?? 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
        profile_avatar: c.profile_avatar ?? '',
        profile_name: c.profile_name ?? '',
        body: c.body,
        content_url: c.content_url || null,
        thread_id: 0,
        address_id: 0,
        reaction_count: 0,
        comment_level: 0,
        reply_count: 0,
        community_id: thread.community_id,
      })) ?? [],
  });
}

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
    loading: communitythreadsLoading,
    isError: threadsError,
  } = useFetchThreadsQuery({
    queryType: 'active',
    communityId,
    limit: 3,
    apiEnabled: !!communityId,
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
      ? communityThreads
          .filter((thread) => !thread.marked_as_spam_at)
          .slice(0, 3)
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
              <FeedThread
                key={i}
                thread={communityIdFilter ? thread : mapThread(thread)}
                onClick={() => {}}
              />
            )}
          />
        </div>
      )}
    </div>
  );
};

export default TrendingThreadList;
