import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import { ActivityComment, ActivityThread } from '@hicommonwealth/schemas';
import { slugify } from '@hicommonwealth/shared';
import { Thread, type RecentComment } from 'client/scripts/models/Thread';
import Topic from 'client/scripts/models/Topic';
import { ThreadKind, ThreadStage } from 'client/scripts/models/types';
import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'client/scripts/state/api/feeds/fetchUserActivity';
import { getThreadActionTooltipText } from 'helpers/threads';
import { getProposalUrlPath } from 'identifiers';
import { useCommonNavigate } from 'navigation/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import { useRefreshMembershipQuery } from 'state/api/groups';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { DashboardViews } from 'views/pages/user_dashboard';
import { z } from 'zod';
import { PageNotFound } from '../pages/404';
import { ThreadCard } from '../pages/discussions/ThreadCard';
import { UserDashboardRowSkeleton } from '../pages/user_dashboard/user_dashboard_row';

type FeedProps = {
  dashboardView: DashboardViews;
  noFeedMessage: string;
  defaultCount?: number;
  customScrollParent?: HTMLElement;
};

const DEFAULT_COUNT = 10;

const FeedThread = ({ thread }: { thread: Thread }) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const { data: domain } = useFetchCustomDomainQuery();

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`,
    false,
    thread.communityId,
  );

  const { data: community } = useGetCommunityByIdQuery({
    id: thread.communityId,
    enabled: !!thread.communityId,
  });

  const isAdmin =
    Permissions.isSiteAdmin() || Permissions.isCommunityAdmin(community);

  const account = user.addresses?.find(
    (a) => a?.community?.id === thread?.communityId,
  );

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: thread.communityId,
    // @ts-expect-error <StrictNullChecks/>
    address: account?.address,
    apiEnabled: !!account?.address && !!thread.communityId,
  });

  const isTopicGated = !!(memberships || []).find(
    (membership) =>
      thread?.topic?.id && membership.topicIds.includes(thread.topic.id),
  );

  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      thread?.topic?.id &&
      membership.topicIds.includes(thread.topic.id) &&
      membership.isAllowed,
  );

  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: Permissions.isCommunityMember(thread.communityId),
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
  });

  // edge case for deleted communities with orphaned posts
  if (!community) {
    return (
      <ThreadCard thread={thread} layoutType="community-first" showSkeleton />
    );
  }

  return (
    <ThreadCard
      thread={thread}
      canReact={!disabledActionsTooltipText}
      canComment={!disabledActionsTooltipText}
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
      disabledActionsTooltipText={disabledActionsTooltipText}
      customStages={community.custom_stages}
      hideReactionButton
      hideUpvotesDrawer
      layoutType="community-first"
    />
  );
};

// TODO: Reconcile client state with query schemas
function mapThread(thread: z.infer<typeof ActivityThread>): Thread {
  return new Thread({
    Address: {
      address: thread.user_address,
      community_id: thread.community_id,
    },
    title: thread.title,
    id: thread.id,
    created_at: thread.created_at ?? '',
    updated_at: thread.updated_at ?? thread.created_at ?? '',
    topic: new Topic({
      community_id: thread.community_id,
      id: thread.topic.id,
      name: thread.topic.name,
      description: thread.topic.description,
      featured_in_sidebar: false,
      featured_in_new_post: false,
      group_ids: [],
      active_contest_managers: [],
      total_threads: 0,
    }),
    kind: thread.kind as ThreadKind,
    stage: thread.stage as ThreadStage,
    ThreadVersionHistories: [],
    community_id: thread.community_id,
    read_only: thread.read_only,
    body: thread.body,
    locked_at: thread.locked_at ?? '',
    archived_at: thread.archived_at ?? '',
    has_poll: thread.has_poll ?? false,
    marked_as_spam_at: thread.marked_as_spam_at ?? '',
    discord_meta: thread.discord_meta,
    profile_name: thread.profile_name ?? '',
    avatar_url: thread.profile_avatar ?? '',
    user_id: thread.user_id,
    userId: thread.user_id,
    last_edited: thread.updated_at ?? '',
    last_commented_on: '',
    reaction_weights_sum: 0,
    address_last_active: '',
    ContestActions: [],
    numberOfComments: thread.number_of_comments,
    recentComments:
      thread.recent_comments?.map(
        (c: z.infer<typeof ActivityComment>) =>
          ({
            id: c.id,
            address: c.address,
            user_id: c.user_id ?? '',
            created_at: c.created_at,
            updated_at: c.updated_at,
            profile_avatar: c.profile_avatar,
            profile_name: c.profile_name,
            text: c.text,
          }) as RecentComment,
      ) ?? [],
  });
}

// eslint-disable-next-line react/no-multi-comp
export const Feed = ({
  dashboardView,
  noFeedMessage,
  customScrollParent,
}: FeedProps) => {
  const userFeed = useFetchUserActivityQuery();
  const globalFeed = useFetchGlobalActivityQuery();

  const feed = dashboardView === DashboardViews.Global ? globalFeed : userFeed;

  if (feed.isLoading) {
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

  if (feed.isError) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  if (feed.data.length === 0) {
    return (
      <div className="Feed">
        <div className="no-feed-message">{noFeedMessage}</div>
      </div>
    );
  }

  return (
    <div className="Feed">
      <Virtuoso
        customScrollParent={customScrollParent}
        totalCount={feed.data.length || DEFAULT_COUNT}
        style={{ height: '100%' }}
        itemContent={(i) => (
          <FeedThread key={i} thread={mapThread(feed.data[i])} />
        )}
      />
    </div>
  );
};
