import _ from 'lodash';
import moment from 'moment';
import React from 'react';

import 'pages/notifications/notification_row.scss';

import { NotificationCategories, ProposalType } from '@hicommonwealth/core';
import type { IForumNotificationData } from 'types';

import { pluralize } from 'helpers';
import app from 'state';
import { getCommunityUrl, getThreadUrl } from 'utils';
import { User } from 'views/components/user/user';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';

const jumpHighlightNotification = (
  commentId,
  shouldScroll = true,
  animationDelayTime = 2000,
) => {
  const $div =
    commentId === 'parent' || commentId === 'body'
      ? $('html, body').find('.ProposalHeader')
      : $('html, body').find(`.comment-${commentId}`);

  if ($div.length === 0) return; // if the passed comment was invalid, abort

  const divTop = $div.position().top;

  const scrollTime = 500; // time to scroll

  // clear any previous animation
  $div.removeClass('highlighted highlightAnimationComplete');

  // scroll to comment if necessary, set highlight, wait, then fade out the highlight
  if (shouldScroll) {
    $('html, body').animate({ scrollTop: divTop }, scrollTime);

    $div.addClass('highlighted');

    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime + scrollTime);
  } else {
    $div.addClass('highlighted');

    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime);
  }
};

const getNotificationFields = (category, data: IForumNotificationData) => {
  const {
    created_at,
    thread_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    chain_id,
    author_address,
    author_chain,
  } = data;

  let notificationHeader;
  let notificationBody;

  const communityName =
    app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  const decodedTitle = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = <QuillRenderer doc={comment_text} />;
  } else if (root_type === ProposalType.Thread) {
    notificationBody = null;
  }

  const actorName = (
    <User
      userAddress={author_address}
      userCommunityId={author_chain}
      shouldHideAvatar
    />
  );

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id ? (
      <div>
        {actorName} commented on {decodedTitle}
      </div>
    ) : (
      <div>
        {actorName} responded in {decodedTitle}
      </div>
    );
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = (
      <div>
        {actorName} created a new thread {decodedTitle}
      </div>
    );
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = (
      <div>
        {actorName} mentioned you in {decodedTitle}
      </div>
    );
  } else if (category === `${NotificationCategories.NewCollaboration}`) {
    notificationHeader = (
      <div>
        {actorName} added you as a collaborator on {decodedTitle}
      </div>
    );
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id ? (
      <div>
        {actorName} liked the post {decodedTitle}
      </div>
    ) : (
      <div>
        {actorName} liked your comment in {decodedTitle || communityName}
      </div>
    );
  }

  const pseudoProposal = {
    id: thread_id,
    title: root_title,
    chain: chain_id,
  };

  const path = getThreadUrl(pseudoProposal, comment_id);

  const pageJump = comment_id
    ? () => jumpHighlightNotification(comment_id)
    : () => jumpHighlightNotification('parent');

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
  data: IForumNotificationData[],
) => {
  if (data.length === 1) {
    return getNotificationFields(category, data[0]);
  }

  const {
    created_at,
    thread_id,
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
    data.map((d) => `${d.author_chain}#${d.author_address}`),
  ).map((u) => u.split('#'));

  const length = authorInfo.length - 1;

  const communityName =
    app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  let notificationHeader;
  let notificationBody;
  const decodedTitle = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = <QuillRenderer doc={comment_text} />;
  } else if (root_type === ProposalType.Thread) {
    notificationBody = null;
  }

  const actorName = (
    <User
      userAddress={author_address}
      userCommunityId={author_chain}
      shouldHideAvatar
    />
  );

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id ? (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} commented on
        {decodedTitle}
      </div>
    ) : (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} responded in
        {decodedTitle}
      </div>
    );
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} created new threads
        in {communityName}
      </div>
    );
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = !comment_id ? (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} mentioned you in{' '}
        {communityName}
      </div>
    ) : (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} mentioned you in{' '}
        {decodedTitle || communityName}
      </div>
    );
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id ? (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} liked the post{' '}
        {communityName}
      </div>
    ) : (
      <div>
        {actorName}
        {length > 0 && ` and ${pluralize(length, 'other')}`} liked your comment
        in {decodedTitle || communityName}
      </div>
    );
  }

  const pseudoProposal = {
    id: thread_id,
    title: root_title,
    chain: chain_id,
  };

  const path =
    category === NotificationCategories.NewThread
      ? getCommunityUrl(chain_id)
      : getThreadUrl(pseudoProposal, comment_id);

  const pageJump = comment_id
    ? () => jumpHighlightNotification(comment_id)
    : () => jumpHighlightNotification('parent');

  return {
    authorInfo,
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump,
  };
};
