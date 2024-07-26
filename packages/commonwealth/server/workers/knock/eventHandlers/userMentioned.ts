import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models, safeTruncateBody } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
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

  const user = await models.User.findOne({
    where: {
      id: payload.authorUserId,
    },
  });

  if (!user) {
    log.error('Author profile not found', undefined, payload);
    return false;
  }

  return await provider.triggerWorkflow({
    key: WorkflowKeys.UserMentioned,
    users: [{ id: String(payload.mentionedUserId) }],
    data: {
      author_address_id: payload.authorAddressId,
      author_user_id: payload.authorUserId,
      author_address: payload.authorAddress,
      community_id: payload.communityId,
      community_name: community.name,
      author: user.profile.name || payload.authorAddress.substring(255),
      object_body:
        'thread' in payload
          ? // @ts-expect-error StrictNullChecks
            safeTruncateBody(decodeURIComponent(payload.thread.body), 255)
          : // @ts-expect-error StrictNullChecks
            safeTruncateBody(decodeURIComponent(payload.comment.text), 255),
      object_url:
        'thread' in payload
          ? // @ts-expect-error StrictNullChecks
            getThreadUrl(payload.thread.community_id, payload.thread.id)
          : getCommentUrl(
              // @ts-expect-error StrictNullChecks
              payload.comment.community_id,
              // @ts-expect-error StrictNullChecks
              payload.comment.thread_id,
              // @ts-expect-error StrictNullChecks
              payload.comment.id,
            ),
    },
  });
};
