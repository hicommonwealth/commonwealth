import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import { Op } from 'sequelize';
import z from 'zod';
import { getCommentUrl } from '../util';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const output = z.boolean();

/**
 * This function takes a CommentCreated event and triggers a notifications provider workflow with the user +
 * comment data.
 * @param payload
 * @returns boolean or undefined - A boolean indicating if a workflow was triggered. Undefined is returned if the
 * author or community does not exist
 */
export const processCommentCreated: EventHandler<
  'CommentCreated',
  typeof output
> = async ({ payload }) => {
  const author = await models.Address.findOne({
    where: {
      id: payload.address_id,
    },
    include: [{ model: models.Profile, required: true }],
  });

  if (!author || !author.user_id) {
    log.error('Full comment author with profile not found!', undefined, {
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

  let users: { user_id: number }[] = [];

  if (payload.parent_id) {
    users = (await models.CommentSubscription.findAll({
      where: {
        comment_id: Number(payload.parent_id),
        user_id: { [Op.not]: author.user_id },
      },
      attributes: ['user_id'],
      raw: true,
    })) as { user_id: number }[];
  } else {
    users = (await models.ThreadSubscription.findAll({
      where: {
        thread_id: payload.thread_id,
        user_id: { [Op.not]: author.user_id },
      },
      attributes: ['user_id'],
      raw: true,
    })) as { user_id: number }[];
  }

  if (users.length > 0) {
    const provider = notificationsProvider();

    // TODO: error handling -> Ryan's event handling utility?
    return await provider.triggerWorkflow({
      key: WorkflowKeys.CommentCreation,
      users: users.map((u) => ({ id: String(u.user_id) })),
      data: {
        author: author.Profile.profile_name || author.address.substring(0, 8),
        comment_parent_name: payload.parent_id ? 'comment' : 'thread',
        community_name: community.name,
        comment_body: decodeURIComponent(payload.text).substring(0, 255),
        comment_url: getCommentUrl(
          payload.community_id,
          payload.thread_id,
          payload.id,
        ),
        comment_created_event: payload,
      },
      actor: { id: String(author.user_id) },
    });
  }

  return false;
};
