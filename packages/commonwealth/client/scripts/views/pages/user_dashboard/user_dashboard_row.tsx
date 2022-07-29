/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import { capitalize } from 'lodash';

import 'pages/user_dashboard/user_dashboard_row.scss';

import {
  CWEvent,
  Label as ChainEventLabel,
  // CompoundEvents
} from 'chain-events/src';
import app from 'state';
import { AddressInfo, DashboardActivityNotification } from 'models';
import User from 'views/components/widgets/user';
import { formatTimestamp } from 'helpers/index';
import { getProposalUrlPath } from 'identifiers';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { getCommentPreview } from './helpers';
import { UserDashboardRowBottom } from './user_dashboard_row_bottom';

const ActivityContent: m.Component<{
  activityData: any;
  category: string;
}> = {
  view: (vnode) => {
    const {
      created_at,
      chain_id,
      root_id,
      root_title,
      author_chain,
      author_address,
      comment_text,
      root_type,
    } = JSON.parse(vnode.attrs.activityData.notificationData);

    const { commentCount } = vnode.attrs.activityData;

    const numericalCommentCount = Number(commentCount);

    const communityName =
      app.config.chains.getById(chain_id)?.name || 'Unknown chain';

    let decodedTitle;

    try {
      decodedTitle = decodeURIComponent(root_title).trim();
    } catch {
      decodedTitle = root_title.trim();
    }

    const titleText =
      decodedTitle.length < 1
        ? `${capitalize(root_type)} ${root_id}`
        : decodedTitle.length > 50
        ? `${decodedTitle.slice(0, 47)}...`
        : decodedTitle;

    // Get Author of Notification
    const actorName = m(User, {
      user: new AddressInfo(
        null,
        author_address,
        author_chain ?? chain_id,
        null
      ),
      hideIdentityIcon: false,
      linkify: true,
      avatarSize: 16,
      onclick: (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        m.route.set(`/${author_chain}/account/${author_address}`);
      },
    });

    if (vnode.attrs.category === 'new-comment-creation') {
      // New Comment
      return m('.new-comment', [
        m('span.header', [
          actorName,
          m('span.comment-counts', [
            numericalCommentCount > 1
              ? [' and ', numericalCommentCount - 1, ' others']
              : '',
            ' commented on ',
          ]),
          m('span.community-title', [titleText]),
          m('span.comment-counts', [' in ']),
          m(
            'span.community-link',
            {
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                m.route.set(`/${chain_id}`);
              },
            },
            [communityName]
          ),
          m('span.comment-counts', [
            ` (${formatTimestamp(moment(created_at))})`,
          ]),
        ]),
        m('.comment-body-concat', [getCommentPreview(comment_text)]),
      ]);
    } else if (vnode.attrs.category === 'new-thread-creation') {
      return m('.new-comment', [
        m('span.header', [
          actorName,
          m('span.comment-counts', [' created new thread ']),
          m('span.community-title', [titleText]),
          m('span.comment-counts', [' in ']),
          m(
            'span.community-link',
            {
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                m.route.set(`/${chain_id}`);
              },
            },
            [communityName]
          ),
          m('span.comment-counts', [
            ` (${formatTimestamp(moment(created_at))})`,
          ]),
        ]),
      ]);
    }
    return actorName;
  },
};

export class UserDashboardRow
  implements
    m.ClassComponent<{
      notification: DashboardActivityNotification;
      onListPage?: boolean;
    }>
{
  Labeler: any;
  MolochTypes: any;
  SubstrateTypes: any;
  scrollOrStop: boolean;
  markingRead: boolean;

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
        m('.activity-content', [
          m(ActivityContent, {
            activityData: vnode.attrs.notification,
            category: categoryId,
          }),
        ]),
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
