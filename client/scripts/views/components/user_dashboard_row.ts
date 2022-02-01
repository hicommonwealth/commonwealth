import 'components/user_dashboard_row.scss';

import { Icon, Icons, Button, MenuItem, PopoverMenu } from 'construct-ui';
import _ from 'lodash';
import m from 'mithril';
import moment from 'moment';
import {
  SubstrateEvents,
  MolochEvents,
  IEventLabel,
  SupportedNetwork,
  CompoundEvents,
  AaveEvents,
  // CompoundEvents
} from '@commonwealth/chain-events';

import app from 'state';
import { NotificationCategories, ProposalType } from 'types';
import { Notification, AddressInfo } from 'models';
import { link, pluralize } from 'helpers';
import { IPostNotificationData } from 'shared/types';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';

import { getProposalUrl, getCommunityUrl } from '../../../../shared/utils';
import { CWEngagementButton } from './component_kit/cw_engagement_button';

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    if (!doc.ops) throw new Error();
    decoded_comment_text = m(QuillFormattedText, {
      doc,
      hideFormatting: true,
      collapse: true,
    });
  } catch (e) {
    let doc = decodeURIComponent(comment_text);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decoded_comment_text = m(MarkdownFormattedText, {
      doc: doc.slice(0, 140),
      hideFormatting: true,
      collapse: true,
    });
  }
  return decoded_comment_text;
};

const getAgo = (time) => {
  const y = moment(Date.now()).diff(time, 'years');
  if (y > 0) return `${y}y`;
  const m = moment(Date.now()).diff(time, 'months');
  if (m > 0) return `${m}mo`;
  const d = moment(Date.now()).diff(time, 'days');
  if (d > 0) return `${d}d`;
  const h = moment(Date.now()).diff(time, 'hours');
  if (h > 0) return `${h}h`;
  const mi = moment(Date.now()).diff(time, 'minutes');
  if (mi > 0) return `${mi}m`;
  const s = moment(Date.now()).diff(time, 'seconds');
  return s > 0 ? `${s}s` : 'now';
};

