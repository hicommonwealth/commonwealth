import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { safeTruncateBody } from '@hicommonwealth/shared';
import z from 'zod';
import { getCommentUrl } from '../util';

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

  const commentAuthorSubscription = await models.ThreadSubscription.findOne({
    where: {
      user_id: commentAndAuthor.Address.User!.id,
      thread_id: payload.comment_id,
    },
  });
  if (!commentAuthorSubscription) {
    log.debug('Comment author is not subscribed to their thread');
    return true;
  }

  const community = await models.Community.findByPk(payload.community_id, {
    attributes: ['name', 'custom_domain'],
  });
  if (!community) {
    log.error('Community not found!', undefined, payload);
    return false;
  }

  const provider = notificationsProvider();
  return await provider.triggerWorkflow({
    key: WorkflowKeys.NewUpvotes,
    users: [{ id: String(commentAuthorSubscription.user_id) }],
    data: {
      community_id: payload.community_id,
      community_name: community.name,
      reaction: payload.reaction,
      comment_id: payload.comment_id,
      comment_body: safeTruncateBody(commentAndAuthor.text),
      created_at: payload.created_at!.toISOString(),
      object_url: getCommentUrl(
        payload.community_id,
        commentAndAuthor.thread_id,
        payload.comment_id,
        community.custom_domain,
      ),
    },
  });
};
