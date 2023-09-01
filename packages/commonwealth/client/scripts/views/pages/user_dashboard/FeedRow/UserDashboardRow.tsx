import React from 'react';

import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import { getProposalUrlPath } from 'identifiers';
import { Link } from 'react-router-dom';
import type DashboardActivityNotification from '../../../../models/DashboardActivityNotification';

import './UserDashboardRow.scss';
import app from 'state';
import { useGetThreadsByIdQuery } from '../../../../state/api/threads/index';
import { getClasses } from '../../../components/component_kit/helpers';
import { UserDashboardChainEventRow } from './UserDashboardChainEventRow';
import { UserDashboardRowBottom } from './UserDashboardRowBottom';
import { UserDashboardRowTop } from './UserDashboardRowTop';

type UserDashboardRowProps = {
  notification?: DashboardActivityNotification;
  showSkeleton?: boolean;
  isChainEventsRow?: boolean;
};

export const UserDashboardRow = (props: UserDashboardRowProps) => {
  const { notification, showSkeleton, isChainEventsRow } = props;
  const {
    commentCount,
    categoryId,
    threadId,
    blockNumber,
    eventNetwork,
    chain,
    commenters,
  } = notification;

  const { chain_id, thread_id, root_type, comment_id } = JSON.parse(
    notification.notificationData
  );

  const { data: thread, isLoading } = useGetThreadsByIdQuery({
    chainId: chain_id,
    ids: [thread_id],
    apiCallEnabled: ['new-comment-creation', 'new-thread-creation'].includes(
      categoryId
    ),
  });

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

  if (categoryId === 'chain-event') {
    const chainEvent: CWEvent = {
      blockNumber,
      network: eventNetwork,
      data: notification.eventData,
    };

    const label = ChainEventLabel(chain, chainEvent);

    const chainInfo = app.config.chains.getById(chain);

    return (
      <UserDashboardChainEventRow
        blockNumber={blockNumber}
        chain={chainInfo}
        label={label}
      />
    );
  }

  const path = getProposalUrlPath(root_type, thread_id, false, chain_id);

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
