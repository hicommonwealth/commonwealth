import React from 'react';

import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import { getProposalUrlPath } from 'identifiers';
import type DashboardActivityNotification from '../../../../models/DashboardActivityNotification';

import './UserDashboardRow.scss';
import app from 'state';
import { getClasses } from '../../../components/component_kit/helpers';
import { UserDashboardChainEventRow } from './UserDashboardChainEventRow';
import { UserDashboardRowBottom } from './UserDashboardRowBottom';
import { UserDashboardRowTop } from './UserDashboardRowTop';
import { navigateToPathInNewTab, useCommonNavigate } from 'navigation/helpers';

type UserDashboardRowProps = {
  notification: DashboardActivityNotification;
};

export const UserDashboardRow = (props: UserDashboardRowProps) => {
  const { notification } = props;
  const navigate = useCommonNavigate();

  const {
    commentCount,
    categoryId,
    threadId,
    blockNumber,
    eventNetwork,
    chain,
    commenters,
  } = notification;

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

  const { chain_id, thread_id, root_type, comment_id } = JSON.parse(
    notification.notificationData
  );

  const path = getProposalUrlPath(
    root_type,
    thread_id,
    app.activeChainId() ? true : false,
    chain_id
  );
  const handleClick = () => {
    if (path) {
      navigateToPathInNewTab({
        navigate,
        path,
        chain: chain_id,
      });
      // navigate(path);
    }
  };

  return (
    <div
      className={getClasses<{ isLink?: boolean }>(
        { isLink: !!path },
        'UserDashboardRow'
      )}
      onClick={handleClick}
    >
      <UserDashboardRowTop activityData={notification} category={categoryId} />
      <UserDashboardRowBottom
        threadId={threadId}
        commentId={comment_id}
        chainId={chain_id}
        commentCount={commentCount}
        commenters={commenters}
      />
    </div>
  );
};
