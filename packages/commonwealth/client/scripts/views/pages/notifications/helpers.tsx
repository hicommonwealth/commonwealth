import type { IForumNotificationData } from '@hicommonwealth/shared';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import { pluralize } from 'helpers';
import _ from 'lodash';
import moment from 'moment';
import 'pages/notifications/notification_row.scss';
import React from 'react';
import app from 'state';
import { getCommunityUrl, getThreadUrl } from 'utils';
import { User } from 'views/components/user/user';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';

const getNotificationFields = (category, data: IForumNotificationData) => {
  const {
    created_at,
    thread_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    community_id,
    author_address,
    author_community_id,
  } = data;

  let notificationHeader;
  let notificationBody;

  const communityName =
    app.config.chains.getById(community_id)?.name || 'Unknown chain';

  const decodedTitle = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = <QuillRenderer doc={comment_text} />;
  } else if (root_type === ProposalType.Thread) {
    notificationBody = null;
  }

  const actorName = (
    <User
      userAddress={author_address}
      userCommunityId={author_community_id}
      shouldShowAsDeleted={!author_address && !author_community_id}
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
    chain: community_id,
  };

  const path = getThreadUrl(pseudoProposal, comment_id);

  return {
    authorInfo: [[author_community_id, author_address]],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
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
    community_id,
    author_address,
    author_community_id,
  } = data[0];

  const authorInfo = _.uniq(
    data.map((d) => `${d.author_community_id}#${d.author_address}`),
  ).map((u) => u.split('#'));

  const length = authorInfo.length - 1;

  const communityName =
    app.config.chains.getById(community_id)?.name || 'Unknown chain';

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
      userCommunityId={author_community_id}
      shouldShowAsDeleted={!author_address && !author_community_id}
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
    chain: community_id,
  };

  const path =
    category === NotificationCategories.NewThread
      ? getCommunityUrl(community_id)
      : getThreadUrl(pseudoProposal, comment_id);

  return {
    authorInfo,
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
  };
};
