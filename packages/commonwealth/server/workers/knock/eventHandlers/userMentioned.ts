import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import z from 'zod';
import { getCommentUrl, getThreadUrl } from '../util';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const output = z.boolean();

export const processUserMentioned: EventHandler<
  'UserMentioned',
  typeof output
> = async ({ payload }) => {
  const provider = notificationsProvider();

  const community = await models.Community.findOne({
    where: {
      id: payload.communityId,
    },
  });

  if (!community) {
    log.error('Community not found', undefined, {
      payload,
    });
    return false;
  }

  return await provider.triggerWorkflow({
    key: WorkflowKeys.UserMentioned,
    users: [{ id: String(payload.mentionedUserId) }],
    data: {
      community_name: community.name,
      author: payload.authorProfileName || payload.authorAddress.substring(255),
      object_body:
        'thread' in payload
          ? payload.thread.body.substring(255)
          : payload.comment.text.substring(255),
      object_url:
        'thread' in payload
          ? getThreadUrl(payload.thread.community_id, payload.thread.id)
          : getCommentUrl(
              payload.comment.community_id,
              payload.comment.thread_id,
              payload.comment.id,
            ),
    },
  });
};
