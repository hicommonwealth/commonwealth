import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  getDecodedString,
  getElizaUserId,
  safeTruncateBody,
  WebhookDestinations,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import z from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { CommentInstance, WebhookInstance } from '../../models';
import { getPreviewImageUrl, getRenderedTitle } from '../../webhook/util';
import { getCommentUrl, getProfileUrl } from '../utils/utils';

const log = logger(import.meta);

const output = z.boolean();

/**
 * This function takes a CommentCreated event and triggers a notifications provider workflow with the user +
 * comment data.
 * @param payload
 * @returns boolean or undefined - A boolean indicating if a workflow was triggered. Undefined is returned if the
 * author or community does not exist
 */
export const notifyCommentCreated: EventHandler<
  'CommentCreated',
  typeof output
> = async ({ payload }) => {
  const author = await models.Address.findOne({
    where: { id: payload.address_id },
    include: [{ model: models.User, required: true, attributes: ['profile'] }],
  });

  if (!author || !author.user_id) {
    log.error('Full comment author with profile not found!', undefined, {
      payload,
    });
    return false;
  }

  const community = await models.Community.findOne({
    where: { id: payload.community_id },
  });

  if (!community) {
    log.error('Comment community not found!', undefined, {
      payload,
    });
    return false;
  }

  let users: { user_id: number }[] = [];
  const excludeUsers: number[] = [author.user_id];
  if (payload.users_mentioned) excludeUsers.push(...payload.users_mentioned);

  if (payload.parent_id) {
    users = (await models.CommentSubscription.findAll({
      where: {
        comment_id: Number(payload.parent_id),
        user_id: { [Op.notIn]: excludeUsers },
      },
      attributes: ['user_id'],
      raw: true,
    })) as { user_id: number }[];
  } else {
    users = (await models.ThreadSubscription.findAll({
      where: {
        thread_id: payload.thread_id,
        user_id: { [Op.notIn]: excludeUsers },
      },
      attributes: ['user_id'],
      raw: true,
    })) as { user_id: number }[];
  }

  const commentSummary = safeTruncateBody(getDecodedString(payload.body), 255);
  const commentUrl = getCommentUrl(
    payload.community_id,
    payload.thread_id,
    // @ts-expect-error StrictNullChecks
    payload.id,
    community.custom_domain,
  );

  if (users.length > 0) {
    const provider = notificationsProvider();

    await provider.triggerWorkflow({
      key: WorkflowKeys.CommentCreation,
      users: users.map((u) => ({ id: String(u.user_id) })),
      data: {
        author: author.User?.profile.name || author.address.substring(0, 8),
        comment_parent_name: payload.parent_id ? 'comment' : 'thread',
        community_name: community.name,
        comment_body: commentSummary,
        comment_url: commentUrl,
        comment_created_event: payload,
      },
      actor: {
        id: String(author.user_id),
        profile_name:
          author.User?.profile.name || author.address.substring(0, 8),
        profile_url: getProfileUrl(author.user_id, community.custom_domain),
        email: author.User?.profile.email ?? undefined,
        profile_avatar_url: author.User?.profile.avatar_url ?? undefined,
      },
    });
  }

  let parentComment: CommentInstance | null = null;

  const allWebhooks = await models.Webhook.findAll({
    where: {
      community_id: community.id!,
      events: { [Op.contains]: ['CommentCreated'] },
    },
  });
  if (allWebhooks.length === 0) return true;

  const webhooks: WebhookInstance[] = [];

  for (const webhook of allWebhooks) {
    if (webhook.destination === WebhookDestinations.Eliza) {
      if (payload.parent_id && !parentComment) {
        parentComment = await models.Comment.findOne({
          where: {
            id: payload.parent_id,
          },
          include: [
            {
              model: models.Address,
              as: 'Address',
              required: true,
              attributes: ['user_id'],
            },
          ],
        });
      }

      const elizaUserId = getElizaUserId(webhook.url);

      // If agent was not mentioned or the comment is not a reply to a previous
      // agent comment don't send a webhook to the agent
      if (
        !payload.users_mentioned?.includes(elizaUserId) &&
        parentComment?.Address?.user_id !== elizaUserId
      )
        continue;
    }

    webhooks.push(webhook);
  }

  const thread = await models.Thread.findByPk(payload.thread_id);
  if (!thread) throw new Error('Thread not found');

  const previewImg = getPreviewImageUrl(
    community,
    getDecodedString(payload.body),
  );

  const provider = notificationsProvider();

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
      title_prefix: 'Comment on: ',
      preview_image_url: previewImg.previewImageUrl,
      preview_image_alt_text: previewImg.previewImageAltText,
      profile_name: author.User!.profile.name || author.address.substring(0, 8),
      profile_url: getProfileUrl(author.user_id, community.custom_domain),
      profile_avatar_url: author.User!.profile.avatar_url ?? '',
      thread_title: getRenderedTitle(thread.title),
      object_url: commentUrl,
      object_summary: commentSummary,
      content_url: payload.content_url,
      content_type: 'comment',
      thread_id: thread.id!,
      comment_id: payload.id!,
      author_user_id: author.user_id,
    },
  });
};
