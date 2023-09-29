import React from 'react';

import type { IEventLabel } from 'chain-events/src';
import { getProposalUrlPath } from 'identifiers';
import { Link } from 'react-router-dom';
import type DashboardActivityNotification from '../../../models/DashboardActivityNotification';

import 'pages/user_dashboard/UserDashboardRow.scss';
import app from 'state';
import { useGetThreadsByIdQuery } from '../../../state/api/threads/index';
import { getClasses } from '../../components/component_kit/helpers';
import { UserDashboardChainEventRow } from './UserDashboardChainEventRow';
import { UserDashboardRowBottom } from './UserDashboardRowBottom';
import { UserDashboardRowTop } from './UserDashboardRowTop';

type UserDashboardRowProps = {
  notification: DashboardActivityNotification;
  showSkeleton?: boolean;
  isChainEventsRow?: boolean;
  label?: IEventLabel;
};

export const UserDashboardRow = (props: UserDashboardRowProps) => {
  const { notification, showSkeleton, isChainEventsRow, label } = props;

  if (showSkeleton) {
    if (isChainEventsRow) {
      return (
        <UserDashboardChainEventRow
          blockNumber={0}
          chain={{} as any}
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
          commentId=""
          chainId=""
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
    const chainInfo = app.config.chains.getById(chain);

    return (
      <UserDashboardChainEventRow
        blockNumber={blockNumber}
        chain={chainInfo}
        label={label}
      />
    );
  }

  const { chain_id, thread_id, root_type, comment_id } = JSON.parse(
    notification.notificationData
  );

  const path = getProposalUrlPath(root_type, thread_id, false, chain_id);

  const { data: thread } = useGetThreadsByIdQuery({
    chainId: chain_id,
    ids: [thread_id],
    apiCallEnabled:
      categoryId === 'new-comment-creation' ||
      categoryId === 'new-thread-creation',
  });

  return (
    <Link
      className={getClasses<{ isLink?: boolean }>(
        { isLink: !!path },
        'UserDashboardRow'
      )}
      to={path}
    >
      <UserDashboardRowTop
        activityData={notification}
        category={categoryId}
        threadText={thread?.plaintext}
        threadAuthor={thread?.author}
      />
      <UserDashboardRowBottom
        threadId={threadId}
        commentId={comment_id}
        chainId={chain_id}
        commentCount={commentCount}
        commenters={commenters}
        thread={thread}
      />
    </Link>
  );
};
