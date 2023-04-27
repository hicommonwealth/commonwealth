import React from 'react';

import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import { getProposalUrlPath } from 'identifiers';
import type { DashboardActivityNotification } from 'models';

import 'pages/user_dashboard/user_dashboard_row.scss';
import app from 'state';
import { getClasses } from '../../components/component_kit/helpers';
import { UserDashboardChainEventRow } from './user_dashboard_chain_event_row';
import { UserDashboardRowBottom } from './user_dashboard_row_bottom';
import { UserDashboardRowTop } from './user_dashboard_row_top';
import { useCommonNavigate } from 'navigation/helpers';

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

  const path = getProposalUrlPath(root_type, thread_id, false, chain_id);

  return (
    <div
      className={getClasses<{ isLink?: boolean }>(
        { isLink: !!path },
        'UserDashboardRow'
      )}
      onClick={() => {
        navigate(path);
      }}
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
