import type { IEventLabel } from 'chain/labelers/util';
import { getProposalUrlPath } from 'identifiers';
import 'pages/user_dashboard/user_dashboard_row.scss';
import React from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import type DashboardActivityNotification from '../../../models/DashboardActivityNotification';
import { getClasses } from '../../components/component_kit/helpers';
import { UserDashboardChainEventRow } from './user_dashboard_chain_event_row';
import { UserDashboardRowBottom } from './user_dashboard_row_bottom';
import { UserDashboardRowTop } from './user_dashboard_row_top';

type UserDashboardRowProps = {
  notification?: DashboardActivityNotification;
  showSkeleton?: boolean;
  label?: IEventLabel;
  isLoggedIn?: boolean;
};

export const UserDashboardRow = ({
  notification,
  showSkeleton,
  label,
  isLoggedIn,
}: UserDashboardRowProps) => {
  if (showSkeleton) {
    return (
      <div className="UserDashboardRow">
        <UserDashboardRowTop activityData="" category="" showSkeleton />
        <UserDashboardRowBottom
          threadId=""
          communityId=""
          commentCount={0}
          commenters={[]}
          showSkeleton
        />
      </div>
    );
  }

  const {
    // @ts-expect-error <StrictNullChecks/>
    commentCount,
    // @ts-expect-error <StrictNullChecks/>
    categoryId,
    // @ts-expect-error <StrictNullChecks/>
    threadId,
    // @ts-expect-error <StrictNullChecks/>
    blockNumber,
    // @ts-expect-error <StrictNullChecks/>
    communityId,
    // @ts-expect-error <StrictNullChecks/>
    commenters,
  } = notification;

  if (categoryId === 'chain-event') {
    const communityInfo = app.config.chains.getById(communityId);

    return (
      <UserDashboardChainEventRow
        blockNumber={blockNumber}
        community={communityInfo}
        // @ts-expect-error <StrictNullChecks/>
        label={label}
      />
    );
  }

  const { community_id, thread_id, root_type } = JSON.parse(
    // @ts-expect-error <StrictNullChecks/>
    notification.notificationData,
  );

  const path = getProposalUrlPath(root_type, thread_id, false, community_id);

  return (
    <Link
      className={getClasses<{ isLink?: boolean }>(
        { isLink: !!path },
        'UserDashboardRow',
      )}
      to={path}
    >
      <UserDashboardRowTop activityData={notification} category={categoryId} />
      <UserDashboardRowBottom
        threadId={threadId}
        communityId={community_id}
        commentCount={commentCount}
        commenters={commenters}
        discussionLink={path}
        isLoggedIn={isLoggedIn}
      />
    </Link>
  );
};
