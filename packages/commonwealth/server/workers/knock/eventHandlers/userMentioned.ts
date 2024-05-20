import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
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

  const profile = await models.Profile.findOne({
    where: {
      id: payload.authorProfileId,
    },
  });

  if (!profile) {
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
      author_profile_id: payload.authorProfileId,
      community_id: payload.communityId,
      community_name: community.name,
      author: profile.profile_name || payload.authorAddress.substring(255),
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
