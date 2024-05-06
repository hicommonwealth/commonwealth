import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import { Op } from 'sequelize';
import { ZodUndefined } from 'zod';
import { getCommentUrl } from '../util';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const processCommentCreated: EventHandler<
  'CommentCreated',
  ZodUndefined
> = async ({ payload }) => {
  const author = await models.Address.findOne({
    where: {
      id: payload.address_id,
    },
    include: [{ model: models.Profile, required: true }],
  });

  if (!author) {
    log.error('Comment author with profile not found!', undefined, {
      payload,
    });
    return;
  }

  const community = await models.Community.findOne({
    where: {
      id: payload.community_id,
    },
  });

  if (!community) {
    log.error('Comment community not found!', undefined, {
      payload,
    });
    return;
  }

  const commentSubs = (
    await models.CommentSubscription.findAll({
      where: {
        comment_id: payload.id,
        user_id: { [Op.not]: author.user_id ?? null },
      },
      attributes: ['user_id'],
    })
  ).map((c) => c.user_id);

  if (commentSubs.length > 0) {
    const provider = notificationsProvider();
    await provider.triggerWorkflow({
      key: WorkflowKeys.CommentCreated,
      users: commentSubs.map((u) => ({ id: String(u) })),
      data: {
        author: author.Profile.profile_name || author.address.substring(0, 8),
        comment_parent_name: payload.parent_id ? 'comment' : 'thread',
        community_name: community.name,
        comment_body: payload.text.substring(0, 255),
        comment_url: getCommentUrl(
          payload.community_id,
          payload.thread_id,
          payload.id,
        ),
        comment_created_event: payload,
      },
    });
  }
};
