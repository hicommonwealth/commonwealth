import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import { PageNotFound } from '../pages/404';
import { UserDashboardRowSkeleton } from '../pages/user_dashboard/user_dashboard_row';

import { slugify } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'helpers/threads';
import { getProposalUrlPath } from 'identifiers';
import Thread from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'state/api/feeds';
import { useRefreshMembershipQuery } from 'state/api/groups';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { DashboardViews } from 'views/pages/user_dashboard';
import { ThreadCard } from '../pages/discussions/ThreadCard';

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
  dashboardView,
  noFeedMessage,
  customScrollParent,
}: FeedProps) => {
  const userActivityRes = useFetchUserActivityQuery({
    apiEnabled: DashboardViews.ForYou === dashboardView,
  });

  const globalActivityRes = useFetchGlobalActivityQuery({
    apiEnabled: DashboardViews.Global === dashboardView,
  });

  const queryData = (() => {
    if (DashboardViews.Global === dashboardView) return globalActivityRes;
    else return userActivityRes;
  })();

  if (queryData?.isLoading) {
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

  if (queryData?.isError) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  if (queryData?.data?.length === 0) {
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
        totalCount={queryData?.data?.length || DEFAULT_COUNT}
        style={{ height: '100%' }}
        itemContent={(i) => {
          return <FeedThread key={1} thread={queryData.data[i] as Thread} />;
        }}
      />
    </div>
  );
};
