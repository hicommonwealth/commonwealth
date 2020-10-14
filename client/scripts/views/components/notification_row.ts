import 'components/sidebar/notification_row.scss';

import _ from 'lodash';
import m from 'mithril';
import moment from 'moment';

import app from 'state';
import { NotificationCategories } from 'types';
import { ProposalType } from 'identifiers';
import { Notification, AddressInfo } from 'models';
import { pluralize } from 'helpers';
import { IPostNotificationData } from 'shared/types';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';
import {
  SubstrateTypes, MolochTypes, SubstrateEvents, MolochEvents, IEventLabel, chainSupportedBy
} from '@commonwealth/chain-events';
import { getProposalUrl, getCommunityUrl } from '../../../../shared/utils';
import UserGallery from './widgets/user_gallery';

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    decoded_comment_text = m(QuillFormattedText, { doc, hideFormatting: true, collapse: true });
  } catch (e) {
    let doc = decodeURIComponent(comment_text);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decoded_comment_text = m(MarkdownFormattedText, { doc: doc.slice(0, 140), hideFormatting: true, collapse: true });
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

  const actorName = m(User, {
    user: new AddressInfo(null, author_address, author_chain, null),
    hideAvatar: true,
    hideIdentityIcon: true,
  });

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [ actorName, ' commented on ', m('span.commented-obj', decoded_title) ])
      : m('span', [ actorName, ' responded in ', m('span.commented-obj', decoded_title) ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [ actorName, ' created a new thread ', m('span.commented-obj', decoded_title) ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = m('span', [ actorName, ' mentioned you in ', m('span.commented-obj', decoded_title) ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = (!comment_id)
      ? m('span', [ actorName, ' liked the post ', m('span.commented-obj', decoded_title) ])
      : m('span', [ actorName, ' liked your comment in ', m('span.commented-obj', decoded_title || community_name) ]);
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
    authorInfo: [[author_chain, author_address]],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump
  });
};

const getBatchNotificationFields = (category, data: IPostNotificationData[]) => {
  if (data.length === 1) {
    return getNotificationFields(category, data[0]);
  }

  const { created_at, root_id, root_title, root_type, comment_id, comment_text, parent_comment_id,
    parent_comment_text, chain_id, community_id, author_address, author_chain } = data[0];

  const authorInfo = _.uniq(data.map((d) => `${d.author_chain}#${d.author_address}`))
    .map((u) => u.split('#'));
  const length = authorInfo.length - 1;
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

  const actorName = m(User, {
    user: new AddressInfo(null, author_address, author_chain, null),
    hideAvatar: true,
    hideIdentityIcon: true,
  });

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' commented on ',
        m('span.commented-obj', decoded_title)
      ])
      : m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' responded in ',
        m('span.commented-obj', decoded_title)
      ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      length > 0 && ` and ${pluralize(length, 'other')}`,
      ' created new threads in ',
      m('span.commented-obj', community_name)
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = (!comment_id)
      ? m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' mentioned you in ',
        m('span.commented-obj', community_name)
      ])
      : m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' mentioned you in ',
        m('span.commented-obj', decoded_title || community_name)
      ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = (!comment_id)
      ? m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' liked the post ',
        m('span.commented-obj', decoded_title)
      ])
      : m('span', [
        actorName,
        length > 0 && ` and ${pluralize(length, 'other')}`,
        ' liked your comment in ',
        m('span.commented-obj', decoded_title || community_name)
      ]);
  }
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
    community: community_id,
  };
  const args = comment_id
    ? [root_type, pseudoProposal, { id: comment_id }]
    : [root_type, pseudoProposal];
  const path = category === NotificationCategories.NewThread
    ? (getCommunityUrl as any)(community_id || chain_id)
    : (getProposalUrl as any)(...args);
  const pageJump = comment_id
    ? () => jumpHighlightComment(comment_id)
    : () => jumpHighlightComment('parent');

  return ({
    authorInfo,
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump
  });
};

const NotificationRow: m.Component<{ notifications: Notification[] }, {
  Labeler: any,
  MolochTypes: any,
  SubstrateTypes: any,
}> = {
  view: (vnode) => {
    const { notifications } = vnode.attrs;
    const notification = notifications[0];
    const { category } = notifications[0].subscription;

    if (category === NotificationCategories.ChainEvent) {
      if (!notification.chainEvent) {
        throw new Error('chain event notification does not have expected data');
      }
      const chainId = notification.chainEvent.type.chain;
      const chainName = app.config.chains.getById(chainId)?.name;
      let label: IEventLabel;
      if (chainSupportedBy(chainId, SubstrateTypes.EventChains)) {
        label = SubstrateEvents.Label(
          notification.chainEvent.blockNumber,
          chainId,
          notification.chainEvent.data,
        );
      } else if (chainSupportedBy(chainId, MolochTypes.EventChains)) {
        label = MolochEvents.Label(
          notification.chainEvent.blockNumber,
          chainId,
          notification.chainEvent.data,
        );
      } else {
        throw new Error(`invalid notification chain: ${chainId}`);
      }
      m.redraw();

      if (!label) {
        return m('li.NotificationRow', {
          class: notification.isRead ? '' : 'unread',
        }, [
          m('.comment-body', [
            m('.comment-body-top', 'Loading...'),
          ]),
        ]);
      }
      return m('li.NotificationRow', {
        class: notification.isRead ? '' : 'unread',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          notificationArray.push(notification);
          app.user.notifications.markAsRead(notificationArray).then(() => m.redraw());
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
      const notificationData = notifications.map((notif) => typeof notif.data === 'string'
        ? JSON.parse(notif.data)
        : notif.data);
      const {
        authorInfo,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump
      } = getBatchNotificationFields(category, notificationData);
      return m('li.NotificationRow', {
        class: notifications[0].isRead ? '' : 'unread',
        onclick: async () => {
          const notificationArray: Notification[] = [];
          app.user.notifications.markAsRead(notifications).then(() => m.redraw());
          await m.route.set(path);
          m.redraw.sync();
          if (pageJump) setTimeout(() => pageJump(), 1);
        },
      }, [
        authorInfo.length === 1
          ? m(User, {
            user: new AddressInfo(
              null,
              (authorInfo[0] as [string, string])[1],
              (authorInfo[0] as [string, string])[0],
              null
            ),
            avatarOnly: true,
            avatarSize: 26,
            popover: true,
          })
          : m(UserGallery, {
            users: authorInfo.map((auth) => new AddressInfo(null, auth[1], auth[0], null)),
            avatarSize: 26,
            popover: true,
          }),
        m('.comment-body', [
          m('.comment-body-title', notificationHeader),
          notificationBody
            && category !== `${NotificationCategories.NewReaction}`
            && m('.comment-body-excerpt', notificationBody),
          m('.comment-body-created', createdAt.fromNow()),
        ]),
      ]);
    }
  },
};

export default NotificationRow;
