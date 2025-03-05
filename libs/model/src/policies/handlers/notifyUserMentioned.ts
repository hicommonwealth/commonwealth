import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  getDecodedString,
  safeTruncateBody,
  WebhookDestinations,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import z from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { getPreviewImageUrl, getRenderedTitle } from '../../webhook/util';
import { getCommentUrl, getProfileUrl, getThreadUrl } from '../utils/utils';

const log = logger(import.meta);

const output = z.boolean();

export const notifyUserMentioned: EventHandler<
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
  const object_url =
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
        );

  await provider.triggerWorkflow({
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
          ? safeTruncateBody(getDecodedString(payload.thread!.body || ''), 255)
          : safeTruncateBody(getDecodedString(payload.comment!.body), 255),
      object_url,
    },
    actor: {
      id: String(user.id),
      profile_name: user.profile.name || payload.authorAddress.substring(0, 8),
      profile_url: getProfileUrl(user.id!, community.custom_domain),
      email: user.profile.email ?? undefined,
      profile_avatar_url: user.profile.avatar_url ?? undefined,
    },
  });

  // Don't send Eliza webhooks for mentions in comments
  // Comment mentions of Eliza are handled in `commentCreated` handler
  if (!payload.thread) return true;

  const webhooks = await models.Webhook.findAll({
    where: {
      community_id: community.id!,
      events: { [Op.contains]: ['UserMentioned'] },
      destination: WebhookDestinations.Eliza, // Eliza webhooks only for now
      url: {
        [Op.like]: `https://%/eliza/${payload.mentionedUserId}`,
      },
    },
  });

  if (webhooks.length > 0) {
    const previewImg = getPreviewImageUrl(
      community,
      getDecodedString(
        'thread' in payload ? payload.thread!.body : payload.comment!.body,
      ),
    );

    let thread = payload.thread;
    if (!thread || !thread.id) {
      const threadInstance = await models.Thread.findOne({
        where: {
          id: payload.comment!.thread_id,
        },
      });
      if (!threadInstance) throw new Error('Thread not found');
      thread = threadInstance.get({ plain: true });
    }

    await provider.triggerWorkflow({
      key: WorkflowKeys.Webhooks,
      users: webhooks.map((w) => ({
        id: `webhook-${w.id}`,
        webhook_url: w.url,
        destination: w.destination,
        signing_key: w.signing_key,
      })),
      data: {
        sender_username: 'Common',
        sender_avatar_url: config.DEFAULT_COMMONWEALTH_LOGO,
        community_id: community.id!,
        title_prefix: 'thread' in payload ? 'New thread: ' : 'Comment on',
        preview_image_url: previewImg.previewImageUrl,
        preview_image_alt_text: previewImg.previewImageAltText,
        profile_name:
          user.profile.name || payload.authorAddress.substring(0, 8),
        profile_url: getProfileUrl(
          payload.authorUserId,
          community.custom_domain,
        ),
        profile_avatar_url: user.profile.avatar_url ?? '',
        thread_title: getRenderedTitle(thread.title!),
        object_url,
        object_summary: safeTruncateBody(
          'thread' in payload ? payload.thread!.body : payload.comment!.body,
          255,
        ),
        content_url:
          'thread' in payload
            ? payload.thread!.content_url
            : payload.comment!.content_url,
        content_type: 'thread' in payload ? 'thread' : 'comment',
        thread_id: thread.id!,
        comment_id: payload.comment?.id,
        author_user_id: user.id!,
      },
    });
  }

  return true;
};
