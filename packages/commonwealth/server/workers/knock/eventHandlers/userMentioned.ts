import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { getDecodedString, safeTruncateBody } from '@hicommonwealth/shared';
import z from 'zod';
import { config } from '../../../config';
import { getCommentUrl, getThreadUrl } from '../util';

const log = logger(import.meta);

const output = z.void().or(
  z.object({
    success: z.boolean(),
  }),
);

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
    return { success: false };
  }

  const user = await models.User.findOne({
    where: {
      id: payload.authorUserId,
    },
  });

  if (!user) {
    log.error('Author profile not found', undefined, payload);
    return { success: false };
  }

  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.UserMentioned,
    users: [{ id: String(payload.mentionedUserId) }],
    data: {
      author_address_id: payload.authorAddressId,
      author_user_id: payload.authorUserId,
      author_address: payload.authorAddress,
      community_id: payload.communityId,
      community_name: community.name,
      community_icon_url:
        community.icon_url || config.DEFAULT_COMMONWEALTH_LOGO,
      author: user.profile.name || payload.authorAddress.substring(255),
      object_body:
        'thread' in payload
          ? safeTruncateBody(getDecodedString(payload.thread!.body || ''), 255)
          : safeTruncateBody(getDecodedString(payload.comment!.body), 255),
      object_url:
        'thread' in payload
          ? getThreadUrl(
              payload.communityId,
              payload.thread!.id!,
              community.custom_domain,
            )
          : getCommentUrl(
              payload.communityId,
              payload.comment!.thread_id,
              payload.comment!.id!,
              community.custom_domain,
            ),
    },
  });

  return { success: !res.some((r) => r.status === 'rejected') };
};
