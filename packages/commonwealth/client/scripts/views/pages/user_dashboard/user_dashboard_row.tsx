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

      return m(
        '.UserDashboardRow',
        {
          onclick: () => {
            if (label.linkUrl) {
              m.route.set(label.linkUrl);
            }
            m.redraw();
          },
          style: label.linkUrl ? 'cursor: pointer;' : '',
        },
        [
          m('.activity-content', [
            m(CWCommunityAvatar, {
              community: chain,
            }),
            m('.new-comment', [
              m('span.header', [
                m('span.community-title', [label.heading]),
                m('span.comment-counts', [' in ']),
                m(
                  'span.community-link',
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      m.route.set(`/${chain}`);
                    },
                  },
                  [communityName]
                ),
                m('span.block-number', [` Block ${blockNumber}`]),
              ]),
              m('.event-body', [label.label]),
            ]),
          ]),
        ]
      );
    }

    const { chain_id, root_id, root_type } = JSON.parse(
      vnode.attrs.notification.notificationData
    );

    const path = getProposalUrlPath(root_type, root_id, false, chain_id);

    return m(
      '.UserDashboardRow',
      {
        onclick: () => {
          m.route.set(path);
          m.redraw();
        },
        style: path ? 'cursor: pointer;' : '',
      },
      [
        <UserDashboardRowTop
          activityData={vnode.attrs.notification}
          category={categoryId}
        />,
        <UserDashboardRowBottom
          path={path}
          threadId={threadId}
          viewCount={viewCount}
          commentCount={commentCount}
          likeCount={likeCount}
        />,
      ]
    );
  }
}
