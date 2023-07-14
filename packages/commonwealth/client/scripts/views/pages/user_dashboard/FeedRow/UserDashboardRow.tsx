import React, { useEffect, useState } from 'react';

import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import { getProposalUrlPath } from 'identifiers';
import type DashboardActivityNotification from '../../../../models/DashboardActivityNotification';
import Thread from 'models/Thread';

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
  const [thread, setThread] = useState<Thread>(null);
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchThread = async () => {
      const res = await app.threads.fetchThreadsFromId([thread_id], chain_id);
      setThread(res[0]);
    };

    if (categoryId === 'new-comment-creation') fetchThread();
    else if (categoryId === 'new-thread-creation') fetchThread();
  }, [chain_id, thread_id, comment_id]);

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
    </div>
  );
};
