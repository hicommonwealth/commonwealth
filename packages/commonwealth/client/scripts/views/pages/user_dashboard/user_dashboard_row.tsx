/* @jsx m */

import m from 'mithril';

import 'pages/user_dashboard/user_dashboard_row.scss';

import {
  CWEvent,
  Label as ChainEventLabel,
  // CompoundEvents
} from 'chain-events/src';
import app from 'state';
import { DashboardActivityNotification } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { UserDashboardRowBottom } from './user_dashboard_row_bottom';
import { UserDashboardRowTop } from './user_dashboard_row_top';

export class UserDashboardRow
  implements
    m.ClassComponent<{
      notification: DashboardActivityNotification;
      onListPage?: boolean;
    }>
{
  view(vnode) {
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

      const communityName =
        app.config.chains.getById(chain)?.name || 'Unknown chain';

      return (
        <div
          class="UserDashboardRow"
          onclick={() => {
            if (label.linkUrl) {
              m.route.set(label.linkUrl);
            }
            m.redraw();
          }}
          style={label.linkUrl ? 'cursor: pointer;' : ''}
        >
          <div class="activity-content">
            <CWCommunityAvatar community={chain} />
            <div class="new-comment">
              <span class="header">
                <span class="community-title">{label.heading}</span>
                <span class="comment-counts"> in </span>
                <span
                  class="community-link"
                  onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    m.route.set(`/${chain}`);
                  }}
                >
                  {communityName}
                </span>
                <span class="block-number"> Block {blockNumber}</span>
              </span>
              <div class="event-body">{label.label}</div>
            </div>
          </div>
        </div>
      );
    }

    const { chain_id, root_id, root_type } = JSON.parse(
      vnode.attrs.notification.notificationData
    );

    const path = getProposalUrlPath(root_type, root_id, false, chain_id);

    return (
      <div
        class="UserDashboardRow"
        onclick={() => {
          m.route.set(path);
          m.redraw();
        }}
        style={path ? 'cursor: pointer;' : ''}
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
