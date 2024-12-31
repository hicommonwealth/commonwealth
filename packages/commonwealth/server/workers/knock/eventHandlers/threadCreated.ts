import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models, Webhook } from '@hicommonwealth/model';
import { getDecodedString, safeTruncateBody } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import z from 'zod';
import { config } from '../../../config';
import { getProfileUrl, getThreadUrl } from '../util';

const log = logger(import.meta);

const output = z.boolean();

export const processThreadCreated: EventHandler<
  'ThreadCreated',
  typeof output
> = async ({ payload }) => {
  const community = await models.Community.findOne({
    where: { id: payload.community_id },
  });
  if (!community) {
    log.error('Thread community not found!', undefined, {
      payload,
    });
    return false;
  }

  const author = await models.Address.findOne({
    where: { id: payload.address_id },
    include: [{ model: models.User, required: true, attributes: ['profile'] }],
  });

  if (!author || !author.user_id) {
    log.error('Full thread author with profile not found!', undefined, {
      payload,
    });
    return false;
  }

  const webhooks = await models.Webhook.findAll({
    where: {
      community_id: community.id!,
      events: { [Op.contains]: ['ThreadCreated'] },
    },
  });

  if (webhooks.length > 0) {
    const threadSummary = safeTruncateBody(
      getDecodedString(payload.body || ''),
      255,
    );
    const threadURl = getThreadUrl(
      payload.community_id,
      payload.id!,
      community.custom_domain,
    );

    const thread = await models.Thread.findByPk(payload.id, {
      attributes: ['title'],
    });
    const previewImg = Webhook.getPreviewImageUrl(
      community,
      getDecodedString(payload.body || ''),
    );

    const provider = notificationsProvider();

    const res = await provider.triggerWorkflow({
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
        title_prefix: 'New thread: ',
        preview_image_url: previewImg.previewImageUrl,
        preview_image_alt_text: previewImg.previewImageAltText,
        profile_name:
          author.User!.profile.name || author.address.substring(0, 8),
        profile_url: getProfileUrl(author.user_id, community.custom_domain),
        profile_avatar_url: author.User!.profile.avatar_url ?? '',
        object_title: Webhook.getRenderedTitle(thread!.title),
        object_url: threadURl,
        object_summary: threadSummary,
        content_url: payload.content_url,
        content_type: 'thread',
        object_id: payload.id!,
        author_user_id: author.user_id,
      },
    });

    return !res.some((r) => r.status === 'rejected');
  }

  return true;
};
