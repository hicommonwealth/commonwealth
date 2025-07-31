import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { getDecodedString, safeTruncateBody } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import z from 'zod';
import {
  getPreviewImageUrl,
  getRenderedTitle,
} from '../../aggregates/webhook/util';
import { config } from '../../config';
import { models } from '../../database';
import { getProfileUrl, getThreadUrl, getTopicUrl } from '../utils/utils';

const log = logger(import.meta);

const output = z.boolean();

export const notifyThreadCreated: EventHandler<
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

  const [webhooks, topicSubscriptions] = await Promise.all([
    models.Webhook.findAll({
      where: {
        community_id: community.id!,
        events: { [Op.contains]: ['ThreadCreated'] },
      },
    }),
    models.TopicSubscription.findAll({
      where: {
        topic_id: payload.topic_id,
      },
      include: [{ model: models.Topic, required: true, attributes: ['name'] }],
    }),
  ]);

  if (!topicSubscriptions.length || !webhooks.length) {
    return true;
  }

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
  const previewImg = getPreviewImageUrl(
    community,
    getDecodedString(payload.body || ''),
  );

  const provider = notificationsProvider();

  const res: PromiseSettledResult<{ workflow_run_id: string }>[][] = [];

  if (topicSubscriptions.length) {
    res.push(
      await provider.triggerWorkflow({
        key: WorkflowKeys.ThreadCreated,
        users: topicSubscriptions.map((t) => ({
          id: t.user_id,
        })),
        data: {
          topic_id: payload.topic_id, // used for batching
          community_name: community.name,
          topic_name: topicSubscriptions[0].Topic!.name,
          topic_url: getTopicUrl(
            community.id!,
            payload.topic_id,
            topicSubscriptions[0].Topic!.name,
            community.custom_domain,
          ),
        },
      }),
    );
  }

  if (webhooks.length) {
    res.push(
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
          title_prefix: 'New thread: ',
          preview_image_url: previewImg.previewImageUrl,
          preview_image_alt_text: previewImg.previewImageAltText,
          profile_name:
            author.User!.profile.name || author.address.substring(0, 8),
          profile_url: getProfileUrl(author.user_id, community.custom_domain),
          profile_avatar_url: author.User!.profile.avatar_url ?? '',
          thread_title: getRenderedTitle(thread!.title),
          object_url: threadURl,
          object_summary: threadSummary,
          content_url: payload.content_url,
          content_type: 'thread',
          thread_id: payload.id!,
          author_user_id: author.user_id,
        },
      }),
    );
  }

  return !res.flat().some((r) => r.status === 'rejected');
};
