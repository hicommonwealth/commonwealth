/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/user_dashboard/user_dashboard_row.scss';

import {
  CWEvent,
  Label as ChainEventLabel,
  // CompoundEvents
} from 'chain-events/src';
import app from 'state';
import { DashboardActivityNotification } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { UserDashboardRowBottom } from './user_dashboard_row_bottom';
import { UserDashboardRowTop } from './user_dashboard_row_top';
import { UserDashboardChainEventRow } from './user_dashboard_chain_event_row';
import { getClasses } from '../../components/component_kit/helpers';

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

    const { chain_id, root_id, root_type } = JSON.parse(
      vnode.attrs.notification.notificationData
    );

    const path = getProposalUrlPath(root_type, root_id, false, chain_id);

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
