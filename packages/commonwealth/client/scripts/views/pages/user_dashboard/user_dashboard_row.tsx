/* @jsx m */

import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import ClassComponent from 'class_component';
import { getProposalUrlPath } from 'identifiers';
import m from 'mithril';
import type { DashboardActivityNotification } from 'models';

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
  view(vnode: m.Vnode<UserDashboardRowAttrs>) {
    const {
      likeCount,
      viewCount,
      commentCount,
      categoryId,
      threadId,
      blockNumber,
      eventNetwork,
      chain,
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

    const { chain_id, thread_id, root_type } = JSON.parse(
      vnode.attrs.notification.notificationData
    );

    const path = getProposalUrlPath(root_type, thread_id, false, chain_id);

    return (
      <div
        class={getClasses<{ isLink?: boolean }>(
          { isLink: !!path },
          'UserDashboardRow'
        )}
        onclick={() => {
          m.route.set(path);
          m.redraw();
        }}
      >
        <UserDashboardRowTop
          activityData={vnode.attrs.notification}
          category={categoryId}
        />
        <UserDashboardRowBottom
          path={path}
          threadId={threadId}
          viewCount={viewCount}
          commentCount={commentCount}
          likeCount={likeCount}
        />
      </div>
    );
  }
}