const getNotificationFields = (category, data: IPostNotificationData) => {
  const {
    created_at,
    root_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    parent_comment_text,
    chain_id,
    author_address,
    author_chain,
    like_count,
    comment_count,
    view_count,
  } = data;

  const community_name = app.config.chains.getById(chain_id)?.name || 'Unknown chain';
  let notificationHeader;
  let notificationBody;
  const decoded_title = decodeURIComponent(root_title).trim();

  // Extract Comment Text
  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.OffchainThread) {
    notificationBody = null;
  }

  // Get Author of Notification
  const actorName = m(User, {
    user: new AddressInfo(null, author_address, author_chain, null),
    hideIdentityIcon: false,
    linkify: true,
    onclick: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      m.route.set(`/${author_chain}/account/${author_address}`);
    },
  });

  // Get creation time 
  const ago = getAgo(created_at);

  // Conditionals for various Notification categories
  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [
        actorName,
        ' commented on ',
        m('span.commented-obj', decoded_title),
        '  ',
        m('span.comment-ago', ago),
      ])
      : m('span', [
        actorName,
        ' responded in ',
        m('span.commented-obj', decoded_title),
        '  ',
        m('span.comment-ago', ago),
      ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      ' created a new thread ',
      m('span.commented-obj', decoded_title),
      '  ',
      m('span.comment-ago', ago),
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = m('span', [
      actorName,
      ' mentioned you in ',
      m('span.commented-obj', decoded_title),
      '  ',
      m('span.comment-ago', ago),
    ]);
  } else if (category === `${NotificationCategories.NewCollaboration}`) {
    notificationHeader = m('span', [
      actorName,
      ' added you as a collaborator on ',
      m('span.commented-obj', decoded_title),
      '  ',
      m('span.comment-ago', ago),
    ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id
      ? m('span', [
        actorName,
        ' liked the post ',
        m('span.commented-obj', decoded_title),
        '  ',
        m('span.comment-ago', ago),
      ])
      : m('span', [
        actorName,
        ' liked your comment in ',
        m('span.commented-obj', decoded_title || community_name),
        '  ',
        m('span.comment-ago', ago),
      ]);
  }

  // Get Path to Proposal
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
  };
  const args = comment_id
    ? [root_type, pseudoProposal, { id: comment_id }]
    : [root_type, pseudoProposal];
  const path = (getProposalUrl as any)(...args);

  console.log("wtf", path)
  const pageJump = comment_id
    ? () => jumpHighlightComment(comment_id)
    : () => jumpHighlightComment('parent');

  // Return notification data
  return {
    authorInfo: [[author_chain, author_address]],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump,
    viewCount: view_count,
    likeCount: like_count,
    commentCount: comment_count,
  };
};


// Extracts metadata from Notification
// TODO: DELETE THIS GARBAGE
const getBatchNotificationFields = (
  category,
  data: IPostNotificationData[]
) => {
  if (data.length === 1) {
    return getNotificationFields(category, data[0]);
  }

  const {
    created_at,
    root_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    parent_comment_text,
    chain_id,
    author_address,
    author_chain,
    view_count,
    like_count,
    comment_count,
  } = data[0];

  const ago = getAgo(created_at);

  const authorInfo = _.uniq(
    data.map((d) => `${d.author_chain}#${d.author_address}`)
  ).map((u) => u.split('#'));
  const length = authorInfo.length - 1;
  const community_name = app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  let notificationHeader;
  let notificationBody;
  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.OffchainThread) {
    notificationBody = null;
  }

  const actorName = m(User, {
    user: new AddressInfo(null, author_address, author_chain, null),
    hideAvatar: true,
    hideIdentityIcon: true,
    onclick: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
    },
  });

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' commented on ',
        m('span.commented-obj', decoded_title),
        ' ',
        m('span.comment-ago', ago),
      ])
      : m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' responded in ',
        m('span.commented-obj', decoded_title),
        ' ',
        m('span.comment-ago', ago),
      ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      length > 0 && ` and ${pluralize(length, 'other')}`,
      ' created new threads in ',
      m('span.commented-obj', community_name),
      ' ',
      m('span.comment-ago', ago),
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = !comment_id
      ? m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' mentioned you in ',
        m('span.commented-obj', community_name),
        ' ',
        m('span.comment-ago', ago),
      ])
      : m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' mentioned you in ',
        m('span.commented-obj', decoded_title || community_name),
        ' ',
        m('span.comment-ago', ago),
      ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id
      ? m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' liked the post ',
        m('span.commented-obj', decoded_title),
        ' ',
        m('span.comment-ago', ago),
      ])
      : m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' liked your comment in ',
        m('span.commented-obj', decoded_title || community_name),
        ' ',
        m('span.comment-ago', ago),
      ]);
  }
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
  };
  const args = comment_id
    ? [root_type, pseudoProposal, { id: comment_id }]
    : [root_type, pseudoProposal];
  const path =
    category === NotificationCategories.NewThread
      ? (getCommunityUrl as any)(chain_id)
      : (getProposalUrl as any)(...args);
  const pageJump = comment_id
    ? () => jumpHighlightComment(comment_id)
    : () => jumpHighlightComment('parent');

  return {
    authorInfo,
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump,
    viewCount: view_count,
    likeCount: like_count,
    commentCount: comment_count,
  };
};



const UserDashboardRow: m.Component<
  {
    notification: Notification;
    onListPage?: boolean;
  },
  {
    Labeler: any;
    MolochTypes: any;
    SubstrateTypes: any;
    scrollOrStop: boolean;
    markingRead: boolean;
  }
