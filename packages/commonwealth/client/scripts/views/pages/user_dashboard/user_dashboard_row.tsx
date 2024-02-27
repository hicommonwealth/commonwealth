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
  isChainEventsRow?: boolean;
  label?: IEventLabel;
  isLoggedIn?: boolean;
};

export const UserDashboardRow = ({
  notification,
  showSkeleton,
  isChainEventsRow,
  label,
  isLoggedIn,
}: UserDashboardRowProps) => {
  if (showSkeleton) {
    if (isChainEventsRow) {
      return (
        <UserDashboardChainEventRow
          blockNumber={0}
          community={{} as any}
          label={{} as any}
          showSkeleton
        />
      );
    }

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

  const { commentCount, categoryId, threadId, blockNumber, chain, commenters } =
    notification;

  if (categoryId === 'chain-event') {
    const communityInfo = app.config.chains.getById(chain);

    return (
      <UserDashboardChainEventRow
        blockNumber={blockNumber}
        community={communityInfo}
        label={label}
      />
    );
  }

  const { chain_id, thread_id, root_type } = JSON.parse(
    notification.notificationData,
  );

  const path = getProposalUrlPath(root_type, thread_id, false, chain_id);

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
        communityId={chain_id}
        commentCount={commentCount}
        commenters={commenters}
        discussionLink={path}
        isLoggedIn={isLoggedIn}
      />
    </Link>
  );
};
