import 'components/user_dashboard_row.scss';

import { Icons, Button, MenuItem, PopoverMenu } from 'construct-ui';
import { capitalize } from 'lodash';
import m from 'mithril';
import {
  CWEvent,
  Label as ChainEventLabel,
  // CompoundEvents
} from 'chain-events/src';
import moment from 'moment';

import app from 'state';
import { NotificationCategories } from 'common-common/src/types';
import {
  AddressInfo,
  DashboardActivityNotification,
  NotificationSubscription,
} from 'models';

import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import User from 'views/components/widgets/user';
import { formatTimestamp } from 'helpers/index';

import { notifySuccess } from 'controllers/app/notifications';
import { getProposalUrlPath } from '../../identifiers';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';

const getCommentPreview = (commentText) => {
  // TODO Graham 6-5-22: Duplicate with notification_row.ts? See relevant note there
  let decodedCommentText;
  try {
    const doc = JSON.parse(decodeURIComponent(commentText));
    if (!doc.ops) throw new Error();
    decodedCommentText = m(QuillFormattedText, {
      doc,
      hideFormatting: true,
      collapse: false,
    });
  } catch (e) {
    let doc = decodeURIComponent(commentText);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decodedCommentText = m(MarkdownFormattedText, {
      doc: doc.slice(0, 140),
      hideFormatting: true,
      collapse: true,
    });
  }
  return decodedCommentText;
};

// Subscriptions
const subscribeToThread = async (
  threadId: string,
  bothActive: boolean,
  commentSubscription: NotificationSubscription,
  reactionSubscription: NotificationSubscription
) => {
  const adjustedId = `discussion_${threadId}`;
  if (bothActive) {
    await app.user.notifications.disableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);
    notifySuccess('Unsubscribed!');
  } else if (!commentSubscription || !reactionSubscription) {
    await Promise.all([
      app.user.notifications.subscribe(
        NotificationCategories.NewReaction,
        adjustedId
      ),
      app.user.notifications.subscribe(
        NotificationCategories.NewComment,
        adjustedId
      ),
    ]);
    notifySuccess('Subscribed!');
  } else {
    await app.user.notifications.enableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);
    notifySuccess('Subscribed!');
  }
};

// Discuss, Share, and Subscribe Buttons
const ButtonRow: m.Component<{
  path: string;
  threadId: string;
  showDiscussion: boolean;
  showShare: boolean;
  showSubscribe: boolean;
}> = {
  view: (vnode) => {
    const { path, threadId, showDiscussion, showShare, showSubscribe } =
      vnode.attrs;

    const adjustedId = `discussion_${threadId}`;
    const commentSubscription = app.user.notifications.subscriptions.find(
      (v) =>
        v.objectId === adjustedId &&
        v.category === NotificationCategories.NewComment
    );
    const reactionSubscription = app.user.notifications.subscriptions.find(
      (v) =>
        v.objectId === adjustedId &&
        v.category === NotificationCategories.NewReaction
    );
    const bothActive =
      commentSubscription?.isActive && reactionSubscription?.isActive;

    return m('.icon-row-left', [
      showDiscussion &&
        m(Button, {
          label: 'Discuss',
          buttonSize: 'sm',
          iconLeft: Icons.PLUS,
          rounded: true,
          onclick: (e) => {
            e.stopPropagation();
            m.route.set(path);
          },
        }),
      showShare &&
        m(
          '.share-button',
          {
            onclick: (e) => {
              e.stopPropagation();
            },
          },
          [
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
                    await window.open(
                      `https://twitter.com/intent/tweet?text=${path}`,
                      '_blank'
                    );
                  },
                }),
              ],
              trigger: m(Button, {
                buttonSize: 'sm',
                label: 'Share',
                iconLeft: Icons.SHARE,
                rounded: true,
              }),
            }),
          ]
        ),
      showSubscribe &&
        m(Button, {
          buttonSize: 'sm',
          label: bothActive ? 'Unsubscribe' : 'Subscribe',
          iconLeft: Icons.BELL,
          rounded: true,
          class: bothActive ? 'subscribe-button' : '',
          onclick: (e) => {
            e.stopPropagation();
            subscribeToThread(
              threadId,
              bothActive,
              commentSubscription,
              reactionSubscription
            );
          },
        }),
    ]);
  },
};

// The Likes, Comments, Views Counters
const ActivityIcons: m.Component<{
  viewCount: number;
  likeCount: number;
  commentCount: number;
}> = {
  view: (vnode) => {
    const { viewCount, likeCount, commentCount } = vnode.attrs;

    return m('.icon-row-right', [
      viewCount &&
        viewCount > 0 &&
        m(Button, {
          iconLeft: Icons.EYE,
          label: viewCount,
          compact: true,
          outlined: false,
        }),
      likeCount &&
        likeCount > 0 &&
        m(Button, {
          iconLeft: Icons.HEART,
          label: likeCount,
          compact: true,
          outlined: false,
        }),
      commentCount &&
        commentCount > 0 &&
        m(Button, {
          iconLeft: Icons.MESSAGE_SQUARE,
          label: commentCount,
          compact: true,
          outlined: false,
        }),
    ]);
  },
};

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

    const { likeCount, viewCount, commentCount } = vnode.attrs.activityData;

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

const UserDashboardRow: m.Component<
  {
    notification: DashboardActivityNotification;
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
  view: (vnode) => {
    const {
      likeCount,
      viewCount,
      commentCount,
      categoryId,
      threadId,
      createdAt,
      typeId,
      updatedAt,
      blockNumber,
      eventNetwork,
      chain,
      iconUrl,
    } = vnode.attrs.notification;

    // ----------- Handle Chain Events ----------- //
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

    // ----------- Handle Notifications ----------- //
    const {
      created_at,
      chain_id,
      root_id,
      root_title,
      author_chain,
      author_address,
      comment_text,
      root_type,
    } = JSON.parse(vnode.attrs.notification.notificationData);

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
        m('.icon-row', [
          m(ButtonRow, {
            path,
            threadId,
            showDiscussion: true,
            showShare: true,
            showSubscribe: true,
          }),
          m(ActivityIcons, {
            viewCount,
            commentCount,
            likeCount,
          }),
        ]),
      ]
    );
  },
};

export default UserDashboardRow;
