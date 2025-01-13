import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { getDecodedString, safeTruncateBody } from '@hicommonwealth/shared';
import z from 'zod';
import { models } from '../../database';
import { getCommentUrl } from '../utils/utils';

const log = logger(import.meta);
const output = z.boolean();

export const processCommentUpvoted: EventHandler<
  'CommentUpvoted',
  typeof output
> = async ({ payload }) => {
  const commentAndAuthor = await models.Comment.findOne({
    where: {
      id: payload.comment_id,
    },
    include: [
      {
        model: models.Address,
        as: 'Address',
        required: true,
        attributes: ['id'],
        include: [
          {
            model: models.User,
            required: true,
          },
        ],
      },
    ],
  });

  if (!commentAndAuthor) {
    log.error('Comment not found!', undefined, payload);
    return false;
  }

  if (!commentAndAuthor.Address) {
    log.error('Comment author not found!', undefined, payload);
    return false;
  }

  const commentAuthorSubscription = await models.CommentSubscription.findOne({
    where: {
      user_id: commentAndAuthor.Address.User!.id,
      comment_id: payload.comment_id,
    },
  });
  if (!commentAuthorSubscription) {
    log.debug('Comment author is not subscribed to their thread');
    return true;
  }

  const thread = await models.Thread.findOne({
    where: {
      id: commentAndAuthor.thread_id,
    },
    include: [
      {
        model: models.Community,
        as: 'Community',
        required: true,
      },
    ],
  });

  if (!thread) {
    log.error('Thread not found!', undefined, payload);
    return false;
  }

  if (!thread.Community) {
    log.error('Community not found!', undefined, payload);
    return false;
  }

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.NewUpvotes,
    users: [{ id: String(commentAuthorSubscription.user_id) }],
    data: {
      community_id: thread.Community.id!,
      community_name: thread.Community.name,
      reaction: payload.reaction,
      comment_id: payload.comment_id,
      comment_body: safeTruncateBody(
        getDecodedString(commentAndAuthor.body),
        255,
      ),
      created_at: payload.created_at!.toISOString(),
      object_url: getCommentUrl(
        thread.Community.id!,
        commentAndAuthor.thread_id,
        payload.comment_id,
        thread.Community.custom_domain,
      ),
    },
  });

  return !res.some((r) => r.status === 'rejected');
};
