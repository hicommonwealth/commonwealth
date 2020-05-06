import 'components/sidebar/notification_row.scss';

import m from 'mithril';
import moment from 'moment';
import { ListItem } from 'construct-ui';

import app from 'state';
import { slugify } from 'helpers';
import { NotificationCategories } from 'types';
import { ProposalType } from 'identifiers';
import { Notification } from 'models';
import { IPostNotificationData, ICommunityNotificationData } from 'shared/types';

import QuillFormattedText, { sliceQuill } from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';
import labelEdgewareEvent from '../../../../../shared/events/edgeware/filters/labeler';
import { getProposalUrl } from '../../../../../shared/utils';

interface IHeaderNotificationRow {
  notification: Notification;
}

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    decoded_comment_text = m(QuillFormattedText, { doc: sliceQuill(doc, 140), hideFormatting: true });
  } catch (e) {
    let doc = decodeURIComponent(comment_text);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decoded_comment_text = m(MarkdownFormattedText, { doc: doc.slice(0, 140), hideFormatting: true });
  }
  return decoded_comment_text;
};

const getNotificationFields = (category, data: IPostNotificationData) => {
  const { created_at, root_id, root_title, root_type, comment_id, comment_text, parent_comment_id,
    parent_comment_text, chain_id, community_id, author_address, author_chain } = data;

  const community_name = community_id
    ? (app.config.communities.getById(community_id)?.name || 'Unknown community')
    : (app.config.chains.getById(chain_id)?.name || 'Unknown chain');

  let notificationHeader;
  let notificationBody;
  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.OffchainThread) {
    notificationBody = null;
  }

  const actorName = m(User, { user: [author_address, author_chain], hideAvatar: true });

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [ actorName, ' commented on ', m('span.commented-obj', decoded_title) ])
      : m('span', [ actorName, ' responded in ', m('span.commented-obj', decoded_title) ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [ actorName, ' created a new thread ', m('span.commented-obj', decoded_title) ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = (!comment_id)
      ? m('span', [ actorName, ' mentioned you in ', m('span.commented-obj', community_name) ])
      : m('span', [ actorName, ' mentioned you in ', m('span.commented-obj', decoded_title || community_name) ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = (!comment_id)
      ? m('span', [ actorName, ' reacted to your post ', m('span.commented-obj', decoded_title) ])
      : m('span', [ actorName, ' reacted to your post in ', m('span.commented-obj', decoded_title || community_name) ]);
  }
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };
  const args = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
  const path = (getProposalUrl as any)(...args);
  const pageJump = comment_id ? () => jumpHighlightComment(comment_id) : () => jumpHighlightComment('parent');

  return ({
    author: [author_address, author_chain],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump
  });
};

const HeaderNotificationRow: m.Component<IHeaderNotificationRow> = {
  view: (vnode) => {
    const { notification } = vnode.attrs;
    const { category } = notification.subscription;
    const getHeaderNotificationRow = (userAccount, createdAt, title, excerpt, target: string, next?: Function) => {
      return m('li.HeaderNotificationRow', {
        class: notification.isRead ? '' : 'active',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.login.notifications.markAsRead(notificationArray).then(() => m.redraw());
          await m.route.set(target);
          m.redraw.sync();
          if (next) setTimeout(() => next(), 1);
        },
      }, [
        m(User, { user: userAccount, avatarOnly: true, avatarSize: 36 }),
        m('.comment-body', [
          m('.comment-body-title', title),
          excerpt && m('.comment-body-excerpt', excerpt),
          m('.comment-body-created', createdAt.fromNow()),
        ]),
      ]);
    };

    const {
      author,
      createdAt,
      notificationHeader,
      notificationBody,
      path,
      pageJump
    } = getNotificationFields(category, JSON.parse(notification.data));

    if (category === NotificationCategories.ChainEvent) {
      if (!notification.chainEvent) {
        throw new Error('chain event notification does not have expected data');
      }
      // TODO: use different labelers depending on chain
      const chainId = notification.chainEvent.type.chain;
      const chainName = app.config.chains.getById(chainId).name;
      const label = labelEdgewareEvent(
        notification.chainEvent.blockNumber,
        chainId,
        notification.chainEvent.data,
      );
      return m('li.HeaderNotificationRow', {
        class: notification.isRead ? '' : 'active',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.login.notifications.markAsRead(notificationArray).then(() => m.redraw());
          if (!label.linkUrl) return;
          await m.route.set(label.linkUrl);
          m.redraw.sync();
        },
      }, [
        m('.comment-body', [
          m('.comment-body-top', `${label.heading} on ${chainName}`),
          m('.comment-body-bottom', `Block ${notification.chainEvent.blockNumber}`),
          m('.comment-body-excerpt', label.label),
        ]),
      ]);
    } else {
      const {
        author,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump
      } = getNotificationFields(category, JSON.parse(notification.data));

      return getHeaderNotificationRow(
        author,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump
      );
    }

    // else if (category === NotificationCategories.NewCommunity) {
    //   //const { created_at, proposal_id } = JSON.parse(notification.data);
    //   //const thread = app.threads.store.getByIdentifier(proposal_id);
    //   const community = app.activeId();

    //   return getHeaderHeaderNotificationRow(
    //     moment.utc(created_at),
    //     null,
    //     `New community created`,
    //     '',
    //     `/${community}/`);
    // }
  },
};

export default HeaderNotificationRow;