> = {
  oncreate: (vnode) => { 
    if (
      m.route.param('id') &&
      vnode.attrs.onListPage &&
      m.route.param('id') === vnode.attrs.notification.id.toString()
    ) {
      vnode.state.scrollOrStop = true;
    }
  },
  view: (vnode) => {
    const { notification } = vnode.attrs;
    let category = notification.categoryId;
    // Conditional for Chain Event Notifications
    if (category === NotificationCategories.ChainEvent) {
      if (!notification.chainEvent) {
        throw new Error('chain event notification does not have expected data');
      }
      const chainId = notification.chainEvent.type.chain;
      const chainName = app.config.chains.getById(chainId)?.name;
      let label: IEventLabel;

      if (app.isCustomDomain() && chainId !== app.customDomainId()) return;
      if (chainId == SupportedNetwork.Substrate) {
        label = SubstrateEvents.Label(
          notification.chainEvent.blockNumber,
          chainId,
          notification.chainEvent.data
        );
      } else if (chainId == SupportedNetwork.Moloch) {
        label = MolochEvents.Label(
          notification.chainEvent.blockNumber,
          chainId,
          notification.chainEvent.data
        );
      } else if (chainId == SupportedNetwork.Compound) {
        label = CompoundEvents.Label(
          notification.chainEvent.blockNumber,
          chainId,
          notification.chainEvent.data
        );
      } else if (chainId == SupportedNetwork.Aave) {
        label = AaveEvents.Label(
          notification.chainEvent.blockNumber,
          chainId,
          notification.chainEvent.data
        );
      } else {
        throw new Error(`invalid notification chain: ${chainId}`);
      }
      m.redraw();

      if (vnode.state.scrollOrStop) {
        setTimeout(() => {
          const el = document.getElementById(m.route.param('id'));
          if (el) el.scrollIntoView();
        }, 1);
        vnode.state.scrollOrStop = false;
      }

      if (!label) {
        return m(
          'li.UserDashboardRow',
          {
            class: notification.isRead ? '' : 'unread',
            key: notification.id,
            id: notification.id,
          },
          [m('.comment-body', [m('.comment-body-top', 'Loading...')])]
        );
      }
      return link(
        'a.UserDashboardRow',
        `/notificationsList?id=${notification.id}`,
        [
          m('.comment-body', [
            m('.comment-body-top.chain-event-notification-top', [
              `${label.heading} on ${chainName}`,
              !vnode.attrs.onListPage &&
              m(Icon, {
                name: Icons.X,
                onmousedown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  vnode.state.scrollOrStop = true;
                  app.user.notifications.clear([notification]);
                  m.redraw();
                },
              }),
            ]),
            m(
              '.comment-body-bottom',
              `Block ${notification.chainEvent.blockNumber}`
            ),
            m('.comment-body-excerpt', label.label),
          ]),
        ],
        {
          class: notification.isRead ? '' : 'unread',
          key: notification.id,
          id: notification.id,
        },
        null,
        () => {
          if (vnode.state.scrollOrStop) {
            vnode.state.scrollOrStop = false;
            return;
          }
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.user.notifications
            .markAsRead(notificationArray)
            .then(() => m.redraw());
        },
        () => m.redraw.sync()
      );
    } else {
      const notificationData = JSON.parse(notification.data);
      let {
        authorInfo,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump,
        viewCount,
        likeCount,
        commentCount,
      } = getNotificationFields(category, notificationData);

      // Handle custom domains
      if (app.isCustomDomain()) {
        if (
          path.indexOf(`https://commonwealth.im/${app.customDomainId()}/`) !==
          0 &&
          path.indexOf(`http://localhost:8080/${app.customDomainId()}/`) !== 0
        )
          return;
        path = path
          .replace(`https://commonwealth.im/${app.customDomainId()}/`, '/')
          .replace(`http://localhost:8080/${app.customDomainId()}/`, '/');  
      }

      return m('.UserDashboardRow', {
        onclick: (e) => {
          app.user.notifications.markAsRead([notification]);
          m.route.set(path)
        }
      }, [
        m('.comment-body', {},[
          m('.comment-body-title', notificationHeader),
          notificationBody &&
          category !== `${NotificationCategories.NewReaction}` &&
          category !== `${NotificationCategories.NewThread}` &&
          m('.comment-body-excerpt', notificationBody),
          m('.comment-body-bottom', [
            m('.comment-body-bottom-left', [
              m(CWEngagementButton, {
                buttonSize: 'sm',
                label: "discuss",
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
              }),
              m('.share-button', {
                onclick: (e) => {
                  e.stopPropagation();
                }
              }, [
                m(PopoverMenu, {
                  transitionDuration: 0,
                  closeOnOutsideClick: true,
                  closeOnContentClick: true,
                  menuAttrs: { size: 'default' },
                  content: [
                    m(MenuItem, {
                      iconLeft: Icons.COPY,
                      label: 'Copy URL',
                      onclick: async (e) => {
                        await navigator.clipboard.writeText(path);
                      },
                    }),
                    m(MenuItem, {
                      iconLeft: Icons.TWITTER,
                      label: 'Share on Twitter',
                      onclick: async (e) => {
                        await window.open(`https://twitter.com/intent/tweet?text=${path}`, '_blank');
                      }
                    }),
                  ],
                  trigger: m(CWEngagementButton, {
                    buttonSize: 'sm',
                    label: 'share',
                    className: 'share-button',
                    onclick: (e) => {},
                  }),
                }),
              ]),
              m(CWEngagementButton, {
                buttonSize: 'sm',
                label: 'subscribe',
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
              }),
            ]),
            m('.comment-body-bottom-right', [
              m(Button, {
                iconLeft: Icons.EYE,
                label: viewCount,
                outlined: false,
              }),
              m(Button, {
                iconLeft: Icons.HEART,
                label: likeCount,
                outlined: false,
              }),
              m(Button, {
                iconLeft: Icons.MESSAGE_SQUARE,
                label: commentCount,
                outlined: false,
              }),
            ]),
          ]),
        ]),
      ])
    }
  },
};

export default UserDashboardRow;
