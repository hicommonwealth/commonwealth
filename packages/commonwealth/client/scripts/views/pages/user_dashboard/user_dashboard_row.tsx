/* @jsx jsx */
import React from 'react';

import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import { getProposalUrlPath } from 'identifiers';
import type { DashboardActivityNotification } from 'models';

import { ClassComponent, setRoute, redraw, jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import 'pages/user_dashboard/user_dashboard_row.scss';
import app from 'state';
import { getClasses } from '../../components/component_kit/helpers';
import { UserDashboardChainEventRow } from './user_dashboard_chain_event_row';
import { UserDashboardRowBottom } from './user_dashboard_row_bottom';
import { UserDashboardRowTop } from './user_dashboard_row_top';

type UserDashboardRowAttrs = {
  notification: DashboardActivityNotification;
};

export class UserDashboardRow extends ClassComponent<UserDashboardRowAttrs> {
  view(vnode: ResultNode<UserDashboardRowAttrs>) {
    const {
      commentCount,
      categoryId,
      threadId,
      blockNumber,
      eventNetwork,
      chain,
      commenters,
    } = vnode.attrs.notification;

    if (categoryId === 'chain-event') {
      const chainEvent: CWEvent = {
        blockNumber,
        network: eventNetwork,
        data: vnode.attrs.notification.eventData,
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

    const { chain_id, root_id, root_type, comment_id } = JSON.parse(
      vnode.attrs.notification.notificationData
    );

    const path = getProposalUrlPath(root_type, root_id, false, chain_id);

    return (
      <div
        className={getClasses<{ isLink?: boolean }>(
          { isLink: !!path },
          'UserDashboardRow'
        )}
        onClick={() => {
          setRoute(path);
          redraw();
        }}
      >
        <UserDashboardRowTop
          activityData={vnode.attrs.notification}
          category={categoryId}
        />
        <UserDashboardRowBottom
          threadId={threadId}
          commentId={comment_id}
          chainId={chain_id}
          commentCount={commentCount}
          commenters={commenters}
        />
      </div>
    );
  }
}
