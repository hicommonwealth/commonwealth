import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import { PageNotFound } from '../pages/404';
import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';

import { slugify } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'helpers/threads';
import { getProposalUrlPath } from 'identifiers';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ThreadKind, ThreadStage } from 'models/types';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useRefreshMembershipQuery } from 'state/api/groups';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { ThreadCard } from '../pages/discussions/ThreadCard';

type ActivityResponse = {
  thread: {
    id: number;
    body: string;
    plaintext: string;
    title: string;
    numberOfComments: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    archived_at?: string;
    locked_at?: string;
    read_only: boolean;
    has_poll: boolean;
    kind: ThreadKind;
    stage: ThreadStage;
    marked_as_spam_at?: string;
    discord_meta?: string;
    profile_id: number;
    profile_name: string;
    profile_avatar_url?: string;
    user_id: number;
    user_address: string;
    topic: Topic;
    community_id: string;
  };
  recentcomments?: [];
};

type FeedProps = {
  fetchData: () => Promise<any>;
  noFeedMessage: string;
  defaultCount?: number;
  customScrollParent?: HTMLElement;
  isChainEventsRow?: boolean;
};

const DEFAULT_COUNT = 10;

const FeedThread = ({ thread }: { thread: Thread }) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`,
    false,
    thread.communityId,
  );

  const chain = app.config.chains.getById(thread.communityId);

  const isAdmin =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin(undefined, thread.communityId);

  const account = user.addresses?.find(
    (a) => a?.community?.id === thread?.communityId,
  );

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: thread.communityId,
    // @ts-expect-error <StrictNullChecks/>
    address: account?.address,
    apiEnabled: !!account?.address,
  });

  const isTopicGated = !!(memberships || []).find((membership) =>
    membership.topicIds.includes(thread?.topic?.id),
  );

  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      membership.topicIds.includes(thread?.topic?.id) && membership.isAllowed,
  );

  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: Permissions.isCommunityMember(thread.communityId),
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
  });

  return (
    <ThreadCard
      thread={thread}
      canReact={!disabledActionsTooltipText}
      canComment={!disabledActionsTooltipText}
      canUpdateThread={false} // we dont want user to update thread from here, even if they have permissions
      onStageTagClick={() => {
        navigate(
          `${
            app.isCustomDomain() ? '' : `/${thread.communityId}`
          }/discussions?stage=${thread.stage}`,
        );
      }}
      threadHref={discussionLink}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
      disabledActionsTooltipText={disabledActionsTooltipText}
      customStages={chain?.customStages}
      hideReactionButton
      hideUpvotesDrawer
      layoutType="community-first"
    />
  );
};

// eslint-disable-next-line react/no-multi-comp
export const Feed = ({
  defaultCount,
  fetchData,
  noFeedMessage,
  customScrollParent,
}: FeedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<Thread[]>();
  const [currentCount, setCurrentCount] = useState<number>(
    defaultCount || DEFAULT_COUNT,
  );

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setCurrentCount(
        (prevState) => prevState + (defaultCount || DEFAULT_COUNT),
      );
    }, 500);
  }, [setCurrentCount, defaultCount]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetchData();
        const threads = (response?.result || []).map(
          (x: ActivityResponse) =>
            new Thread({
              id: x.thread.id,
              profile_id: x.thread.profile_id,
              // @ts-expect-error <StrictNullChecks/>
              avatar_url: x.thread.profile_avatar_url,
              profile_name: x.thread.profile_name,
              community_id: x.thread.community_id,
              kind: x.thread.kind,
              last_edited: x.thread.updated_at,
              // @ts-expect-error <StrictNullChecks/>
              marked_as_spam_at: x.thread.marked_as_spam_at,
              // @ts-expect-error <StrictNullChecks/>
              recentComments: x.recentcomments,
              stage: x.thread.stage,
              title: x.thread.title,
              created_at: x.thread.created_at,
              updated_at: x.thread.updated_at,
              body: x.thread.body,
              discord_meta: x.thread.discord_meta,
              numberOfComments: x.thread.numberOfComments,
              plaintext: x.thread.plaintext,
              read_only: x.thread.read_only,
              archived_at: x.thread.archived_at,
              // @ts-expect-error <StrictNullChecks/>
              locked_at: x.thread.locked_at,
              has_poll: x.thread.has_poll,
              Address: {
                address: x.thread.user_address,
                community_id: x.thread.community_id,
              },
              topic: x?.thread?.topic,
              // filler values
              // @ts-expect-error <StrictNullChecks/>
              version_history: null,
              last_commented_on: '',
              address_last_active: '',
              reaction_weights_sum: 0,
            }),
        );
        setData(threads);
      } catch (err) {
        setError(true);
      }
      setLoading(false);
    };

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="Feed">
        <Virtuoso
          customScrollParent={customScrollParent}
          totalCount={4}
          style={{ height: '100%' }}
          itemContent={(i) => <UserDashboardRow key={i} showSkeleton />}
        />
      </div>
    );
  }

  if (error) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  if (!data || data?.length === 0) {
    return (
      <div className="Feed">
        <div className="no-feed-message">{noFeedMessage}</div>
      </div>
    );
  }

  if (currentCount > data.length) setCurrentCount(data.length);

  return (
    <div className="Feed">
      <Virtuoso
        customScrollParent={customScrollParent}
        totalCount={currentCount}
        endReached={loadMore}
        style={{ height: '100%' }}
        itemContent={(i) => {
          return <FeedThread key={1} thread={data[i] as Thread} />;
        }}
      />
    </div>
  );
};
