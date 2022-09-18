/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import moment from 'moment';

import 'pages/notifications/notification_row.scss';

import app from 'state';
import { IPostNotificationData } from 'types';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import { AddressInfo } from 'models';
import { pluralize } from 'helpers';
import User from 'views/components/widgets/user';
import { getProposalUrl, getCommunityUrl } from 'utils';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import { QuillFormattedText } from '../../components/quill/quill_formatted_text';
import { jumpHighlightComment } from '../view_proposal/helpers';

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
    // TODO Graham 22-6-5: What does this do? How can we simplify to use helper?
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

const getNotificationFields = (category, data: IPostNotificationData) => {
  const {
    created_at,
    root_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    chain_id,
    author_address,
    author_chain,
  } = data;

  const community_name =
    app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  let notificationHeader;

  let notificationBody;

  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.Thread) {
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
          ' commented on ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          ' responded in ',
          m('span.commented-obj', decoded_title),
        ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      ' created a new thread ',
      m('span.commented-obj', decoded_title),
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = m('span', [
      actorName,
      ' mentioned you in ',
      m('span.commented-obj', decoded_title),
    ]);
  } else if (category === `${NotificationCategories.NewCollaboration}`) {
    notificationHeader = m('span', [
      actorName,
      ' added you as a collaborator on ',
      m('span.commented-obj', decoded_title),
    ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id
      ? m('span', [
          actorName,
          ' liked the post ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          ' liked your comment in ',
          m('span.commented-obj', decoded_title || community_name),
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

  const path = (getProposalUrl as any)(...args);

  const pageJump = comment_id
    ? () => jumpHighlightComment(comment_id)
    : () => jumpHighlightComment('parent');

  return {
    authorInfo: [[author_chain, author_address]],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump,
  };
};

export const getBatchNotificationFields = (
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
    chain_id,
    author_address,
    author_chain,
  } = data[0];

  const authorInfo = _.uniq(
    data.map((d) => `${d.author_chain}#${d.author_address}`)
  ).map((u) => u.split('#'));

  const length = authorInfo.length - 1;

  const community_name =
    app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  let notificationHeader;
  let notificationBody;

  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.Thread) {
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
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' responded in ',
          m('span.commented-obj', decoded_title),
        ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      length > 0 && ` and ${pluralize(length, 'other')}`,
      ' created new threads in ',
      m('span.commented-obj', community_name),
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = !comment_id
      ? m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' mentioned you in ',
          m('span.commented-obj', community_name),
        ])
      : m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' mentioned you in ',
          m('span.commented-obj', decoded_title || community_name),
        ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id
      ? m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' liked the post ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' liked your comment in ',
          m('span.commented-obj', decoded_title || community_name),
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
  };
};
