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
import { getCommentUrl, getProfileUrl } from '../util';

const log = logger(import.meta);

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
        // @ts-expect-error StrictNullChecks
        author: author.User.profile.name || author.address.substring(0, 8),
        comment_parent_name: payload.parent_id ? 'comment' : 'thread',
        community_name: community.name,
        comment_body: commentSummary,
        comment_url: commentUrl,
        comment_created_event: payload,
      },
      actor: { id: String(author.user_id) },
    });
  }

  const webhooks = await models.Webhook.findAll({
    where: {
      community_id: community.id!,
      events: { [Op.contains]: ['CommentCreated'] },
    },
  });
  if (webhooks.length > 0) {
    const thread = await models.Thread.findByPk(payload.thread_id, {
      attributes: ['title'],
    });
    const previewImg = Webhook.getPreviewImageUrl(
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
      })),
      data: {
        sender_username: 'Common',
        sender_avatar_url: config.DEFAULT_COMMONWEALTH_LOGO,
        community_id: community.id!,
        title_prefix: 'Comment on: ',
        preview_image_url: previewImg.previewImageUrl,
        preview_image_alt_text: previewImg.previewImageAltText,
        profile_name:
          author.User!.profile.name || author.address.substring(0, 8),
        profile_url: getProfileUrl(author.user_id, community.custom_domain),
        profile_avatar_url: author.User!.profile.avatar_url ?? '',
        object_title: Webhook.getRenderedTitle(thread!.title),
        object_url: commentUrl,
        object_summary: commentSummary,
      },
    });
  }

  return true;
};
