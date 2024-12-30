import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models, Webhook } from '@hicommonwealth/model';
import {
  getDecodedString,
  safeTruncateBody,
  WebhookDestinations,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import z from 'zod';
import { config } from '../../../config';
import { getCommentUrl, getProfileUrl, getThreadUrl } from '../util';

const log = logger(import.meta);

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
  });

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
    const previewImg = Webhook.getPreviewImageUrl(
      community,
      getDecodedString(
        'thread' in payload ? payload.thread!.body : payload.comment!.body,
      ),
    );

    let threadTitle = payload.thread?.title;
    if (!threadTitle) {
      const thread = await models.Thread.findOne({
        attributes: ['title'],
        where: {
          id: payload.comment!.thread_id,
        },
      });
      threadTitle = thread?.title;
    }

    await provider.triggerWorkflow({
      key: WorkflowKeys.Webhooks,
      users: webhooks.map((w) => ({
        id: `webhook-${w.id}`,
        webhook_url: w.url,
        destination: w.destination,
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
        object_title: Webhook.getRenderedTitle(threadTitle!),
        object_url,
        object_summary: safeTruncateBody(
          'thread' in payload ? payload.thread!.body : payload.comment!.body,
          255,
        ),
        content_url:
          'thread' in payload
            ? payload.thread!.content_url
            : payload.comment!.content_url,
      },
    });
  }

  return true;
};
